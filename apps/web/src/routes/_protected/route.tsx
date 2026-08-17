import { getSession } from '#/lib/session'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected')({
  beforeLoad: async () => {
    const session = await getSession()

    if (!session?.user) {
      throw redirect({ to: '/login' })
    }

    return { session }
  },
  component: ProtectedLayout,
})

function ProtectedLayout() {
  return (
    <div className="flex flex-col min-h-[85vh]">
      <Outlet />
    </div>
  )
}
