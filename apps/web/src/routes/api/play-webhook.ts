/**
 * Google Play Real-time developer notifications webhook.
 *
 * Pub/Sub's push subscription posts here. It carries no user session, so the
 * request is authenticated by the OIDC token Pub/Sub signs with the service
 * account configured on the subscription — not by a cookie.
 *
 * The audience below must match the Audience field set on the push
 * subscription. If it drifts, Google mints the token for a different audience
 * and every delivery is rejected here.
 */
import { createFileRoute } from '@tanstack/react-router'
import { applyRtdnMessage, parseRtdnMessage, verifyPubsubToken } from '@screen/api/play-rtdn'

const AUDIENCE = 'https://screenly-website.vercel.app/api/play-webhook'

export const Route = createFileRoute('/api/play-webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authorized = await verifyPubsubToken(
          request.headers.get('authorization'),
          AUDIENCE,
        )
        if (!authorized) {
          // Pub/Sub retries non-2xx responses, so this would loop. 401 tells it
          // the request will never succeed.
          return new Response('unauthorized', { status: 401 })
        }

        let raw: unknown
        try {
          raw = await request.json()
        } catch {
          return new Response('bad request', { status: 400 })
        }

        const message = parseRtdnMessage(raw)
        if (!message) return new Response('bad request', { status: 400 })

        // Ignore notifications for other packages if this topic ever gets
        // linked to more than one app.
        if (message.packageName && message.packageName !== 'com.screenly.app') {
          return Response.json({ ok: true, action: 'ignored', reason: 'other package' })
        }

        try {
          const outcome = await applyRtdnMessage(message)
          console.log('[play-rtdn]', message.notificationType, outcome)
          return Response.json({ ok: true, ...outcome })
        } catch (e) {
          // 500 so Pub/Sub retries — losing a refund event means a user who
          // already got their money back stays locked in our system.
          console.error('[play-rtdn] failed to apply', (e as Error).message)
          return new Response('internal error', { status: 500 })
        }
      },
    },
  },
})