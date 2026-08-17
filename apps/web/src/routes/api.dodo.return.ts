import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/dodo/return')({
  server: {
    handlers: {
      GET: ({ request }) => {
        const url = new URL(request.url)
        const paymentId = url.searchParams.get('payment_id') ?? ''
        const status = url.searchParams.get('status') ?? ''
        const action = url.searchParams.get('action') ?? ''
        const scheme = action === 'remove' ? 'remove-confirm' : 'unlock-confirm'
        return new Response(null, {
          status: 302,
          headers: { Location: `screenly://${scheme}?payment_id=${paymentId}&status=${status}` },
        })
      },
    },
  },
})
