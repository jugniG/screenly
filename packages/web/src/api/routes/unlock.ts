import { Hono } from 'hono';
import { logger} from 'hono/logger';
import { db } from '../database';
import * as schema from '../database/schema';
import { eq } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';
import type { AppEnv } from '../types';

async function getDodo() {
  const { default: DodoPayments } = await import('dodopayments');
  return new DodoPayments({
    bearerToken: process.env.DODO_PAYMENTS_API_KEY!,
    environment: process.env.DODO_ENVIRONMENT === 'live' ? 'live_mode' : 'test_mode',
  });
}

export const unlock = new Hono<AppEnv>()
  .use(logger())
  .use('*', requireAuth)

  // POST /api/unlock/free — free unlock (for testing/development)
  .post('/free', async (c) => {
    const user = c.get('user')!;
    const { packageName, appName = '', minutesUnlocked = 30 } = await c.req.json<{
      packageName: string;
      appName?: string;
      minutesUnlocked?: number;
    }>();

    if (!packageName) return c.json({ error: 'packageName required' }, 400);

    const [event] = await db.insert(schema.unlockEvents).values({
      userId: user.id,
      packageName,
      appName,
      unlockType: 'free',
      minutesUnlocked,
    }).returning();

    return c.json(event, 201);
  })

  // POST /api/unlock/checkout — create Dodo checkout session for paid unlock
  .post('/checkout', async (c) => {
    console.log('[checkout] handler entered');
    const user = c.get('user')!;
    const body = await c.req.json<{
      packageName: string;
      appName?: string;
    }>();
    console.log('[checkout] body:', body);
    const { packageName, appName = '' } = body;

    if (!packageName) return c.json({ error: 'packageName required' }, 400);

    const productId = process.env.DODO_UNLOCK_PRODUCT_ID;
    console.log('[checkout] productId:', productId);
    if (!productId) return c.json({ error: 'Payments not configured' }, 503);

    try {
      console.log('[checkout] creating dodo checkout session...');
      const dodo = await getDodo();
      const session = await dodo.checkoutSessions.create({
        product_cart: [{ product_id: productId, quantity: 2 }],
        customer: { email: user.email, name: user.name ?? undefined },
        return_url: `${process.env.WEBSITE_URL ?? 'http://localhost:5173'}/api/dodo/return?action=unlock`,
        metadata: {
          userId: user.id,
          packageName,
          appName: appName || 'Unknown',
        },
        customization: {
          theme: 'light',
        },
        discount_code: 'ABC09'
      });
      console.error({
        checkout_url: session.checkout_url,
        session_id: session.session_id,
      });

      return c.json({
        checkout_url: 'https://x.com/home',
        session_id: session.session_id,
      });
    } catch (e: any) {
      return c.json({ error: e.message ?? 'Checkout failed' }, 500);
    }
  })

  // POST /api/unlock/confirm — called after successful payment redirect
  .post('/confirm', async (c) => {
    const user = c.get('user')!;
    const { sessionId, packageName, appName = '', minutesUnlocked = 60 } = await c.req.json<{
      sessionId: string;
      packageName: string;
      appName?: string;
      minutesUnlocked?: number;
    }>();

    if (!sessionId || !packageName) return c.json({ error: 'sessionId and packageName required' }, 400);

    try {
      const dodo = await getDodo();
      const session = await dodo.checkoutSessions.retrieve(sessionId);

      if (session.payment_status !== 'succeeded' && session.payment_status !== 'paid') {
        return c.json({ error: `Payment status: ${session.payment_status}` }, 402);
      }

      const paymentId = session.payment_id;
      const amountPaid = 0; // amount not available from session status; webhook has full details

      const [event] = await db.insert(schema.unlockEvents).values({
        userId: user.id,
        packageName,
        appName,
        unlockType: 'paid',
        minutesUnlocked,
        paymentId: paymentId ?? sessionId,
        amountPaid,
      }).returning();

      return c.json(event, 201);
    } catch (e: any) {
      return c.json({ error: e.message ?? 'Confirm failed' }, 500);
    }
  });

// Webhook handler (no auth) — receives payment.succeeded events, handles return redirects
export const dodoWebhook = new Hono()
  // GET /api/dodo/return — Dodo redirects here after payment, we bounce to app
  .get('/return', async (c) => {
    const sessionId = c.req.query('session_id') ?? '';
    const status = c.req.query('status') ?? '';
    const action = c.req.query('action') ?? 'unlock';

    if (action === 'remove') {
      return c.redirect(`screenly://remove-confirm?session_id=${sessionId}&status=${status}`);
    }
    return c.redirect(`screenly://unlock-confirm?session_id=${sessionId}&status=${status}`);
  })
  .post('/webhook', async (c) => {
    const rawBody = await c.req.text();
    const sig = c.req.header('webhook-signature') ?? '';

    try {
      const { Webhook } = await import('standardwebhooks');
      const wh = new Webhook(process.env.DODO_WEBHOOK_KEY ?? '');
      const payload = wh.verify(rawBody, {
        'webhook-signature': sig,
        'webhook-timestamp': c.req.header('webhook-timestamp') ?? '',
        'webhook-id': c.req.header('webhook-id') ?? '',
      }) as any;

      if (payload.type === 'payment.succeeded') {
        const meta = payload.data?.metadata ?? {};
        const existing = await db
          .select()
          .from(schema.unlockEvents)
          .where(eq(schema.unlockEvents.paymentId, payload.data.payment_id))
          .limit(1);

        if (!existing.length && meta.userId && meta.packageName) {
          await db.insert(schema.unlockEvents).values({
            userId: meta.userId,
            packageName: meta.packageName,
            appName: meta.appName ?? '',
            unlockType: 'paid',
            minutesUnlocked: 60,
            paymentId: payload.data.payment_id,
            amountPaid: payload.data.total_amount ?? 0,
          });
        }
      }

      return c.json({ received: true });
    } catch (e: any) {
      return c.json({ error: 'Invalid webhook' }, 400);
    }
  });
