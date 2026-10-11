import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { PhoneMockup } from "@/components/PhoneMockup";
import { Logo } from "@/components/Logo";
import { FaGithub } from "react-icons/fa";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Screenly — Your day, but longer" },
      {
        name: "description",
        content:
          "After your first week with Screenly, you'll find hours in your day you didn't know you had. Lock the apps that distract you with money on the line.",
      },
      { property: "og:title", content: "Screenly — Your day, but longer" },
      {
        property: "og:description",
        content: "Lock distracting apps, stake your money, and find hours in your day you didn't know you had.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const beats = [
  {
    n: "01",
    title: "The leap",
    body: "The smartphone put a library, a newsroom and a games console in your pocket in fifteen years.",
  },
  {
    n: "02",
    title: "The turn",
    body: "Then it learned what you do at 11pm, and became the one thing competing with your evening.",
  },
  {
    n: "03",
    title: "The deal",
    body: "Screenly puts your money behind the version of you that wanted to stop.",
  },
];

const steps = [
  { n: "01", title: "Pick your leaks", body: "Choose the apps stealing your evenings." },
  { n: "02", title: "Put money on it", body: "Commit an amount you'd hate to lose." },
  { n: "03", title: "Break it, lose it", body: "Stay under and keep every cent." },
];

// Each band is min-h-dvh rather than a fixed pixel height. The vh/lvh units
// resolve against the *largest* viewport, so on mobile a fixed-height section
// is taller than the screen once browser chrome retracts, leaving a dead gap.
// dvh tracks the real viewport, and min-h (not h) lets a band grow when its
// content is taller than the screen — which it is on small phones, where the
// hero stacks the text above the mockup.
const band = "relative flex min-h-dvh items-center scroll-mt-16";
const shell = "relative mx-auto w-full max-w-6xl px-5";

function Index() {
  return (
    <div className="bg-background text-foreground">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <a href="/" aria-label="Screenly home" className="transition-opacity hover:opacity-80">
            <Logo iconSize="md" />
          </a>
          <div className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
            <a href="#science" className="transition-colors hover:text-foreground">
              Science
            </a>
            <a
              href="https://github.com/jugniG/screenly"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
            >
              Open Source <FaGithub className="size-4" />
            </a>
          </div>
          <a
            href="/login"
            className="btn-premium inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Get Started <ArrowRight className="size-4" />
          </a>
        </nav>
      </header>

      <main>
        <section className={`${band} overflow-hidden pt-16`}>
          <div className="warm-glow pointer-events-none absolute inset-0" />
          <div className={`${shell} grid gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16 lg:py-0`}>
            <div>
              <h1 className="font-display text-6xl font-extrabold leading-[0.95] [word-spacing:0.015em] sm:text-7xl">
                Your day,
                <br />
                <span className="text-primary">but longer 😌</span>
              </h1>
              <p className="mt-6 max-w-md text-lg leading-relaxed text-foreground/80">
                After your first week with{' '}
                <strong className="font-semibold text-foreground">Screenly</strong>, you&rsquo;ll
                find hours in your day you didn&rsquo;t know you had.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-5">
                <a
                  href="/login"
                  className="btn-premium inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-base font-semibold text-primary-foreground"
                >
                  Get Started <ArrowRight className="size-4" />
                </a>
                <a
                  href="#science"
                  className="btn-outline-premium inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3.5 text-base font-medium text-foreground"
                >
                  Learn the Science <ArrowRight className="size-4" />
                </a>
              </div>

              <p className="mt-6 text-sm text-muted-foreground">
                Start free · Set up in 2 minutes · Open source
              </p>
            </div>

            <div className="relative">
              <PhoneMockup />
            </div>
          </div>
        </section>

        <section id="science" className={`${band} border-y border-border bg-accent/50`}>
          <div className={shell}>
            <div className="mx-auto max-w-4xl text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-primary">
                Why it works
              </p>
              <p className="mx-auto text-xl font-medium leading-snug text-muted-foreground sm:text-2xl">
                Mobiles were the biggest tech revolution in human history.
              </p>
              <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-bold leading-[1.05] sm:text-5xl">
                Now they&rsquo;re <span className="text-primary">holding your hours</span>.
              </h2>
              <p className="mx-auto mt-7 max-w-md text-lg leading-relaxed text-foreground/70">
                Not your fault. Apps are designed to keep you in flow.
              </p>
            </div>

            <div className="mt-14 grid gap-8 border-t border-border pt-10 sm:grid-cols-3">
              {beats.map((b) => (
                <div key={b.n}>
                  <div className="flex items-baseline gap-2.5">
                    <span className="font-display text-sm font-semibold text-primary">{b.n}</span>
                    <h3 className="text-sm font-semibold text-foreground">{b.title}</h3>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/70">{b.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1 border-t border-border pt-8">
              <span className="font-display text-3xl font-extrabold tracking-tight text-primary">
                +21%
              </span>
              <span className="text-sm text-foreground/70">
                more follow-through when people commit money to their goals.
              </span>
            </div>
          </div>
        </section>

        <section id="start" className={`${band} overflow-hidden`}>
          <div className="warm-glow pointer-events-none absolute inset-0" />
          <div className={`${shell} text-center`}>
            <h2 className="mx-auto max-w-3xl font-display text-5xl font-extrabold leading-[1.02] sm:text-6xl">
              Willpower is a bad plan.
              <br />
              <span className="text-primary">Money is a better one.</span>
            </h2>

            <div className="mx-auto mt-14 grid max-w-4xl gap-4 sm:grid-cols-3">
              {steps.map((s) => (
                <div key={s.n} className="card-premium rounded-3xl bg-card p-7 text-left">
                  <span className="font-display text-sm font-semibold text-primary">{s.n}</span>
                  <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                </div>
              ))}
            </div>

            <a
              href="/login"
              className="btn-premium mt-12 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-foreground"
            >
              Get Started <ArrowUpRight className="size-4" />
            </a>
            <p className="mt-5 text-sm text-muted-foreground">
              Set your first limit in under two minutes. Start free.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-6 text-sm text-muted-foreground sm:flex-row">
          <span className="flex items-center gap-2">
            <Logo iconSize="sm" showWordmark={false} />
            <span>Screenly</span>
          </span>
          <span>Open source. Built for people who want their hours back.</span>
        </div>
      </footer>
    </div>
  );
}