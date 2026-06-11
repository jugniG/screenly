import { os } from '@orpc/server'

export const authedProcedure = os
  .context<{ user: { id: string; email: string; name: string } | null }>()
  .middleware(({ context, next }) => {
    if (!context.user) throw new Error('Unauthorized')
    return next({ context: { user: context.user } })
  })
