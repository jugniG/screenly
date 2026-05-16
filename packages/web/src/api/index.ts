import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { auth } from './auth';
import { authMiddleware } from './middleware/auth';
import { rules } from './routes/rules';
import { usage } from './routes/usage';
import { unlock, dodoWebhook } from './routes/unlock';
import { unlockHistory } from './routes/unlockHistory';
import { remove } from './routes/remove';

const app = new Hono()
  .use(cors({ origin: (origin) => origin ?? '*', credentials: true }))
  // Better Auth — must be before basePath
  .on(['GET', 'POST'], '/api/auth/*', (c) => auth.handler(c.req.raw))
  // Dodo webhook — no auth middleware
  .route('/api/dodo', dodoWebhook)
  // All other API routes
  .basePath('/api')
  .use('*', authMiddleware)
  .get('/health', (c) => c.json({ status: 'ok' }))
  .route('/rules',   rules)
  .route('/usage',   usage)
  .route('/unlock',  unlock)
  .route('/unlock',  unlockHistory)  // /api/unlock/history
  .route('/remove',  remove);  // /api/remove/checkout, /api/remove/confirm

export type AppType = typeof app;
export default app;
