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
        title: 'Screenly - Your day, but longer',
      },
      {
        name: 'description',
        content: 'Lock distracting apps with money on the line. Hold out and you get every bit of it back.',
      },
      {
        property: 'og:title',
        content: 'Screenly - Your day, but longer',
      },
      {
        property: 'og:description',
        content: 'Lock distracting apps with money on the line. Hold out and you get every bit of it back.',
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
        href: "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "icon", type: "image/x-icon", href: "/favicon.ico", sizes: "16x16 32x32 48x48" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
      { name: "theme-color", content: "#183e32" },
    ],
  }),
  shellComponent: RootDocument,
  component: RootLayout,
})


function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="light">
      <head>
        <HeadContent />
        <script
          src="https://cdn.databuddy.cc/databuddy.js"
          data-client-id="019cc0a4-4f0f-4c91-b8a1-340aab9f3073"
          data-track-web-vitals="true"
          crossOrigin="anonymous"
          async
        ></script>
      </head>
      <body className="min-h-screen antialiased">
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
