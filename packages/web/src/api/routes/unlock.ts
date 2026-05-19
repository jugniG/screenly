import { Hono } from 'hono';
import { db } from '../database';
import * as schema from '../database/schema';
import { eq, and } from 'drizzle-orm';
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
    const user = c.get('user')!;
    const { packageName, appName = '' } = await c.req.json<{
      packageName: string;
      appName?: string;
    }>();

    if (!packageName) return c.json({ error: 'packageName required' }, 400);

    const productId = process.env.DODO_UNLOCK_PRODUCT_ID;
    if (!productId) return c.json({ error: 'Payments not configured' }, 503);

    try {
      const dodo = await getDodo();
      const session = await dodo.checkoutSessions.create({
        product_cart: [{ product_id: productId, quantity: 1 }],
        customer: { email: user.email, name: user.name ?? undefined },
        return_url: `${process.env.BETTER_AUTH_URL ?? 'http://localhost:5173'}/api/dodo/return?action=unlock`,
        metadata: {
          userId: user.id,
          packageName,
          appName: appName || 'Unknown',
        },
        customization: {
          theme: 'dark',
        },
      });
      return c.json({
        checkout_url:session.checkout_url,
        session_id: session.session_id,
      });
    } catch (e: any) {
      return c.json({ error: e.message ?? 'Checkout failed' }, 500);
    }
  })

  // POST /api/unlock/confirm — called after successful payment redirect
  .post('/confirm', async (c) => {
    const user = c.get('user')!;
    const { paymentId, packageName, appName = '' } = await c.req.json<{
      paymentId: string;
      packageName: string;
      appName?: string;
    }>();

    if (!paymentId || !packageName) return c.json({ error: 'paymentId and packageName required' }, 400);

    // Calculate minutes remaining until midnight (for logging)
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(23, 59, 59, 999);
    const minutesUntilMidnight = Math.max(1, Math.round((midnight.getTime() - now.getTime()) / 60_000));

    try {
      const dodo = await getDodo();
      const payment = await dodo.payments.retrieve(paymentId);

      if (payment.status !== 'succeeded' && payment.status !== 'paid') {
        return c.json({ error: `Payment status: ${payment.status}` }, 402);
      }

      const amountPaid = (payment as any).total_amount ?? 0;

      const [event] = await db.insert(schema.unlockEvents).values({
        userId:          user.id,
        packageName,
        appName,
        unlockType:      'paid',
        minutesUnlocked: minutesUntilMidnight,
        paymentId,
        amountPaid,
      }).returning();

      return c.json(event, 201);
    } catch (e: any) {
      return c.json({ error: e.message ?? 'Confirm failed' }, 500);
    }
  });

// Webhook & return handler (no auth)
export const dodoWebhook = new Hono()
  // GET /api/dodo/return — Dodo redirects here → 302 to screenly:// so Android returns to app
  .get('/return', async (c) => {
    const paymentId = c.req.query('payment_id') ?? '';
    const status = c.req.query('status') ?? '';
    const action = c.req.query('action') ?? '';
    console.error('[return] payment_id=%s status=%s action=%s', paymentId, status, action);

    const scheme = action === 'remove' ? 'remove-confirm' : 'unlock-confirm';
    return c.redirect(`screenly://${scheme}?payment_id=${paymentId}&status=${status}`, 302);
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
        const paymentId = payload.data.payment_id;

        if (meta.action === 'remove' && meta.userId && meta.packageName) {
          await db
            .delete(schema.appRules)
            .where(and(
              eq(schema.appRules.packageName, meta.packageName),
              eq(schema.appRules.userId, meta.userId),
            ));
          console.error('[webhook] removed rule for userId=%s package=%s payment=%s', meta.userId, meta.packageName, paymentId);
        } else if (meta.userId && meta.packageName) {
          const existing = await db
            .select()
            .from(schema.unlockEvents)
            .where(eq(schema.unlockEvents.paymentId, paymentId))
            .limit(1);

          if (!existing.length) {
            const now = new Date();
            const midnight = new Date(now);
            midnight.setHours(23, 59, 59, 999);
            const minutesUntilMidnight = Math.max(1, Math.round((midnight.getTime() - now.getTime()) / 60_000));

            await db.insert(schema.unlockEvents).values({
              userId: meta.userId,
              packageName: meta.packageName,
              appName: meta.appName ?? '',
              unlockType: 'paid',
              minutesUnlocked: minutesUntilMidnight,
              paymentId,
              amountPaid: payload.data.total_amount ?? 0,
            });
          }
        }
      }

      return c.json({ received: true });
    } catch (e: any) {
      return c.json({ error: 'Invalid webhook' }, 400);
    }
  });
