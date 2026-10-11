import { ORPCError, os } from '@orpc/server'

export const base = os.use(async ({ next, path }) => {
  try {
    return await next();
  } catch (error) {
    if (error instanceof ORPCError) {
      console.error("[oRPC Error]", "Path", path, error.code, error.message)
      throw error
    }

    const err = error as Error
    console.error("[oRPC Error]", "Path", path, err?.name, err?.message, err?.stack)
    throw new ORPCError("INTERNAL_SERVER_ERROR", { message: err?.message ?? "Something went wrong" })
  }
});

type AuthContext = { user?: { id: string; name: string; email: string } | null }

export const authedProcedure = base.use(async ({ context, next }) => {
  const ctx = context as AuthContext
  if (!ctx.user) {
    throw new ORPCError("UNAUTHORIZED");
  }
  return next({
    context: { ...context, user: ctx.user },
  })
})
