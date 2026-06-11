import { z } from 'zod'
import { db } from '#/db'
import * as schema from '#/db/schema'
import { eq, and } from 'drizzle-orm'
import { authedProcedure } from '../base'

async function getDodo() {
  const { default: DodoPayments } = await import('dodopayments')
  return new DodoPayments({
    bearerToken: process.env.DODO_PAYMENTS_API_KEY!,
    environment: process.env.DODO_ENVIRONMENT === 'live' ? 'live_mode' : 'test_mode',
  })
}

export const createRemoveCheckout = authedProcedure
  .route({ method: 'POST', path: '/remove/checkout' })
  .input(z.object({
    packageName: z.string(),
    appName: z.string().optional(),
  }))
  .handler(async ({ input, context }) => {
    const productId = process.env.DODO_REMOVE_PRODUCT_ID || process.env.DODO_UNLOCK_PRODUCT_ID
    if (!productId) throw new Error('Payments not configured')

    const dodo = await getDodo()
    const session = await dodo.checkoutSessions.create({
      product_cart: [{ product_id: productId, quantity: 1 }],
      customer: { email: context.user.email, name: context.user.name },
      return_url: `${process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'}/api/dodo/return?action=remove`,
      metadata: {
        userId: context.user.id,
        packageName: input.packageName,
        appName: input.appName || 'Unknown',
        action: 'remove',
      },
      customization: { theme: 'light' },
    })

    return { checkout_url: session.checkout_url, session_id: session.session_id }
  })

export const confirmRemove = authedProcedure
  .route({ method: 'POST', path: '/remove/confirm' })
  .input(z.object({
    paymentId: z.string(),
    packageName: z.string(),
  }))
  .handler(async ({ input, context }) => {
    const dodo = await getDodo()
    const payment = await dodo.payments.retrieve(input.paymentId)

    if (payment.status !== 'succeeded' && payment.status !== 'paid') {
      throw new Error(`Payment not completed (status: ${payment.status})`)
    }

    const deleted = await db
      .delete(schema.appRules)
      .where(and(
        eq(schema.appRules.packageName, input.packageName),
        eq(schema.appRules.userId, context.user.id),
      ))
      .returning()

    return { success: true, appName: deleted[0]?.appName ?? '' }
  })
