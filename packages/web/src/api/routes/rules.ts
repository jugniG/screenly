import { Hono } from 'hono';
import { db } from '../database';
import * as schema from '../database/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';
import type { AppEnv } from '../types';

export const rules = new Hono<AppEnv>()
  .use('*', requireAuth)

  // GET /api/rules
  .get('/', async (c) => {
    const user = c.get('user')!;
    const rows = await db
      .select()
      .from(schema.appRules)
      .where(eq(schema.appRules.userId, user.id));
    return c.json(rows);
  })

  // POST /api/rules
  .post('/', async (c) => {
    const user = c.get('user')!;
    const body = await c.req.json<{
      packageName: string;
      appName: string;
      ruleType: 'daily_limit' | 'schedule' | 'block_always';
      limitMinutes?: number;
      scheduleStart?: string;
      scheduleEnd?: string;
      enabled?: boolean;
    }>();

    if (!body.packageName || !body.appName || !body.ruleType) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const [rule] = await db
      .insert(schema.appRules)
      .values({
        userId:        user.id,
        packageName:   body.packageName,
        appName:       body.appName,
        ruleType:      body.ruleType,
        limitMinutes:  body.limitMinutes  ?? null,
        scheduleStart: body.scheduleStart ?? null,
        scheduleEnd:   body.scheduleEnd   ?? null,
        enabled:       body.enabled ?? true,
      })
      .returning();

    return c.json(rule, 201);
  })

  // PATCH /api/rules/:id  (partial update — toggle enabled, etc.)
  .patch('/:id', async (c) => {
    const user = c.get('user')!;
    const { id } = c.req.param();
    const body = await c.req.json();

    const [updated] = await db
      .update(schema.appRules)
      .set({ ...body, userId: undefined, id: undefined })
      .where(and(eq(schema.appRules.id, id), eq(schema.appRules.userId, user.id)))
      .returning();

    if (!updated) return c.json({ error: 'Not found' }, 404);
    return c.json(updated);
  })

  // DELETE /api/rules/:id
  .delete('/:id', async (c) => {
    const user = c.get('user')!;
    const { id } = c.req.param();

    const deleted = await db
      .delete(schema.appRules)
      .where(and(eq(schema.appRules.id, id), eq(schema.appRules.userId, user.id)))
      .returning();

    if (!deleted.length) return c.json({ error: 'Not found' }, 404);
    return c.json({ success: true });
  });
