import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  CircleDollarSign,
  TriangleAlert,
  Hourglass,
} from "lucide-react";
import { PhoneMockup } from "@/components/PhoneMockup";
import { Logo } from "@/components/Logo";
import { FaGithub } from "react-icons/fa";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Screenly — Make your day longer by cutting screentime" },
      {
        name: "description",
        content:
          "Screenly locks the apps that distract you and backs your focus goals with real financial stakes. Open source, science-backed screentime control.",
      },
      { property: "og:title", content: "Screenly — Make your day longer" },
      {
        property: "og:description",
        content: "Lock distracting apps, stake your money, and win your hours back.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const pillars = [
  { icon: ShieldCheck, title: "Lock apps", sub: "that distract you" },
  { icon: CircleDollarSign, title: "Stake to lock", sub: "your screentime" },
  { icon: TriangleAlert, title: "Real consequences", sub: "lose money if you slip" },
  { icon: FaGithub, title: "Open source", sub: "audit every line of code" },
];

const stats = [
  { value: "4h 12m", label: "Average daily phone use" },
  { value: "58 days", label: "To rewire a habit loop" },
  { value: "+21%", label: "Follow-through with committed stakes (RCT, N=1629)" },
];

const steps = [
  {
    n: "01",
    title: "Pick your leaks",
    body: "Choose the apps stealing your evenings and set a daily or hourly ceiling for each one.",
  },
  {
    n: "02",
    title: "Put money on it",
    body: "Commit an amount you'd hate to lose while your limit is live.",
  },
  {
    n: "03",
    title: "Break it, lose it",
    body: "Stay under and keep every cent. Blow past the limit and the stake is gone — no negotiating.",
  },
];

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Logo iconSize="md" />
          <div className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">
              Features
            </a>
            <a href="#science" className="transition-colors hover:text-foreground">
              Science
            </a>
            <a href="#how" className="transition-colors hover:text-foreground">
              How it works
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
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="warm-glow pointer-events-none absolute inset-0" />
          <div className="relative mx-auto grid max-w-6xl gap-16 px-5 pb-24 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pt-24">
            <div>
              <span className="pill-glow inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
                <span className="size-1.5 rounded-full bg-primary shadow-[0_0_8px_color-mix(in_oklab,var(--primary)_70%,transparent)]" />
                Loss aversion, turned into a focus tool
              </span>
              <h1 className="mt-6 font-display text-6xl font-extrabold leading-[0.95] sm:text-7xl">
                Make your day
                <br />
                <span className="text-primary">longer,</span>
              </h1>
              <p className="mt-4 font-display text-2xl font-medium text-muted-foreground sm:text-3xl">
                by reducing your screentime.
              </p>
              <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
                Screenly helps you stay disciplined by backing your focus goals with real financial
                stakes.
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

              <dl className="mt-14 grid max-w-lg grid-cols-2 gap-x-8 gap-y-6">
                {pillars.map(({ icon: Icon, title, sub }) => (
                  <div key={title} className="flex items-start gap-3">
                    <Icon className="mt-0.5 size-5 shrink-0 text-primary" />
                    <div>
                      <dt className="text-sm font-semibold">{title}</dt>
                      <dd className="text-sm text-muted-foreground">{sub}</dd>
                    </div>
                  </div>
                ))}
              </dl>
            </div>

            <div className="relative">
              <div className="relative pt-6">
                <PhoneMockup />
              </div>
              <div className="mx-auto mt-[-2rem] h-10 w-3/4 rounded-[50%] bg-ink/15 blur-xl" />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="border-y border-border bg-card">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <h2 className="max-w-xl text-4xl font-bold">Three steps. One uncomfortable promise.</h2>
            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {steps.map((s) => (
                <div key={s.n} className="card-premium rounded-3xl bg-card p-8">
                  <span className="font-display text-sm font-semibold text-primary">{s.n}</span>
                  <h3 className="mt-4 text-xl font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-6xl px-5 py-24">
          <div className="grid gap-10 md:grid-cols-2">
            <div className="card-dark-premium flex flex-col justify-between rounded-3xl bg-ink p-10 text-background">
              <h2 className="text-4xl font-bold leading-tight">
                Willpower is a bad plan.
                <br />
                Money is a better one.
              </h2>
              <p className="mt-6 text-sm leading-relaxed opacity-70">
                Every limit you set is enforced at the OS level and locked behind a stake. No snooze
                button, no "just five more minutes."
              </p>
            </div>
            <div className="grid gap-6">
              {[
                {
                  t: "Hard locks, not nudges",
                  d: "Apps go dark the moment you hit the ceiling — not after a dismissible banner.",
                },
                {
                  t: "Staked money",
                  d: "Your stake is the price of giving up. Keep it by keeping your commitment.",
                },
                {
                  t: "Forced accountability",
                  d: "Screenly works at the OS level, with your permission, and can't be snoozed off.",
                },
                {
                  t: "Real-time usage tracking",
                  d: "Live breakdown of how close each app is to its limit — and how much time you've got left.",
                },
              ].map((f) => (
                <div key={f.t} className="card-premium rounded-2xl border border-border bg-card p-7">
                  <h3 className="text-lg font-semibold">{f.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Science */}
        <section id="science" className="border-y border-border bg-accent/50">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <h2 className="text-4xl font-bold">The science, briefly.</h2>
            <p className="mt-3 max-w-lg text-muted-foreground">
              People work roughly twice as hard to avoid losing something as they do to gain it.
              Screenly points that instinct at your screentime.
            </p>
            <div className="mt-12 grid gap-8 sm:grid-cols-3">
              {stats.map((s) => (
                <div key={s.label} className="stat-premium border-t-2 border-primary pt-5">
                  <p className="font-display text-5xl font-extrabold tracking-tight">{s.value}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section id="cta" className="mx-auto max-w-6xl px-5 py-24 text-center">
          <h2 className="font-display text-5xl font-extrabold leading-tight">
            Get your evenings back.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-muted-foreground">
            Set your first limit in under two minutes. Stake as little as one dollar.
          </p>
          <a
            href="/login"
            className="btn-premium mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-foreground"
          >
            Get Started <ArrowUpRight className="size-4" />
          </a>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-muted-foreground sm:flex-row">
          <span className="flex items-center gap-2">
            <Hourglass className="size-4 text-primary" /> Screenly
          </span>
          <span>Open source. Built for people who want their hours back.</span>
        </div>
      </footer>
    </div>
  );
}