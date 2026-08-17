import { ORPCError, os } from '@orpc/server'

export const base = os.use(async ({ next, path }) => {
  try {
    return await next();
  } catch (error) {
    console.error("[oRPC Error]", "Path", path, JSON.parse(JSON.stringify(error)));
    if (error instanceof ORPCError) throw error;

    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "Something went wrong",
    });
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
