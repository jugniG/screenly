import { z } from 'zod'
import { db } from '@screen/db'
import * as schema from '@screen/db/schema'
import { eq, and } from 'drizzle-orm'
import { authedProcedure } from '../base'

export const getTodayUsage = authedProcedure
  .route({ method: 'GET', path: '/usage/today' })
  .input(z.object({}))
  .handler(async ({ context }) => {
    const today = new Date().toISOString().split('T')[0]

    const rows = await db
      .select()
      .from(schema.usageLogs)
      .where(and(eq(schema.usageLogs.userId, context.user.id), eq(schema.usageLogs.date, today)))

    const allRules = await db
      .select()
      .from(schema.appRules)
      .where(eq(schema.appRules.userId, context.user.id))

    const blockedPackages = new Set(
      allRules.filter(r => r.enabled).map(r => r.packageName)
    )

    return rows.map(r => ({
      packageName:  r.packageName,
      appName:      r.appName,
      totalMinutes: r.totalMinutes,
      blocked:      blockedPackages.has(r.packageName),
    }))
  })

export const syncUsage = authedProcedure
  .route({ method: 'POST', path: '/usage/sync' })
  .input(z.object({
    entries: z.array(z.object({
      packageName: z.string(),
      appName: z.string(),
      date: z.string(),
      totalMinutes: z.number().int(),
    })),
  }))
  .handler(async ({ input, context }) => {
    if (!input.entries.length) return { synced: 0 }

    let synced = 0
    for (const entry of input.entries) {
      const existing = await db
        .select()
        .from(schema.usageLogs)
        .where(
          and(
            eq(schema.usageLogs.userId, context.user.id),
            eq(schema.usageLogs.packageName, entry.packageName),
            eq(schema.usageLogs.date, entry.date),
          )
        )
        .limit(1)

      if (existing.length) {
        await db
          .update(schema.usageLogs)
          .set({ totalMinutes: entry.totalMinutes, updatedAt: new Date() })
          .where(eq(schema.usageLogs.id, existing[0].id))
      } else {
        await db.insert(schema.usageLogs).values({
          userId:       context.user.id,
          packageName:  entry.packageName,
          appName:      entry.appName,
          date:         entry.date,
          totalMinutes: entry.totalMinutes,
        })
      }
      synced++
    }

    return { synced }
  })
