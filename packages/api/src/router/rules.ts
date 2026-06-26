import { z } from 'zod'
import { db } from '@screen/db'
import * as schema from '@screen/db/schema'
import { eq, and } from 'drizzle-orm'
import { authedProcedure } from '../base'
import { Connection, PublicKey, Keypair, SystemProgram, Transaction, sendAndConfirmTransaction } from '@solana/web3.js'
import { getAssociatedTokenAddressSync, createAssociatedTokenAccountInstruction, createMintToInstruction } from '@solana/spl-token'
import * as fs from 'fs'
import * as path from 'path'

export const listRules = authedProcedure
  .route({ method: 'GET', path: '/rules' })
  .handler(({ context }) => {
    return db
      .select()
      .from(schema.appRules)
      .where(eq(schema.appRules.userId, context.user.id))

  })

export const createRule = authedProcedure
  .route({ method: 'POST', path: '/rules' })
  .input(z.object({
    packageName: z.string(),
    appName: z.string(),
    ruleType: z.enum(['daily_limit', 'schedule', 'block_always']),
    limitMinutes: z.number().int().optional(),
    period: z.enum(['daily', 'hourly']).optional(),
    scheduleStart: z.string().optional(),
    scheduleEnd: z.string().optional(),
    enabled: z.boolean().optional(),
  }))
  .handler(async ({ input, context }) => {
    const [rule] = await db
      .insert(schema.appRules)
      .values({
        userId: context.user.id,
        packageName: input.packageName,
        appName: input.appName,
        ruleType: input.ruleType,
        limitMinutes: input.limitMinutes ?? null,
        period: input.period ?? 'daily',
        scheduleStart: input.scheduleStart ?? null,
        scheduleEnd: input.scheduleEnd ?? null,
        enabled: input.enabled ?? true,
      })
      .returning()
    return rule
  })

export const updateRule = authedProcedure
  .route({ method: 'PATCH', path: '/rules/{id}' })
  .input(z.object({
    id: z.string(),
    packageName: z.string().optional(),
    appName: z.string().optional(),
    ruleType: z.enum(['daily_limit', 'schedule', 'block_always']).optional(),
    limitMinutes: z.number().int().optional(),
    period: z.enum(['daily', 'hourly']).optional(),
    scheduleStart: z.string().optional(),
    scheduleEnd: z.string().optional(),
    enabled: z.boolean().optional(),
  }))
  .handler(async ({ input, context }) => {
    const { id, ...updates } = input
    const [updated] = await db
      .update(schema.appRules)
      .set(updates)
      .where(and(eq(schema.appRules.id, id), eq(schema.appRules.userId, context.user.id)))
      .returning()
    if (!updated) throw new Error('Not found')
    return updated
  })

export const deleteRule = authedProcedure
  .route({ method: 'DELETE', path: '/rules/{id}' })
  .input(z.object({ id: z.string() }))
  .handler(async ({ input, context }) => {
    const deleted = await db
      .delete(schema.appRules)
      .where(and(eq(schema.appRules.id, input.id), eq(schema.appRules.userId, context.user.id)))
      .returning()
    if (!deleted.length) throw new Error('Not found')
    return { success: true }
  })

export const updateUserWallet = authedProcedure
  .route({ method: 'POST', path: '/user/wallet' })
  .input(z.object({ solanaWallet: z.string() }))
  .handler(async ({ input, context }) => {
    const [updated] = await db
      .update(schema.user)
      .set({ solanaWallet: input.solanaWallet })
      .where(eq(schema.user.id, context.user.id))
      .returning()
    if (!updated) throw new Error('User not found')
    return { success: true }
  })

export const fundDevnetWallet = authedProcedure
  .route({ method: 'POST', path: '/devnet/fund' })
  .input(z.object({
    walletAddress: z.string(),
    usdcAmount: z.number(),
  }))
  .handler(async ({ input }) => {
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed')
    const userPubkey = new PublicKey(input.walletAddress)

    // 1. Get Faucet Keypair (reads from environment variable SOLANA_FAUCET_PRIVATE_KEY)
    let secretKeyArray: number[]
    if (process.env.SOLANA_FAUCET_PRIVATE_KEY) {
      secretKeyArray = JSON.parse(process.env.SOLANA_FAUCET_PRIVATE_KEY)
    } else {
      // Fallback to local program keypair during development
      // We resolve relative to the workspace packages/api directory
      const kpPath = path.resolve('./apps/screenly-escrow/keypair.json')
      const fallbackPath = path.resolve('../../apps/screenly-escrow/keypair.json')
      const targetPath = fs.existsSync(kpPath) ? kpPath : fallbackPath

      if (fs.existsSync(targetPath)) {
        secretKeyArray = JSON.parse(fs.readFileSync(targetPath, 'utf8'))
      } else {
        throw new Error(`Solana faucet keypair not configured. Checked paths: ${kpPath}, ${fallbackPath}`)
      }
    }
    const faucetKeypair = Keypair.fromSecretKey(Uint8Array.from(secretKeyArray))

    // 2. Fetch balances to check if user needs SOL and USDC
    const solBalance = await connection.getBalance(userPubkey)
    const usdcMint = new PublicKey('BFNCYpxJyjeBosNGodRP9qWLybRtyRMyfyFxkdoXvsCx')
    const userAta = getAssociatedTokenAddressSync(usdcMint, userPubkey)

    let usdcBalance = 0
    let ataExists = true
    try {
      const balanceInfo = await connection.getTokenAccountBalance(userAta)
      usdcBalance = balanceInfo.value.uiAmount ?? 0
    } catch {
      ataExists = false
    }

    const tx = new Transaction()

    // 3. Fund SOL if needed (needs >= 0.01 SOL)
    // Send 0.05 SOL to cover a few deposits/claims
    if (solBalance < 0.01 * 1e9) {
      tx.add(
        SystemProgram.transfer({
          fromPubkey: faucetKeypair.publicKey,
          toPubkey: userPubkey,
          lamports: 0.05 * 1e9,
        })
      )
    }

    // 4. Create ATA if it doesn't exist
    if (!ataExists) {
      tx.add(
        createAssociatedTokenAccountInstruction(
          faucetKeypair.publicKey, // payer
          userAta,
          userPubkey,
          usdcMint
        )
      )
    }

    // 5. Mint USDC to user's ATA if balance is less than required
    if (usdcBalance < input.usdcAmount) {
      const usdcDecimals = 9
      const mintAmount = BigInt(Math.ceil((input.usdcAmount - usdcBalance) * 10 ** usdcDecimals))
      tx.add(
        createMintToInstruction(
          usdcMint,
          userAta,
          faucetKeypair.publicKey, // mint authority
          mintAmount
        )
      )
    }

    // 6. Send transaction if there's anything to execute
    if (tx.instructions.length > 0) {
      tx.feePayer = faucetKeypair.publicKey
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
      await sendAndConfirmTransaction(connection, tx, [faucetKeypair])
    }

    return { success: true }
  })

