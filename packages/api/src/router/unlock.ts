import { z } from 'zod'
import { db } from '@screen/db'
import * as schema from '@screen/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { authedProcedure } from '../base'

async function getDodo() {
  const { default: DodoPayments } = await import('dodopayments')
  return new DodoPayments({
    bearerToken: process.env.DODO_PAYMENTS_API_KEY!,
    environment: process.env.DODO_ENVIRONMENT === 'live' ? 'live_mode' : 'test_mode',
  })
}

export const freeUnlock = authedProcedure
  .route({ method: 'POST', path: '/unlock/free' })
  .input(z.object({
    packageName: z.string(),
    appName: z.string().optional(),
    minutesUnlocked: z.number().int().optional(),
  }))
  .handler(async ({ input, context }) => {
    const [event] = await db.insert(schema.unlockEvents).values({
      userId:          context.user.id,
      packageName:     input.packageName,
      appName:         input.appName ?? '',
      unlockType:      'free',
      minutesUnlocked: input.minutesUnlocked ?? 30,
    }).returning()
    return event
  })

export const createCheckout = authedProcedure
  .route({ method: 'POST', path: '/unlock/checkout' })
  .input(z.object({
    packageName: z.string(),
    appName: z.string().optional(),
  }))
  .handler(async ({ input, context }) => {
    const productId = process.env.DODO_UNLOCK_PRODUCT_ID
    if (!productId) throw new Error('Payments not configured')

    const dodo = await getDodo()
    const session = await dodo.checkoutSessions.create({
      product_cart: [{ product_id: productId, quantity: 1 }],
      customer: { email: context.user.email, name: context.user.name },
      return_url: `${process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'}/api/dodo/return?action=unlock`,
      metadata: {
        userId: context.user.id,
        packageName: input.packageName,
        appName: input.appName || 'Unknown',
      },
      customization: { theme: 'dark' },
    })

    return { checkout_url: session.checkout_url, session_id: session.session_id }
  })

export const confirmPayment = authedProcedure
  .route({ method: 'POST', path: '/unlock/confirm' })
  .input(z.object({
    paymentId: z.string(),
    packageName: z.string(),
    appName: z.string().optional(),
  }))
  .handler(async ({ input, context }) => {
    const now = new Date()
    const midnight = new Date(now)
    midnight.setHours(23, 59, 59, 999)
    const minutesUntilMidnight = Math.max(1, Math.round((midnight.getTime() - now.getTime()) / 60_000))

    const dodo = await getDodo()
    const payment = await dodo.payments.retrieve(input.paymentId)

    if (payment.status !== 'succeeded' && payment.status !== 'paid') {
      throw new Error(`Payment status: ${payment.status}`)
    }

    const amountPaid = (payment as any).total_amount ?? 0

    const [event] = await db.insert(schema.unlockEvents).values({
      userId:          context.user.id,
      packageName:     input.packageName,
      appName:         input.appName ?? '',
      unlockType:      'paid',
      minutesUnlocked: minutesUntilMidnight,
      paymentId:       input.paymentId,
      amountPaid,
    }).returning()

    return event
  })

export const unlockHistory = authedProcedure
  .route({ method: 'GET', path: '/unlock/history' })
  .input(z.object({}))
  .handler(async ({ context }) => {
    return db
      .select()
      .from(schema.unlockEvents)
      .where(eq(schema.unlockEvents.userId, context.user.id))
      .orderBy(desc(schema.unlockEvents.createdAt))
      .limit(50)
  })
