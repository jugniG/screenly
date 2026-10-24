import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import BlockScreen from "@/components/BlockScreen";
import { DemoScreens } from "@/components/DemoScreens";
import { Logo } from "@/components/Logo";
import { FaGithub } from "react-icons/fa";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Screenly - Your day, but longer" },
      {
        name: "description",
        content:
          "After your first week with Screenly, you'll find hours in your day you didn't know you had. Lock the apps that distract you with money on the line.",
      },
      { property: "og:title", content: "Screenly - Your day, but longer" },
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

const faqs = [
  [
    "How does Screenly work?",
    "Pick the apps you want to spend less time on, set a daily or hourly limit, and choose a stake. Stay within your limits and you keep every rupee of it.",
  ],
  [
    "Do I have to put money on it?",
    "No. You can start on the free tier and never stake anything. The commitment is the extra layer, not the entry fee.",
  ],
  [
    "What happens if I go over my limit?",
    "The stake you committed is what you stand to lose. Screenly is up front about that before you pick an amount — nothing is charged silently.",
  ],
  [
    "What are the actual stakes?",
    "From ₹50 up to ₹1000, over a week, a month or a year. The app only ever charges the amount you picked, and the server prices it independently so it can't be tampered with.",
  ],
  [
    "Is Screenly open source?",
    "Yes. Every line is on GitHub — including the Android accessibility service and the server that verifies payments.",
  ],
  [
    "Can I use it with my family?",
    "Family circles turn less scrolling into a shared challenge. Invite people, compare screen time, and keep each other honest.",
  ],
];

// Each band is min-h-dvh rather than a fixed pixel height. The vh/lvh units
// resolve against the *largest* viewport, so on mobile a fixed-height section
// is taller than the screen once browser chrome retracts, leaving a dead gap.
// dvh tracks the real viewport, and min-h (not h) lets a band grow when its
// content is taller than the screen - which it is on small phones, where the
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
          <div
            className={`${shell} grid gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16 lg:py-0`}
          >
            <div>
              <p className="eyebrow text-muted-foreground">
                <span className="live-dot" /> MORE TIME FOR WHAT MATTERS.
              </p>
              <h1 className="mt-6 text-5xl font-bold leading-[0.98] [word-spacing:0.015em] sm:text-6xl lg:text-7xl">
                Your day,
                <br />
                but <span className="serif">longer.</span>
              </h1>
              <p className="mt-6 max-w-md text-lg leading-relaxed text-foreground/80">
                More room for the things you meant to do. Screenly helps you set app limits — and
                stick to them. Put money behind your commitment. Stay under and keep it.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-4">
                <a
                  href="/login"
                  className="button inline-flex items-center gap-4 rounded-full bg-ink px-7 py-3.5 text-sm font-medium text-white"
                >
                  Make room for your day <ArrowRight className="size-4" />
                </a>
                <a
                  href="#science"
                  className="btn-outline-premium inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3.5 text-sm font-medium text-foreground"
                >
                  The science <ArrowRight className="size-4" />
                </a>
              </div>

              <p className="mt-6 text-sm text-muted-foreground">
                Start free · Set up in 2 minutes · Open source
              </p>
            </div>

            <BlockScreen />
          </div>
        </section>

        <DemoScreens />

        <section id="science" className={`${band} border-y border-border bg-accent/50`}>
          <div className={shell}>
            <div className="mx-auto max-w-4xl text-center">
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

        <section id="faq" className={`${band} border-y border-border bg-card`}>
          <div className={shell}>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-4xl font-bold leading-[1.05] sm:text-5xl">
                The <span className="serif">obvious</span> questions.
              </h2>
            </div>

            <div className="mx-auto mt-14 max-w-3xl divide-y divide-border border-y border-border">
              {faqs.map(([q, a]) => (
                <details key={q} className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-left text-base font-semibold marker:hidden">
                    {q}
                    <span className="shrink-0 text-xl font-normal text-muted-foreground transition-transform duration-200 group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="max-w-2xl pb-5 text-sm leading-relaxed text-muted-foreground">{a}</p>
                </details>
              ))}
            </div>

            <div className="mt-14 text-center">
              <h2 className="mx-auto max-w-3xl text-4xl font-bold leading-[1.05] sm:text-5xl">
                Willpower is a bad plan.
                <br />
                <span className="serif">Money is a better one.</span>
              </h2>
              <a
                href="/login"
                className="button mt-10 inline-flex items-center gap-4 rounded-full bg-ink px-8 py-4 text-sm font-medium text-white"
              >
                Get started <ArrowUpRight className="size-4" />
              </a>
              <p className="mt-5 text-sm text-muted-foreground">
                Set your first limit in under two minutes. Start free.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-6 text-sm sm:flex-row">
          <span className="flex items-center gap-2">
            <Logo iconSize="sm" />
          </span>
          <span className="text-muted-foreground">Open source. Built for people who want their hours back.</span>
        </div>
      </footer>
    </div>
  );
}