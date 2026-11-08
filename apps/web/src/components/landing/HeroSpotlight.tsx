import { ArrowRight, CheckCircle2, Shield, Sparkles } from "lucide-react";
import BlockScreen from "../BlockScreen";

export function HeroSpotlight() {
  return (
    <section className="relative overflow-hidden pt-24 pb-16 md:pt-32 md:pb-24">
      {/* Background radial glow */}
      <div className="warm-glow pointer-events-none absolute inset-0 -z-10 opacity-60" />

      <div className="mx-auto max-w-6xl px-5">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16">
          {/* Left Column: Authentic Screenly Pitch */}
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1 text-xs font-bold tracking-wider text-muted-foreground uppercase shadow-sm">
              <span className="size-2 rounded-full bg-primary animate-pulse" /> MORE TIME FOR WHAT MATTERS
            </div>

            <h1 className="mt-5 text-4xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl leading-[1.08] sm:leading-[1.04]">
              Your day,
              <br />
              but <span className="serif text-primary">longer.</span>
            </h1>

            <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
              Screenly helps you set app limits — and stick to them. Put money behind your
              commitment. Stay under and keep it.
            </p>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <a
                href="/install"
                className="btn-quippy inline-flex items-center gap-2 px-6 py-3 text-sm font-bold sm:text-base"
              >
                Get Started <ArrowRight className="size-4" />
              </a>
              <a
                href="#science"
                className="btn-quippy-secondary inline-flex items-center gap-2 px-6 py-3 text-sm font-bold"
              >
                Learn the science <ArrowRight className="size-3.5" />
              </a>
            </div>

            <p className="mt-4 text-xs font-semibold text-muted-foreground/80">
              Start free · Set up in 2 minutes · Open source
            </p>

            {/* Quippy-style Floating Feature Chips */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5 lg:justify-start">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-bold text-foreground shadow-sm">
                <CheckCircle2 className="size-3.5 text-primary" />
                <span>Zero soft bypasses</span>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-bold text-foreground shadow-sm">
                <Sparkles className="size-3.5 text-primary" />
                <span>100% stake kept on win</span>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-bold text-foreground shadow-sm">
                <Shield className="size-3.5 text-primary" />
                <span>Native Android enforcer</span>
              </div>
            </div>
          </div>

          {/* Right Column: Visual BlockScreen Mockup with Floating Badges */}
          <div className="relative flex justify-center">
            {/* Ambient glow behind device */}
            <div className="absolute -inset-4 rounded-full bg-primary/10 blur-2xl" />

            {/* Quippy-style Floating Pill 1 (Top Right) */}
            <div className="absolute -top-3 -right-2 z-20 hidden sm:flex items-center gap-2 rounded-2xl border border-border bg-card/95 px-3.5 py-2 text-xs font-bold text-foreground shadow-lg backdrop-blur-sm animate-bounce-subtle">
              <span className="size-2 rounded-full bg-destructive animate-ping" />
              <span>YouTube locked · 7:24 PM</span>
            </div>

            {/* The Product BlockScreen */}
            <div className="relative z-10 transform transition-transform hover:scale-[1.02]">
              <BlockScreen />
            </div>

            {/* Quippy-style Floating Pill 2 (Bottom Left) */}
            <div className="absolute -bottom-3 -left-3 z-20 hidden sm:flex items-center gap-2 rounded-2xl border border-border bg-card/95 px-3.5 py-2 text-xs font-bold text-foreground shadow-lg backdrop-blur-sm">
              <span className="grid size-5 place-items-center rounded-full bg-primary text-white text-[10px]">
                ₹
              </span>
              <span>₹100 Stake Protected</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
