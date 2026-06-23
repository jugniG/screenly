import { z } from 'zod'
import { db } from '@screen/db'
import * as schema from '@screen/db/schema'
import { eq, and } from 'drizzle-orm'
import { authedProcedure } from '../base'

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
