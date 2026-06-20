import { createFileRoute } from '@tanstack/react-router'
import { db } from '@screen/db'
import * as schema from '@screen/db/schema'
import { eq, and } from 'drizzle-orm'

export const Route = createFileRoute('/api/dodo/webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawBody = await request.text()
        const sig = request.headers.get('webhook-signature') ?? ''

        try {
          const { Webhook } = await import('standardwebhooks')
          const wh = new Webhook(process.env.DODO_WEBHOOK_KEY ?? '')
          const payload = wh.verify(rawBody, {
            'webhook-signature': sig,
            'webhook-timestamp': request.headers.get('webhook-timestamp') ?? '',
            'webhook-id': request.headers.get('webhook-id') ?? '',
          }) as any

          if (payload.type === 'payment.succeeded') {
            const meta = payload.data?.metadata ?? {}
            const paymentId = payload.data.payment_id

            if (meta.action === 'remove' && meta.userId && meta.packageName) {
              await db
                .delete(schema.appRules)
                .where(and(
                  eq(schema.appRules.packageName, meta.packageName),
                  eq(schema.appRules.userId, meta.userId),
                ))
            } else if (meta.userId && meta.packageName) {
              const existing = await db
                .select()
                .from(schema.unlockEvents)
                .where(eq(schema.unlockEvents.paymentId, paymentId))
                .limit(1)

              if (!existing.length) {
                const now = new Date()
                const midnight = new Date(now)
                midnight.setHours(23, 59, 59, 999)
                const minutesUntilMidnight = Math.max(1, Math.round((midnight.getTime() - now.getTime()) / 60_000))

                await db.insert(schema.unlockEvents).values({
                  userId: meta.userId,
                  packageName: meta.packageName,
                  appName: meta.appName ?? '',
                  unlockType: 'paid',
                  minutesUnlocked: minutesUntilMidnight,
                  paymentId,
                  amountPaid: payload.data.total_amount ?? 0,
                })
              }
            }
          }

          return new Response(JSON.stringify({ received: true }), {
            headers: { 'content-type': 'application/json' },
          })
        } catch {
          return new Response(JSON.stringify({ error: 'Invalid webhook' }), {
            status: 400,
            headers: { 'content-type': 'application/json' },
          })
        }
      },
    },
  },
})
