import { Hono } from 'hono';
import { db } from '../database';
import * as schema from '../database/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';
import type { AppEnv } from '../types';

async function getDodo() {
  const { default: DodoPayments } = await import('dodopayments');
  return new DodoPayments({ bearerToken: process.env.DODO_PAYMENTS_API_KEY! });
}

export const remove = new Hono<AppEnv>()
  .use('*', requireAuth)

  // POST /api/remove/checkout — create Dodo checkout for removing an app restriction
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
        return_url: `screenly://remove-confirm`,
        metadata: { userId: user.id, packageName, appName, action: 'remove' },
      });

      return c.json({
        checkout_url: (payment as any).payment_link,
        payment_id:   (payment as any).payment_id,
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
      const payment = await (dodo.payments as any).retrieve(paymentId);
      const status = (payment as any).status;
      if (status !== 'succeeded' && status !== 'paid') {
        return c.json({ error: `Payment status: ${status}` }, 402);
      }

      const deleted = await db
        .delete(schema.appRules)
        .where(and(
          eq(schema.appRules.packageName, packageName),
          eq(schema.appRules.userId, user.id),
        ))
        .returning();

      if (!deleted.length) {
        return c.json({ error: 'No rule found for this app' }, 404);
      }

      return c.json({ success: true, appName: deleted[0].appName }, 200);
    } catch (e: any) {
      return c.json({ error: e.message ?? 'Confirm failed' }, 500);
    }
  });
