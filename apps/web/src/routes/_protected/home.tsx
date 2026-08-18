import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { authClient } from '#/lib/auth-client'
import { Button } from '@heroui/react'
import { FaGooglePlay, FaSignOutAlt, FaShieldAlt, FaCheckCircle } from 'react-icons/fa'

export const Route = createFileRoute('/_protected/home')({
  component: HomePage,
})

function HomePage() {
  const navigate = useNavigate()
  const routeContext = Route.useRouteContext()
  const session = routeContext.session

  const handleSignOut = async () => {
    await authClient.signOut()
    navigate({ to: '/' })
  }

  const playStoreUrl = "https://play.google.com/store/apps/details?id=com.screenly.app"

  return (
    <div className="relative overflow-hidden">
      <div className="warm-glow pointer-events-none absolute inset-0" />
      <div className="relative flex min-h-[80vh] flex-col items-center justify-center px-4 py-12">
        <div className="card-premium w-full max-w-xl rounded-3xl border border-border bg-card p-8 text-center sm:p-10">
          {/* User Badge */}
          <div className="mb-8 flex items-center justify-between border-b border-border pb-6">
            <div className="flex items-center gap-3 text-left">
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || 'User'}
                  className="size-12 rounded-full border border-border object-cover"
                />
              ) : (
                <div className="flex size-12 items-center justify-center rounded-full bg-primary/15 text-lg font-bold text-primary">
                  {session.user.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <div>
                <p className="text-base font-semibold leading-tight text-foreground">
                  {session.user.name || 'Screenly User'}
                </p>
                <p className="mt-0.5 text-xs leading-tight text-muted-foreground">
                  {session.user.email}
                </p>
              </div>
            </div>

            <Button
              size="sm"
              variant="flat"
              onPress={handleSignOut}
              startContent={<FaSignOutAlt />}
              className="rounded-xl bg-muted text-sm font-medium text-muted-foreground transition-colors"
            >
              Sign Out
            </Button>
          </div>

          {/* Main Content */}
          <div className="my-4 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
              <FaCheckCircle className="text-sm" />
              Account Registered
            </div>

            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Install Screenly on Android
            </h1>

            <p className="mx-auto max-w-md text-base leading-relaxed text-muted-foreground">
              Your account is ready. Click the button below to open the Google Play Store installation page.
            </p>

            <div className="pt-4">
              <a
                href={playStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="no-underline block"
              >
                <Button
                  size="lg"
                  className="btn-premium flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-primary text-lg font-bold text-primary-foreground"
                >
                  <FaGooglePlay className="text-xl" />
                  Open Google Play Store Page
                </Button>
              </a>
            </div>

            <div className="flex items-center justify-center gap-6 border-t border-border/60 pt-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <FaShieldAlt className="text-muted-foreground" />
                <span>Verified App</span>
              </div>
              <span>•</span>
              <span>Package: com.screenly.app</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
