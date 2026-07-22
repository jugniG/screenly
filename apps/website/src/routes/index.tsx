import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@heroui/react'
import HeroSection from './-home-components/HeroSection'
import VisualizerSection from './-home-components/VisualizerSection'
import FeaturesSection from './-home-components/FeaturesSection'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <div className="flex flex-col bg-brand-bg text-brand-white">
      <HeroSection />
      <VisualizerSection />
      <FeaturesSection />

      <section id="download" className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-24 text-center">
        <h2 className="font-outfit text-3xl font-bold tracking-tight text-brand-white sm:text-4xl">
          Ready to take control?
        </h2>
        <p className="mt-4 text-base text-brand-gray max-w-xl mx-auto">
          Download Screenly and put real money behind your focus.
        </p>
        <div className="mt-8">
          <a href="/app-release.apk" download="Screenly.apk" className="no-underline">
            <Button
              size="lg"
              className="bg-brand-orange text-white font-bold rounded-xl shadow-[0_4px_14px_rgba(254,100,1,0.3)] hover:shadow-[0_6px_20px_rgba(254,100,1,0.45)] hover:scale-102 transition-all duration-250 h-14 px-10"
            >
              Download APK for Android
            </Button>
          </a>
        </div>
      </section>
    </div>
  )
}
