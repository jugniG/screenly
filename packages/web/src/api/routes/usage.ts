import { Hono } from 'hono';
import { db } from '../database';
import * as schema from '../database/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';
import type { AppEnv } from '../types';

export const usage = new Hono<AppEnv>()
  .use('*', requireAuth)

  // GET /api/usage/today
  .get('/today', async (c) => {
    const user = c.get('user')!;
    const today = new Date().toISOString().split('T')[0];

    const rows = await db
      .select()
      .from(schema.usageLogs)
      .where(and(eq(schema.usageLogs.userId, user.id), eq(schema.usageLogs.date, today)));

    // Enrich with blocked status (check if a rule exists for each package)
    const allRules = await db
      .select()
      .from(schema.appRules)
      .where(eq(schema.appRules.userId, user.id));

    const blockedPackages = new Set(
      allRules.filter(r => r.enabled).map(r => r.packageName)
    );

    const result = rows.map(r => ({
      packageName:  r.packageName,
      appName:      r.appName,
      totalMinutes: r.totalMinutes,
      blocked:      blockedPackages.has(r.packageName),
    }));

    return c.json(result);
  })

  // POST /api/usage/sync  — device sends usage batch
  .post('/sync', async (c) => {
    const user = c.get('user')!;
    const body = await c.req.json<{
      entries: { packageName: string; appName: string; date: string; totalMinutes: number }[];
    }>();

    if (!body.entries?.length) return c.json({ synced: 0 });

    let synced = 0;
    for (const entry of body.entries) {
      // Upsert — update if exists, insert if not
      const existing = await db
        .select()
        .from(schema.usageLogs)
        .where(
          and(
            eq(schema.usageLogs.userId, user.id),
            eq(schema.usageLogs.packageName, entry.packageName),
            eq(schema.usageLogs.date, entry.date),
          )
        )
        .limit(1);

      if (existing.length) {
        await db
          .update(schema.usageLogs)
          .set({ totalMinutes: entry.totalMinutes, updatedAt: new Date() })
          .where(eq(schema.usageLogs.id, existing[0].id));
      } else {
        await db.insert(schema.usageLogs).values({
          userId:       user.id,
          packageName:  entry.packageName,
          appName:      entry.appName,
          date:         entry.date,
          totalMinutes: entry.totalMinutes,
        });
      }
      synced++;
    }

    return c.json({ synced });
  });
