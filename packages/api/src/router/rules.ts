import { z } from 'zod'
import { db } from '@screen/db'
import * as schema from '@screen/db/schema'
import { eq, and, inArray } from 'drizzle-orm'
import { authedProcedure } from '../base'
import { ORPCError } from '@orpc/client'
import { forfeitAmount, challengeEndsAt, tierMinor, DEFAULT_DURATION_ID } from '@screen/monetization'
import { verifyStakePurchase, fetchOrderAmount, refundPlayPurchase, type RefundStatus } from '../play'

/**
 * The two states a user can still see. Everything else is a tombstone kept only
 * so a Play refund notification arriving months later can still match the
 * purchase token against the row that produced it.
 */
const VISIBLE_STATUSES = ['pending_payment', 'active'] as const

export const listRules = authedProcedure
  .route({ method: 'GET', path: '/rules' })
  .handler(({ context }) => {
    return db
      .select()
      .from(schema.appRules)
      .where(and(
        eq(schema.appRules.userId, context.user.id),
        inArray(schema.appRules.status, [...VISIBLE_STATUSES]),
      ))

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
        // The free tier never touches Play, so it is live the moment it exists.
        status: 'active',
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
    const rule = await loadOwnedRule(input.id, context.user.id)
    const stake = rule.lockedAmount ?? 0

    // Rows are never destroyed - an RTDN can arrive months after a refund, and a
    // hard-deleted row takes the Play order with it, leaving the stake
    // unrecoverable. So removal is a status change: `forfeited` when money was
    // live (an early unlock, or a challenge removed before its refund was
    // claimed), `deleted` when none was.
    const forfeits = rule.status === 'active' && stake > 0
    const nextStatus = forfeits ? ('forfeited' as const) : ('deleted' as const)
    await db
      .update(schema.appRules)
      .set(forfeits ? { status: nextStatus, forfeitedAmount: stake } : { status: nextStatus })
      .where(eq(schema.appRules.id, rule.id))

    return {
      success: true,
      // The client needs to know whether this call took the user's money. A rule
      // that was still running forfeits on removal; nothing else does. Error
      // handling cannot convey this - a forfeit is a successful request.
      forfeited: forfeits,
      forfeitedAmount: forfeits ? stake : rule.forfeitedAmount,
      stakeAmount: stake,
      status: nextStatus,
    }
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

/**
 * The one early exit. Unlocking before the deadline forfeits the whole stake
 * and refunds nothing - Google keeps its fee on the original purchase, so this
 * is the only outcome that actually pays out. Completing the challenge is the
 * other exit and returns everything via settleChallenge.
 */
export const unlockChallenge = authedProcedure
  .route({ method: 'POST', path: '/rules/{id}/unlock' })
  .input(z.object({ id: z.string() }))
  .handler(async ({ input, context }) => {
    const rule = await loadOwnedRule(input.id, context.user.id)
    if (rule.status !== 'active') throw new ORPCError('This challenge is already over')

    const stake = rule.lockedAmount ?? 0
    // The row stays so the stake has a record; `forfeited` is what stops the
    // enforcer from blocking (syncRules sends only `active` rules).
    await db
      .update(schema.appRules)
      .set({ status: 'forfeited', forfeitedAmount: stake })
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
    durationId: z.enum(['week', 'month', 'year']).default('week'),
    currency: z.enum(['INR', 'USD']).default('INR'),
  }))
  .handler(async ({ input, context }) => {
    const stake = tierMinor(input.tierId, input.currency)
    if (stake === null) throw new ORPCError('Unknown stake amount')

    // Rows are soft-deleted now, so the same app can appear many times over a
    // user's history. Only the live one matters here: a `pending_payment` row is
    // reused so retrying an abandoned payment does not litter the table, and an
    // `active` one means the app is already locked and a new stake would strand
    // the existing Play order.
    const [existing] = await db
      .select()
      .from(schema.appRules)
      .where(and(
        eq(schema.appRules.packageName, input.packageName),
        eq(schema.appRules.userId, context.user.id),
        inArray(schema.appRules.status, [...VISIBLE_STATUSES]),
      ))
      .limit(1)

    if (existing && existing.status === 'active') {
      throw new ORPCError('You already have a challenge running for this app')
    }

    const values = {
      appName: input.appName,
      ruleType: input.ruleType,
      limitMinutes: input.limitMinutes ?? null,
      period: input.period ?? 'daily',
      scheduleStart: input.scheduleStart ?? null,
      scheduleEnd: input.scheduleEnd ?? null,
      status: 'pending_payment' as const,
      lockedAmount: stake,
      stakeCurrency: input.currency,
      stakeTierId: input.tierId,
      challengeDuration: input.durationId,
      challengeEndsAt: null,
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
    // Only `pending_payment` can be confirmed. A tombstone (settled, forfeited or
    // deleted) must never be revived: a forfeited row still has a PROCESSED Play
    // order, so re-confirming would restart its clock and hand back a stake the
    // user already forfeited.
    if (rule.status !== 'pending_payment') {
      return { success: true, alreadyPaid: rule.status === 'active' }
    }
    if (!rule.stakeTierId) throw new ORPCError('This challenge has no stake product')

    // Ask Google what was actually bought, then charge only for that exact product
    // at our own price for its currency. The client is never the source of the
    // amount, and a token for a different product cannot start this challenge.
    const verified = await verifyStakePurchase(input.purchaseToken)
    if (verified.productId && verified.productId !== rule.stakeTierId) {
      throw new ORPCError(
        `Stake mismatch: Google sold "${verified.productId}", this challenge is for "${rule.stakeTierId}"`,
      )
    }
    if (!verified.orderId) {
      throw new ORPCError('Google Play did not return an order for this purchase')
    }

    const { paidMinor, currency } = await fetchOrderAmount(verified.orderId)
    if (currency !== 'INR' && currency !== 'USD') {
      throw new ORPCError(`Unsupported stake currency: ${currency}`)
    }
    const expected = tierMinor(rule.stakeTierId, currency)
    if (expected === null || expected !== paidMinor) {
      throw new ORPCError(
        `Stake mismatch: Google charged ${paidMinor} ${currency}, this challenge costs ${expected ?? '?'}`,
      )
    }
    const orderId = verified.orderId

    await db
      .update(schema.appRules)
      .set({
        status: 'active',
        paymentRail: 'play',
        playPurchaseToken: input.purchaseToken,
        playOrderId: orderId,
        stakeCurrency: currency,
        challengeDuration: rule.challengeDuration ?? DEFAULT_DURATION_ID,
        challengeEndsAt: challengeEndsAt(new Date(), rule.challengeDuration ?? DEFAULT_DURATION_ID),
      })
      .where(eq(schema.appRules.id, rule.id))

    return { success: true, alreadyPaid: false, orderId }
  })

export const settleChallenge = authedProcedure
  .route({ method: 'POST', path: '/rules/{id}/settle' })
  .input(z.object({ id: z.string() }))
  .handler(async ({ input, context }) => {
    const rule = await loadOwnedRule(input.id, context.user.id)
    if (rule.status !== 'active') {
      return {
        forfeitedAmount: rule.forfeitedAmount,
        stakeAmount: rule.lockedAmount ?? 0,
        refundedAmount: (rule.lockedAmount ?? 0) - rule.forfeitedAmount,
        currency: rule.stakeCurrency ?? 'INR',
        refundStatus: 'settled' as const,
      }
    }
    // A refund needs a stake that actually had a deadline and a Play order to
    // send it back through. Rows still awaiting payment, and pre-Play rows, have
    // neither; without this guard `challengeEndsAt && ...` short-circuits and
    // lets an unfinished or unpaid challenge be settled.
    if (!rule.playOrderId) {
      throw new ORPCError('This challenge was never paid for')
    }
    if (!rule.challengeEndsAt) {
      throw new ORPCError('This challenge has no end date set, so it cannot be settled')
    }
    if (new Date() < rule.challengeEndsAt) {
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
      refundStatus = await refundPlayPurchase(rule.playOrderId)
      if (refundStatus === 'failed') {
        throw new ORPCError('Refund failed - your stake is safe, please retry')
      }
    }

    await db
      .update(schema.appRules)
      .set({ status: 'settled' })
      .where(eq(schema.appRules.id, rule.id))

    return {
      forfeitedAmount: rule.forfeitedAmount,
      stakeAmount: stake,
      refundedAmount: refundAmount,
      currency: rule.stakeCurrency ?? 'INR',
      refundStatus,
    }
  })

