import { z } from 'zod'
import { db } from '@screen/db'
import * as schema from '@screen/db/schema'
import { eq, and } from 'drizzle-orm'
import { authedProcedure } from '../base'
import { ORPCError } from '@orpc/client'
import { forfeitAmount, minutesUntilMidnight, challengeEndsAt, tierMinor } from '@screen/monetization'
import { verifyStakePurchase, refundPlayPurchase, type RefundStatus } from '../play'

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

// --- Challenge stakes -------------------------------------------------------
// A challenge is the period a user commits to leaving an app blocked. The stake
// is their own money: 0% forfeited if they complete it, a slice if they unlock
// temporarily, all of it if they give up. Percentages live in
// @screen/monetization so the app can quote the exact same numbers.

const loadOwnedRule = async (id: string, userId: string) => {
  const [rule] = await db
    .select()
    .from(schema.appRules)
    .where(and(eq(schema.appRules.id, id), eq(schema.appRules.userId, userId)))
    .limit(1)
  if (!rule) throw new ORPCError('Rule not found')
  return rule
}

export const unlockChallenge = authedProcedure
  .route({ method: 'POST', path: '/rules/{id}/unlock' })
  .input(z.object({ id: z.string() }))
  .handler(async ({ input, context }) => {
    const rule = await loadOwnedRule(input.id, context.user.id)
    if (rule.stakeStatus !== 'active') throw new ORPCError('This challenge is already over')
    // One temporary unlock per challenge — otherwise "pay once, unlock all day"
    // is cheaper than any fee and the lock stops meaning anything.
    if (rule.forfeitedAmount > 0) throw new ORPCError('You already used your unlock on this challenge')

    const stake = rule.lockedAmount ?? 0
    const cost = forfeitAmount(stake, 'unlock')
    await db
      .update(schema.appRules)
      .set({ forfeitedAmount: cost })
      .where(eq(schema.appRules.id, rule.id))

    return {
      forfeitedAmount: cost,
      stakeAmount: stake,
      remainingAmount: stake - cost,
      currency: rule.stakeCurrency ?? 'INR',
      minutesUnlocked: minutesUntilMidnight(),
    }
  })

export const giveUpChallenge = authedProcedure
  .route({ method: 'POST', path: '/rules/{id}/give-up' })
  .input(z.object({ id: z.string() }))
  .handler(async ({ input, context }) => {
    const rule = await loadOwnedRule(input.id, context.user.id)
    const stake = rule.lockedAmount ?? 0
    // The row stays so the stake has a record; enabled=false stops the enforcer
    // from blocking (syncRules filters on paymentStatus + enabled).
    await db
      .update(schema.appRules)
      .set({ enabled: false, stakeStatus: 'forfeited', forfeitedAmount: stake })
      .where(eq(schema.appRules.id, rule.id))

    return {
      forfeitedAmount: stake,
      stakeAmount: stake,
      remainingAmount: 0,
      currency: rule.stakeCurrency ?? 'INR',
    }
  })

// --- Google Play stake purchases -------------------------------------------

/**
 * Step 1 of buying a stake on Android: reserve the rule, disabled, with the
 * amount it will cost. Nothing is active until Play confirms the payment.
 */
export const beginStake = authedProcedure
  .route({ method: 'POST', path: '/rules/begin-stake' })
  .input(z.object({
    packageName: z.string(),
    appName: z.string(),
    ruleType: z.enum(['daily_limit', 'schedule', 'block_always']),
    limitMinutes: z.number().int().optional(),
    period: z.enum(['daily', 'hourly']).optional(),
    scheduleStart: z.string().optional(),
    scheduleEnd: z.string().optional(),
    tierId: z.string(),
    currency: z.enum(['INR', 'USD']).default('INR'),
  }))
  .handler(async ({ input, context }) => {
    const stake = tierMinor(input.tierId, input.currency)
    if (stake === null) throw new ORPCError('Unknown stake amount')

    const [existing] = await db
      .select()
      .from(schema.appRules)
      .where(and(
        eq(schema.appRules.packageName, input.packageName),
        eq(schema.appRules.userId, context.user.id),
      ))
      .limit(1)

    const values = {
      appName: input.appName,
      ruleType: input.ruleType,
      limitMinutes: input.limitMinutes ?? null,
      period: input.period ?? 'daily',
      scheduleStart: input.scheduleStart ?? null,
      scheduleEnd: input.scheduleEnd ?? null,
      enabled: false,
      paymentStatus: 'pending' as const,
      lockedAmount: stake,
      stakeCurrency: input.currency,
      stakeTierId: input.tierId,
      stakeStatus: 'active' as const,
      forfeitedAmount: 0,
      playPurchaseToken: null,
      playOrderId: null,
    }

    if (existing) {
      const [updated] = await db
        .update(schema.appRules)
        .set(values)
        .where(eq(schema.appRules.id, existing.id))
        .returning()
      return { ruleId: updated.id }
    }
    const [inserted] = await db
      .insert(schema.appRules)
      .values({ userId: context.user.id, packageName: input.packageName, ...values })
      .returning()
    return { ruleId: inserted.id }
  })

/**
 * Step 2: Google Play says the user paid. Verify it on Google's servers (never
 * trust the client), store the token, and start the challenge clock.
 */
export const confirmStakePurchase = authedProcedure
  .route({ method: 'POST', path: '/rules/confirm-stake' })
  .input(z.object({ ruleId: z.string(), purchaseToken: z.string() }))
  .handler(async ({ input, context }) => {
    const rule = await loadOwnedRule(input.ruleId, context.user.id)
    if (rule.paymentStatus === 'completed') return { success: true, alreadyPaid: true }
    if (!rule.stakeTierId) throw new ORPCError('This challenge has no stake product')

    // Ask Google what was actually charged, then price the challenge from our
    // own table for that currency. The client is never the source of the amount.
    const { orderId, paidMinor, currency } = await verifyStakePurchase(
      input.purchaseToken,
      rule.stakeTierId,
    )
    if (currency !== 'INR' && currency !== 'USD') {
      throw new ORPCError(`Unsupported stake currency: ${currency}`)
    }
    const expected = tierMinor(rule.stakeTierId, currency)
    if (expected === null || expected !== paidMinor) {
      throw new ORPCError(
        `Stake mismatch: Google charged ${paidMinor} ${currency}, this challenge costs ${expected ?? '?'}`,
      )
    }

    await db
      .update(schema.appRules)
      .set({
        paymentStatus: 'completed',
        enabled: true,
        paymentRail: 'play',
        playPurchaseToken: input.purchaseToken,
        playOrderId: orderId,
        stakeStatus: 'active',
        stakeCurrency: currency,
        challengeEndsAt: challengeEndsAt(new Date()),
      })
      .where(eq(schema.appRules.id, rule.id))

    return { success: true, alreadyPaid: false, orderId }
  })

export const settleChallenge = authedProcedure
  .route({ method: 'POST', path: '/rules/{id}/settle' })
  .input(z.object({ id: z.string() }))
  .handler(async ({ input, context }) => {
    const rule = await loadOwnedRule(input.id, context.user.id)
    if (rule.stakeStatus !== 'active') {
      return {
        forfeitedAmount: rule.forfeitedAmount,
        stakeAmount: rule.lockedAmount ?? 0,
        refundedAmount: (rule.lockedAmount ?? 0) - rule.forfeitedAmount,
        currency: rule.stakeCurrency ?? 'INR',
        refundStatus: 'settled' as const,
      }
    }
    if (rule.challengeEndsAt && new Date() < rule.challengeEndsAt) {
      throw new ORPCError('Challenge is still running')
    }

    const stake = rule.lockedAmount ?? 0
    // Whatever was forfeited to partial unlocks is never returned; the rest of
    // the stake is the user's, and this is the moment they get it.
    const refundAmount = stake - rule.forfeitedAmount

    // Refund first, settle second. If Google rejects the refund the rule stays
    // active so the next attempt can retry instead of silently eating the money.
    let refundStatus: RefundStatus = 'succeeded'
    if (refundAmount > 0) {
      if (!rule.playOrderId) throw new ORPCError('No Google Play order recorded for this challenge')
      refundStatus = await refundPlayPurchase(rule.playOrderId)
      if (refundStatus === 'failed') {
        throw new ORPCError('Refund failed — your stake is safe, please retry')
      }
    }

    await db
      .update(schema.appRules)
      .set({ stakeStatus: 'settled' })
      .where(eq(schema.appRules.id, rule.id))

    return {
      forfeitedAmount: rule.forfeitedAmount,
      stakeAmount: stake,
      refundedAmount: refundAmount,
      currency: rule.stakeCurrency ?? 'INR',
      refundStatus,
    }
  })

