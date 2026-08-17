import { z } from 'zod'
import { db } from '@screen/db'
import * as schema from '@screen/db/schema'
import { eq, and } from 'drizzle-orm'
import { authedProcedure } from '../base'
import { ORPCError } from '@orpc/client'

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

export const createRuleCheckout = authedProcedure
  .route({ method: 'POST', path: '/rules/checkout' })
  .input(z.object({
    packageName: z.string(),
    appName: z.string(),
    ruleType: z.enum(['daily_limit', 'schedule', 'block_always']),
    limitMinutes: z.number().int().optional(),
    period: z.enum(['daily', 'hourly']).optional(),
    scheduleStart: z.string().optional(),
    scheduleEnd: z.string().optional(),
    amount: z.number(),
  }))
  .handler(async ({ input, context }) => {
    const productId = process.env.DODO_ADD_RULE_PRODUCT_ID || process.env.DODO_UNLOCK_PRODUCT_ID
    if (!productId) throw new ORPCError('Add Rule Product ID not configured')

    const amountInCents = Math.round(input.amount * 100)

    const { default: DodoPayments } = await import('dodopayments')
    const dodo = new DodoPayments({
      bearerToken: process.env.DODO_PAYMENTS_API_KEY!,
      environment: process.env.DODO_ENVIRONMENT === 'live' ? 'live_mode' : 'test_mode',
    })

    const checkoutSession = await dodo.checkoutSessions.create({
      product_cart: [{
        product_id: productId,
        quantity: 1,
        amount: amountInCents,
      }],
      customer: { email: context.user.email, name: context.user.name },
      return_url: `${process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'}/api/dodo/return?action=add_rule`,
      metadata: {
        userId: context.user.id,
        packageName: input.packageName,
        appName: input.appName,
        ruleType: input.ruleType,
        limitMinutes: input.limitMinutes ? String(input.limitMinutes) : '',
        period: input.period || 'daily',
        scheduleStart: input.scheduleStart || '',
        scheduleEnd: input.scheduleEnd || '',
        action: 'add_rule',
        amount: String(input.amount),
      },
      customization: { theme: 'light' },
    })

    // Pre-create/Upsert the rule with status 'pending' and enabled = false in the database
    const existingRule = await db
      .select()
      .from(schema.appRules)
      .where(and(
        eq(schema.appRules.packageName, input.packageName),
        eq(schema.appRules.userId, context.user.id),
      ))
      .limit(1)

    if (existingRule.length > 0) {
      await db
        .update(schema.appRules)
        .set({
          appName: input.appName,
          ruleType: input.ruleType,
          limitMinutes: input.limitMinutes ?? null,
          period: input.period ?? 'daily',
          scheduleStart: input.scheduleStart ?? null,
          scheduleEnd: input.scheduleEnd ?? null,
          enabled: false,
          paymentStatus: 'pending',
          paymentId: checkoutSession.session_id,
          lockedAmount: amountInCents,
        })
        .where(eq(schema.appRules.id, existingRule[0].id))
    } else {
      await db
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
          enabled: false,
          paymentStatus: 'pending',
          paymentId: checkoutSession.session_id,
          lockedAmount: amountInCents,
        })
    }

    return {
      checkout_url: checkoutSession.checkout_url,
      session_id: checkoutSession.session_id,
    }
  })

export const resumeRuleCheckout = authedProcedure
  .route({ method: 'POST', path: '/rules/{id}/resume-checkout' })
  .input(z.object({ id: z.string() }))
  .handler(async ({ input, context }) => {
    // 1. Fetch the rule
    const [rule] = await db
      .select()
      .from(schema.appRules)
      .where(and(
        eq(schema.appRules.id, input.id),
        eq(schema.appRules.userId, context.user.id),
      ))
      .limit(1)

    if (!rule) throw new ORPCError('Rule not found')
    if (rule.paymentStatus === 'completed') throw new ORPCError('Rule is already paid')

    const productId = process.env.DODO_ADD_RULE_PRODUCT_ID || process.env.DODO_UNLOCK_PRODUCT_ID
    if (!productId) throw new ORPCError('Add Rule Product ID not configured')

    const amountInCents = rule.lockedAmount ?? 1000 // default to $10 if null

    const { default: DodoPayments } = await import('dodopayments')
    const dodo = new DodoPayments({
      bearerToken: process.env.DODO_PAYMENTS_API_KEY!,
      environment: process.env.DODO_ENVIRONMENT === 'live' ? 'live_mode' : 'test_mode',
    })

    const checkoutSession = await dodo.checkoutSessions.create({
      product_cart: [{
        product_id: productId,
        quantity: 1,
        amount: amountInCents,
      }],
      customer: { email: context.user.email, name: context.user.name },
      return_url: `${process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'}/api/dodo/return?action=add_rule`,
      metadata: {
        userId: context.user.id,
        packageName: rule.packageName,
        appName: rule.appName,
        ruleType: rule.ruleType,
        limitMinutes: rule.limitMinutes ? String(rule.limitMinutes) : '',
        period: rule.period || 'daily',
        scheduleStart: rule.scheduleStart || '',
        scheduleEnd: rule.scheduleEnd || '',
        action: 'add_rule',
        amount: String(amountInCents / 100),
      },
      customization: { theme: 'light' },
    })

    // 2. Update checkout session ID
    await db
      .update(schema.appRules)
      .set({
        paymentId: checkoutSession.session_id,
      })
      .where(eq(schema.appRules.id, rule.id))

    return {
      checkout_url: checkoutSession.checkout_url,
      session_id: checkoutSession.session_id,
    }
  })



