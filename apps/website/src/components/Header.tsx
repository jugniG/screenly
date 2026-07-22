import { Link } from '@tanstack/react-router'
import BetterAuthHeader from '../integrations/better-auth/header-user.tsx'
import { Button } from '@heroui/react'
import { GoArrowRight } from 'react-icons/go'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 h-18 border-b border-brand-border bg-brand-bg/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl h-full items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 no-underline">
          <img
            src="/favicon.ico"
            alt="Screenly Logo"
            className="w-6 h-6 object-contain filter"
          />
          <span className="font-outfit text-xl  tracking-tight text-brand-white">
            Screenly
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link
            to="/"
            className="text-brand-gray hover:text-brand-white transition-colors duration-200 relative group py-2"
            activeProps={{ className: 'text-brand-white' }}
          >
            Home
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand-orange transition-all duration-300 group-hover:w-full" />
          </Link>
          <a
            href="#features"
            className="text-brand-gray hover:text-brand-white transition-colors duration-200 relative group py-2"
          >
            Features
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand-orange transition-all duration-300 group-hover:w-full" />
          </a>
          <a
            href="#science"
            className="text-brand-gray hover:text-brand-white transition-colors duration-200 relative group py-2"
          >
            Science
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand-orange transition-all duration-300 group-hover:w-full" />
          </a>
        </div>

        {/* Action Button & Auth */}
        <div className="flex items-center gap-4">
          <a href="/app-release.apk" download="Screenly.apk" className="no-underline">
            <Button
              size="sm"
              endContent={<GoArrowRight />}
              className='bg-brand-orange text-white font-inter font-semibold rounded-full px-5 py-2 shadow-[0_4px_14px_rgba(254,100,1,0.25)] hover:shadow-[0_6px_18px_rgba(254,100,1,0.4)] hover:scale-105 transition-all duration-200'
            >
              Install App
            </Button>
          </a>
        </div>
      </nav>
    </header>
  )
}
