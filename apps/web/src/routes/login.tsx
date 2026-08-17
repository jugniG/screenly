import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, Card, CardBody, CardHeader, Divider, Input } from '@heroui/react'
import { authClient } from '#/lib/auth-client'

const loginSchema = z.object({
  name: z.string().optional(),
  email: z.string().email('Please enter a valid email address'),
})

type LoginForm = z.infer<typeof loginSchema>

export const Route = createFileRoute('/login')({
  component: Login,
})

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
      <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96l3.007 2.332C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  )
}

function Login() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [sentEmail, setSentEmail] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  useEffect(() => {
    authClient.getSession().then(({ data }) => {
      if (data?.session) {
        void navigate({ to: '/home' })
      }
    }).catch((err) => {
      console.error('🔴 Failed to check session:', err)
    })
  }, [navigate])

  const handleGoogle = async () => {
    setError(null)
    setGoogleLoading(true)
    try {
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: '/home',
      })
    } catch (err) {
      console.error('🔴 Google sign-in failed:', err)
      setError('Google sign-in failed. Please try again.')
      setGoogleLoading(false)
    }
  }

  const onSubmit = async (values: LoginForm) => {
    setError(null)
    try {
      const res = await authClient.signIn.magicLink({
        email: values.email,
        name: values.name || undefined,
        callbackURL: '/home',
      })
      if (res.error) {
        setError(res.error.message || 'Failed to send magic link. Please try again.')
      } else {
        setSentEmail(values.email)
        setSent(true)
      }
    } catch (err) {
      console.error('🔴 Magic link sign-in error:', err)
      setError('Something went wrong. Please try again.')
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-[420px] p-2" shadow="sm">
        <CardHeader className="flex-col items-center gap-2 pt-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10">
            <img src="/favicon.ico" alt="Screenly" className="h-8 w-8 object-contain" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Welcome to Screenly
          </h1>
          <p className="text-sm text-neutral-500">
            Sign in or create an account with Google or Magic Link
          </p>
        </CardHeader>

        <CardBody className="gap-4 px-6 pb-6 pt-4">
          {sent ? (
            <div className="py-4 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-500/10">
                <svg className="h-7 w-7 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 002-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="mb-1 text-lg font-bold text-neutral-900">Check your email</h2>
              <p className="mb-6 text-sm leading-relaxed text-neutral-600">
                We sent a magic sign-in link to <span className="font-semibold text-neutral-800">{sentEmail}</span>. Click the link in your email to sign in.
              </p>
              <Button
                variant="flat"
                fullWidth
                onPress={() => {
                  setSent(false)
                  setError(null)
                }}
              >
                Use a different email
              </Button>
            </div>
          ) : (
            <>
              {/* Google Button */}
              <Button
                variant="bordered"
                fullWidth
                isLoading={googleLoading}
                isDisabled={isSubmitting}
                onPress={handleGoogle}
                startContent={!googleLoading && <GoogleLogo />}
                className="font-semibold"
              >
                Continue with Google
              </Button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-2">
                <Divider className="flex-1" />
                <span className="text-xs text-neutral-400 font-medium">or magic link</span>
                <Divider className="flex-1" />
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
                <Input
                  label="Full Name (Optional)"
                  placeholder="John Doe"
                  variant="bordered"
                  isInvalid={!!errors.name}
                  errorMessage={errors.name?.message}
                  {...register('name')}
                />

                <Input
                  label="Email Address"
                  type="email"
                  placeholder="you@example.com"
                  variant="bordered"
                  isRequired
                  isInvalid={!!errors.email}
                  errorMessage={errors.email?.message}
                  {...register('email')}
                />

                {error && (
                  <p className="rounded-lg bg-danger-50 px-3 py-2 text-xs font-medium text-danger-600">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  color="primary"
                  fullWidth
                  isLoading={isSubmitting}
                  isDisabled={googleLoading}
                  className="bg-orange-500 font-semibold text-white shadow-md shadow-orange-500/20 hover:bg-orange-600"
                >
                  {isSubmitting ? 'Sending link…' : 'Send Magic Link'}
                </Button>
              </form>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
