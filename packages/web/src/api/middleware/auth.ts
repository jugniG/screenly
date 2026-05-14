import { createMiddleware } from 'hono/factory';
import { auth } from '../auth';
import type { AppEnv } from '../types';

export const authMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  c.set('user',    session?.user    ?? null);
  c.set('session', session?.session ?? null);
  return next();
});

export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  if (!c.get('user')) return c.json({ error: 'Unauthorized' }, 401);
  return next();
});
