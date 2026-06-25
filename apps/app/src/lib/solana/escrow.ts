import {
  PublicKey,
  Transaction,
  SystemProgram,
  Connection,
  Keypair,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import {
  ESCROW_PROGRAM_ID,
  USDC_MINT,
  VAULT_TOKEN_ACCOUNT,
  MIN_DEPOSIT_AMOUNT,
  PROGRAM_SEED,
  ESCROW_SEED,
} from './config';

// ── PDA derivation ─────────────────────────────────────────────────

export function getEscrowPda(
  user: PublicKey,
  packageName: string,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from(PROGRAM_SEED),
      Buffer.from(ESCROW_SEED),
      user.toBuffer(),
      Buffer.from(packageName),
    ],
    ESCROW_PROGRAM_ID,
  );
}

export function getEscrowAta(escrowPda: PublicKey): PublicKey {
  return getAssociatedTokenAddressSync(
    USDC_MINT,
    escrowPda,
    true, // allow PDA owner
  );
}

// ── Instruction builders ───────────────────────────────────────────

/**
 * Build a `deposit` transaction.
 * Transfers USDC from user → escrow PDA.
 */
export function buildDepositTx(
  user: PublicKey,
  userTokenAccount: PublicKey,
  packageName: string,
  amount: number = MIN_DEPOSIT_AMOUNT,
): Transaction {
  const [escrowPda] = getEscrowPda(user, packageName);
  const escrowAta = getEscrowAta(escrowPda);

  // Serialize instruction data: fn discriminator (anchor) + packageName + amount
  // Anchor instruction discriminator = sha256("global:deposit")[..8]
  const discriminator = Buffer.from([
    238, 54, 211, 174, 240, 127, 54, 131,
  ]);

  // packageName as a string with length prefix
  const nameBytes = Buffer.from(packageName, 'utf-8');
  const nameLen = Buffer.alloc(4);
  nameLen.writeUInt32LE(nameBytes.length);

  // amount as u64 (8 bytes, little-endian)
  const amountBuf = Buffer.alloc(8);
  amountBuf.writeBigUInt64LE(BigInt(amount));

  const data = Buffer.concat([discriminator, nameLen, nameBytes, amountBuf]);

  const ix = {
    programId: ESCROW_PROGRAM_ID,
    keys: [
      { pubkey: user, isSigner: true, isWritable: true },
      { pubkey: escrowPda, isSigner: false, isWritable: true },
      { pubkey: userTokenAccount, isSigner: false, isWritable: true },
      { pubkey: escrowAta, isSigner: false, isWritable: true },
      { pubkey: VAULT_TOKEN_ACCOUNT, isSigner: false, isWritable: true },
      { pubkey: USDC_MINT, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  };

  return new Transaction().add(ix);
}

/**
 * Build a `give_in` transaction.
 * Forfeits the $5 from escrow → Screenly vault.
 * User signs to admit they gave in.
 */
export function buildGiveInTx(
  user: PublicKey,
  packageName: string,
): Transaction {
  const [escrowPda] = getEscrowPda(user, packageName);
  const escrowAta = getEscrowAta(escrowPda);

  const discriminator = Buffer.from([
    167, 109, 153, 56, 229, 118, 195, 123,
  ]);

  const data = discriminator;

  const ix = {
    programId: ESCROW_PROGRAM_ID,
    keys: [
      { pubkey: user, isSigner: true, isWritable: true },
      { pubkey: escrowPda, isSigner: false, isWritable: true },
      { pubkey: escrowAta, isSigner: false, isWritable: true },
      { pubkey: VAULT_TOKEN_ACCOUNT, isSigner: false, isWritable: true },
      { pubkey: USDC_MINT, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    data,
  };

  return new Transaction().add(ix);
}

/**
 * Build a `remove` transaction.
 * Forfeits $5 from escrow → Screenly vault + closes escrow.
 * User signs to confirm removal.
 */
export function buildRemoveTx(
  user: PublicKey,
  packageName: string,
): Transaction {
  const [escrowPda] = getEscrowPda(user, packageName);
  const escrowAta = getEscrowAta(escrowPda);

  const discriminator = Buffer.from([
    5, 130, 205, 50, 171, 84, 206, 250,
  ]);

  const data = discriminator;

  const ix = {
    programId: ESCROW_PROGRAM_ID,
    keys: [
      { pubkey: user, isSigner: true, isWritable: true },
      { pubkey: escrowPda, isSigner: false, isWritable: true },
      { pubkey: escrowAta, isSigner: false, isWritable: true },
      { pubkey: VAULT_TOKEN_ACCOUNT, isSigner: false, isWritable: true },
      { pubkey: USDC_MINT, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    data,
  };

  return new Transaction().add(ix);
}

// ── Send transaction ───────────────────────────────────────────────

export async function sendAndConfirmTx(
  connection: Connection,
  tx: Transaction,
  signer: Keypair,
): Promise<string> {
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  tx.feePayer = signer.publicKey;
  tx.sign(signer);
  const sig = await connection.sendRawTransaction(tx.serialize());
  await connection.confirmTransaction(sig, 'confirmed');
  return sig;
}
