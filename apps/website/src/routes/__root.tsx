import { HeroUIProvider } from "@heroui/react";
import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
  Outlet,
} from '@tanstack/react-router'
import appCss from '../styles.css?url'
import Header from '../components/Header'
import Footer from '../components/Footer'

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
        title: 'Screenly - Put money on your focus and actually stop scrolling',
      },
      {
        name: 'description',
        content: 'Lock distracting apps with a USDC deposit. Break the rule, lose the money. Open-source Android app blocker powered by Solana.',
      },
      {
        property: 'og:title',
        content: 'Screenly — Put money on your focus and actually stop scrolling',
      },
      {
        property: 'og:description',
        content: 'Lock distracting apps with a USDC deposit. Break the rule, lose the money. Open-source Android app blocker powered by Solana.',
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
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
  component: RootLayout,
})


function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
        <link rel="preconnect" href="https://fonts.googleapis.com"></link>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin=""></link>
        <link href="https://fonts.googleapis.com/css2?family=Geist+Pixel:ELSH@0..100&display=swap" rel="stylesheet"></link>

        <link rel="preconnect" href="https://fonts.googleapis.com"></link>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin=""></link>
        <link href="https://fonts.googleapis.com/css2?family=Geist+Pixel:ELSH@0..100&family=Recursive:wght@300..1000&display=swap" rel="stylesheet"></link>
      </head>
      <body className=" text-brand-white min-h-screen antialiased selection:bg-brand-orange selection:text-white">
        <HeroUIProvider>
          {children}
        </HeroUIProvider>
      </body>
    </html>
  )
}

function RootLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-brand-bg text-brand-white font-recursive">
      <Header />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
