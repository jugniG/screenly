import { Hono } from 'hono';
import { db } from '../database';
import * as schema from '../database/schema';
import { eq } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';
import type { AppEnv } from '../types';

// Lazy-import Dodo — only fails at runtime if key not set
async function getDodo() {
  const { default: DodoPayments } = await import('dodopayments');
  return new DodoPayments({ bearerToken: process.env.DODO_PAYMENTS_API_KEY! });
}

export const unlock = new Hono<AppEnv>()
  .use('*', requireAuth)

  // POST /api/unlock/free
  .post('/free', async (c) => {
    const user = c.get('user')!;
    const { packageName, appName = '', minutesUnlocked = 30 } = await c.req.json<{
      packageName: string;
      appName?: string;
      minutesUnlocked?: number;
    }>();

    if (!packageName) return c.json({ error: 'packageName required' }, 400);

    const [event] = await db.insert(schema.unlockEvents).values({
      userId:          user.id,
      packageName,
      appName,
      unlockType:      'free',
      minutesUnlocked,
    }).returning();

    return c.json(event, 201);
  })

  // POST /api/unlock/checkout — create Dodo checkout session
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
      const payment = await (dodo.payments as any).create({
        billing: { city: '', country: 'IN', state: '', street: '', zipcode: '' },
        customer: { email: user.email, name: user.name ?? '' },
        product_cart: [{ product_id: productId, quantity: 1 }],
        return_url: `screenly://unlock-confirm`,
        metadata: { userId: user.id, packageName },
      });

      return c.json({
        checkout_url: (payment as any).payment_link,
        payment_id:   (payment as any).payment_id,
      });
    } catch (e: any) {
      return c.json({ error: e.message ?? 'Checkout failed' }, 500);
    }
  })

  // POST /api/unlock/confirm — called after successful payment redirect
  .post('/confirm', async (c) => {
    const user = c.get('user')!;
    const { paymentId, packageName, appName = '', minutesUnlocked = 60 } = await c.req.json<{
      paymentId: string;
      packageName: string;
      appName?: string;
      minutesUnlocked?: number;
    }>();

    if (!paymentId || !packageName) return c.json({ error: 'paymentId and packageName required' }, 400);

    // Verify payment with Dodo
    try {
      const dodo = await getDodo();
      const payment = await (dodo.payments as any).retrieve(paymentId);
      const status = (payment as any).status;
      if (status !== 'succeeded' && status !== 'paid') {
        return c.json({ error: `Payment status: ${status}` }, 402);
      }

      const amountPaid = (payment as any).total_amount ?? 500; // cents

      const [event] = await db.insert(schema.unlockEvents).values({
        userId:          user.id,
        packageName,
        appName,
        unlockType:      'paid',
        minutesUnlocked,
        paymentId,
        amountPaid,
      }).returning();

      return c.json(event, 201);
    } catch (e: any) {
      return c.json({ error: e.message ?? 'Confirm failed' }, 500);
    }
  });

// Webhook handler (no auth)
export const dodoWebhook = new Hono()
  .post('/webhook', async (c) => {
    const rawBody = await c.req.text();
    const sig = c.req.header('webhook-signature') ?? '';

    try {
      const { Webhook } = await import('standardwebhooks');
      const wh = new Webhook(process.env.DODO_WEBHOOK_KEY ?? '');
      const payload = wh.verify(rawBody, { 'webhook-signature': sig, 'webhook-timestamp': c.req.header('webhook-timestamp') ?? '', 'webhook-id': c.req.header('webhook-id') ?? '' }) as any;

      // Handle payment.succeeded — record unlock if not already done
      if (payload.type === 'payment.succeeded') {
        const meta = payload.data?.metadata ?? {};
        const existing = await db
          .select()
          .from(schema.unlockEvents)
          .where(eq(schema.unlockEvents.paymentId, payload.data.payment_id))
          .limit(1);

        if (!existing.length && meta.userId && meta.packageName) {
          await db.insert(schema.unlockEvents).values({
            userId:          meta.userId,
            packageName:     meta.packageName,
            appName:         meta.appName ?? '',
            unlockType:      'paid',
            minutesUnlocked: 60,
            paymentId:       payload.data.payment_id,
            amountPaid:      payload.data.total_amount,
          });
        }
      }

      return c.json({ received: true });
    } catch (e: any) {
      return c.json({ error: 'Invalid webhook' }, 400);
    }
  });
