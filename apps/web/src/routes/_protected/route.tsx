import { getSession } from '#/lib/session'
import { createFileRoute, Link, Outlet, redirect } from '@tanstack/react-router'
import { Logo } from '@/components/Logo'

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
    <div className="flex min-h-[85vh] flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-5">
          <Link to="/" aria-label="Screenly home" className="transition-opacity hover:opacity-80">
            <Logo iconSize="sm" />
          </Link>
        </div>
      </header>
      <Outlet />
    </div>
  )
}