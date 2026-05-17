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

export const remove = new Hono<AppEnv>()
  .use('*', requireAuth)

  // POST /api/remove/checkout — create Dodo checkout session for removing an app restriction
  .post('/checkout', async (c) => {
    const user = c.get('user')!;
    const { packageName, appName = '' } = await c.req.json<{
      packageName: string;
      appName?: string;
    }>();

    if (!packageName) return c.json({ error: 'packageName required' }, 400);

    const productId = process.env.DODO_REMOVE_PRODUCT_ID || process.env.DODO_UNLOCK_PRODUCT_ID;
    if (!productId) return c.json({ error: 'Payments not configured' }, 503);

    try {
      const dodo = await getDodo();
      const session = await dodo.checkoutSessions.create({
        product_cart: [{ product_id: productId, quantity: 1 }],
        customer: { email: user.email, name: user.name ?? undefined },
        return_url: `${process.env.WEBSITE_URL ?? 'http://localhost:5173'}/api/dodo/return?action=remove`,
        metadata: {
          userId: user.id,
          packageName,
          appName: appName || 'Unknown',
          action: 'remove',
        },
        customization: {
          theme: 'light',
        },
      });

      return c.json({
        checkout_url: session.checkout_url,
        session_id:   session.session_id,
      });
    } catch (e: any) {
      return c.json({ error: e.message ?? 'Checkout failed' }, 500);
    }
  })

  // POST /api/remove/confirm — verify payment and delete the rule
  .post('/confirm', async (c) => {
    const user = c.get('user')!;
    const { paymentId, packageName } = await c.req.json<{
      paymentId: string;
      packageName: string;
    }>();

    if (!paymentId || !packageName) return c.json({ error: 'paymentId and packageName required' }, 400);

    try {
      const dodo = await getDodo();
      const payment = await dodo.payments.retrieve(paymentId);
      console.error('[remove/confirm] payment=%s status=%s', paymentId, payment.status);

      if (payment.status !== 'succeeded' && payment.status !== 'paid') {
        return c.json({ error: `Payment not completed (status: ${payment.status})` }, 402);
      }

      const deleted = await db
        .delete(schema.appRules)
        .where(and(
          eq(schema.appRules.packageName, packageName),
          eq(schema.appRules.userId, user.id),
        ))
        .returning();

      return c.json({ success: true, appName: deleted[0]?.appName ?? '' }, 200);
    } catch (e: any) {
      console.error('[remove/confirm] error:', e.message);
      return c.json({ error: e.message ?? 'Confirm failed' }, 500);
    }
  });
