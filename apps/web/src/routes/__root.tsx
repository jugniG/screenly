import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
  Outlet,
} from '@tanstack/react-router'
import appCss from '../styles.css?url'
// import Header from '../components/Header'
// import Footer from '../components/Footer'

import type { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Screenly - Reduce Your Screentime',
      },
      {
        name: 'description',
        content: 'Lock distracting apps with money on the line. Break the rule, lose your bet. Open-source Android app blocker.',
      },
      {
        property: 'og:title',
        content: 'Screenly — Reduce Your Screentime',
      },
      {
        property: 'og:description',
        content: 'Lock distracting apps with money on the line. Break the rule, lose your bet. Open-source Android app blocker.',
      },
      {
        property: 'og:image',
        content: '/og.png',
      },
      {
        property: 'og:type',
        content: 'website',
      },
      {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=Work+Sans:wght@400;500;600&family=Urbanist:wght@400;600;700&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootDocument,
  component: RootLayout,
})


function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="light">
      <head>
        <HeadContent /></head>
      <body className=" text-brand-white min-h-screen antialiased selection:bg-brand-orange selection:text-white">
          {children}
          <Scripts />
      </body>
    </html>
  )
}

function RootLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-brand-bg text-brand-white font-recursive">
      {/* <Header /> */}
      <main className="flex-grow">
        <Outlet />
      </main>
      {/* <Footer /> */}
    </div>
  )
}
