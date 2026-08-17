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
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl bg-brand-card border border-brand-border rounded-3xl p-8 sm:p-10 shadow-xl text-center relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-orange/10 rounded-full blur-3xl pointer-events-none" />

        {/* User Badge */}
        <div className="flex items-center justify-between border-b border-brand-border pb-6 mb-8">
          <div className="flex items-center gap-3 text-left">
            {session.user.image ? (
              <img
                src={session.user.image}
                alt={session.user.name || 'User'}
                className="size-12 rounded-full border border-brand-border object-cover"
              />
            ) : (
              <div className="size-12 rounded-full bg-brand-orange-soft flex items-center justify-center text-brand-orange font-bold text-lg">
                {session.user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            <div>
              <p className="font-semibold text-brand-white text-base leading-tight">
                {session.user.name || 'Screenly User'}
              </p>
              <p className="text-xs text-brand-gray leading-tight mt-0.5">
                {session.user.email}
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="flat"
            onPress={handleSignOut}
            startContent={<FaSignOutAlt className="text-brand-gray" />}
            className="text-xs text-brand-gray hover:text-red-600 bg-gray-100 hover:bg-red-50 rounded-xl font-medium transition-colors cursor-pointer"
          >
            Sign Out
          </Button>
        </div>

        {/* Main Content */}
        <div className="space-y-6 my-4">
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-1.5 rounded-full text-xs font-semibold">
            <FaCheckCircle className="text-emerald-500 text-sm" />
            Account Registered
          </div>

          <h1 className="font-outfit text-3xl sm:text-4xl font-bold tracking-tight text-brand-white">
            Install Screenly on Android
          </h1>

          <p className="text-base text-brand-gray leading-relaxed max-w-md mx-auto">
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
                startContent={<FaGooglePlay className="text-xl" />}
                className="w-full h-16 bg-brand-orange text-white font-bold text-lg font-inter rounded-2xl shadow-[0_6px_20px_rgba(254,100,1,0.35)] hover:shadow-[0_8px_25px_rgba(254,100,1,0.5)] hover:scale-[1.02] transition-all duration-250 cursor-pointer flex items-center justify-center gap-3"
              >
                Open Google Play Store Page
              </Button>
            </a>
          </div>

          <div className="pt-6 border-t border-brand-border/60 flex items-center justify-center gap-6 text-xs text-brand-gray">
            <div className="flex items-center gap-1.5">
              <FaShieldAlt className="text-brand-orange" />
              <span>Verified App</span>
            </div>
            <span>•</span>
            <span>Package: com.screenly.app</span>
          </div>
        </div>
      </div>
    </div>
  )
}
