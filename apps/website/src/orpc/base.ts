import { auth } from '#/lib/auth'
import { ORPCError, os } from '@orpc/server'

  // Authed base builder — use this instead of `os` for protected procedures
  
export interface ORPCContext {
  headers: Headers | Record<string, string>
}
export const errorLogger = os.use(async ({ context, next, path }) => {
  try {
    return await next({ context })
  } catch (error) {
    // Log the error with full context
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error('🔴 ORPC Error')
    console.error('Path:', path.join('.'))
    console.error('Context:', JSON.stringify({
      // @ts-expect-error
      headers: context.headers instanceof Headers
      // @ts-expect-error
      ? Object.fromEntries(context.headers.entries())
      // @ts-expect-error
        : context.headers,
      user: (context as any).user?.id ?? 'anonymous',
    }, null, 2))

    if (error instanceof Error) {
      console.error('Error Name:', error.name)
      console.error('Error Message:', error.message)
      console.error('Stack Trace:', error.stack)
    } else {
      console.error('Error:', error)
    }
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    // Re-throw ORPCError as-is
    if (error instanceof ORPCError) {
      throw error
    }

    // Wrap unknown errors in INTERNAL_SERVER_ERROR
    throw new ORPCError('INTERNAL_SERVER_ERROR', {
      message: error instanceof Error ? error.message : 'Internal server error',
    })
  }
})

// Base with error logging — export for public routes
      // @ts-expect-error
export const base = os.$context<ORPCContext>().use(errorLogger)

export const authedProcedure = base.use(async ({ context, next }) => {
  const headers =
    context.headers instanceof Headers
      ? context.headers
      : new Headers(context.headers as Record<string, string>)

  const session = await auth.api.getSession({ headers })

  if (!session?.user) {
    throw new ORPCError('UNAUTHORIZED')
  }

  return next({
    context: {
      ...context,
      session: session.session,
      user: session.user,
    },
  })
})
