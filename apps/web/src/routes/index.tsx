import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { FaGithub } from "react-icons/fa";
import { Logo } from "@/components/Logo";
import { HeroSpotlight } from "@/components/landing/HeroSpotlight";
import { RelatableScenarios } from "@/components/landing/RelatableScenarios";
import { ScienceStory } from "@/components/landing/ScienceStory";
import { ReclaimCategories } from "@/components/landing/ReclaimCategories";
import { TwelveWeekRoadmap } from "@/components/landing/TwelveWeekRoadmap";
import { HowItWorksMethod } from "@/components/landing/HowItWorksMethod";
import { ComparisonTable } from "@/components/landing/ComparisonTable";
import { FaqSection } from "@/components/landing/FaqSection";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Screenly - Your day, but longer" },
      {
        name: "description",
        content:
          "After your first week with Screenly, you'll find hours in your day you didn't know you had. Lock the apps that distract you with money on the line.",
      },
      {
        property: "og:title",
        content: "Screenly - Your day, but longer",
      },
      {
        property: "og:description",
        content:
          "Lock distracting apps, stake your money, and find hours in your day you didn't know you had.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-foreground">
      {/* Header Navigation */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border/80 bg-background/90 backdrop-blur-md">
        <nav
          className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5"
          aria-label="Main Navigation"
        >
          <a
            href="/"
            aria-label="Screenly home"
            className="flex items-center gap-3 transition-opacity hover:opacity-85"
          >
            <Logo iconSize="md" />
          </a>

          {/* Numbered Nav Links inspired by Quippy */}
          <div className="hidden items-center gap-7 text-xs font-semibold tracking-wide text-muted-foreground md:flex">
            <a href="#scenarios" className="transition-colors hover:text-foreground">
              <span className="text-primary font-mono mr-1">01</span> Scenarios
            </a>
            <a href="#science" className="transition-colors hover:text-foreground">
              <span className="text-primary font-mono mr-1">02</span> Science
            </a>
            <a href="#categories" className="transition-colors hover:text-foreground">
              <span className="text-primary font-mono mr-1">03</span> Reclaim
            </a>
            <a href="#how-it-works" className="transition-colors hover:text-foreground">
              <span className="text-primary font-mono mr-1">04</span> Method
            </a>
            <a href="#compare" className="transition-colors hover:text-foreground">
              <span className="text-primary font-mono mr-1">05</span> Compare
            </a>
            <a href="#faq" className="transition-colors hover:text-foreground">
              <span className="text-primary font-mono mr-1">06</span> FAQ
            </a>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com/jugniG/screenly"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Screenly on GitHub"
              className="hidden items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-xs font-semibold text-foreground transition-all hover:bg-secondary sm:inline-flex"
            >
              <FaGithub className="size-3.5" />
              <span>Open Source</span>
            </a>
            <a
              href="/install"
              className="btn-quippy inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold sm:text-sm"
            >
              Get the App <ArrowRight className="size-3.5" />
            </a>
          </div>
        </nav>
      </header>

      <main id="main-content">
        <HeroSpotlight />
        <RelatableScenarios />
        <ScienceStory />
        <ReclaimCategories />
        <TwelveWeekRoadmap />
        <HowItWorksMethod />
        <ComparisonTable />
        <FaqSection />
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/80 py-16 text-sm" role="contentinfo">
        <div className="mx-auto max-w-6xl px-5">
          <div className="grid gap-10 md:grid-cols-4 md:items-start">
            <div className="md:col-span-2">
              <Logo iconSize="md" />
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
                Screenly puts your money behind the version of you that wanted to stop. Lock the
                apps that distract you with money on the line.
              </p>
              <div className="mt-5 flex items-center gap-4 text-muted-foreground">
                <a
                  href="https://github.com/jugniG/screenly"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold hover:text-foreground"
                >
                  <FaGithub className="size-4" /> GitHub Repository
                </a>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold tracking-wider text-foreground uppercase">Navigation</p>
              <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
                <li>
                  <a href="#scenarios" className="hover:text-foreground">
                    Scenarios
                  </a>
                </li>
                <li>
                  <a href="#science" className="hover:text-foreground">
                    The Science
                  </a>
                </li>
                <li>
                  <a href="#categories" className="hover:text-foreground">
                    Life Reclaimed
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="hover:text-foreground">
                    Method
                  </a>
                </li>
                <li>
                  <a href="#compare" className="hover:text-foreground">
                    Comparison
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-foreground">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold tracking-wider text-foreground uppercase">Product & Trust</p>
              <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
                <li>
                  <a href="/install" className="hover:text-foreground">
                    Get the App
                  </a>
                </li>
                <li>
                  <a href="/privacy" className="hover:text-foreground">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="/delete-account" className="hover:text-foreground">
                    Account Deletion
                  </a>
                </li>
                <li>
                  <span className="text-xs text-muted-foreground/80">
                    Google Play Verified Billing
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 text-xs text-muted-foreground sm:flex-row">
            <p>© {new Date().getFullYear()} Screenly. Open source. Built for people who want their hours back.</p>
            <p>Start free · Set up in 2 minutes.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
