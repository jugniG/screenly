import { Hono } from 'hono';
import { db } from '../database';
import * as schema from '../database/schema';
import { eq, desc } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';
import type { AppEnv } from '../types';

export const unlockHistory = new Hono<AppEnv>()
  .use('*', requireAuth)

  // GET /api/unlock/history
  .get('/history', async (c) => {
    const user = c.get('user')!;
    const rows = await db
      .select()
      .from(schema.unlockEvents)
      .where(eq(schema.unlockEvents.userId, user.id))
      .orderBy(desc(schema.unlockEvents.createdAt))
      .limit(50);

    return c.json(rows);
  });
