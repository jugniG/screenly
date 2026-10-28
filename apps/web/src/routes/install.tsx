import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/install")({
  head: () => ({
    meta: [
      { title: "Install Screenly - Early Access" },
      {
        name: "description",
        content:
          "Screenly for Android is in open early access. Join the group on Google and install it from Play - no waiting list.",
      },
      { property: "og:title", content: "Install Screenly - Early Access" },
      {
        property: "og:description",
        content:
          "Screenly for Android is in open early access. Join the group on Google and install it from Play - no waiting list.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Install,
});

// Play's tester field only accepts Google Groups, not raw emails - the group
// is what makes access self-serve: anyone who joins it becomes a tester
// without us touching the Console again.
const GROUP_JOIN_URL = "https://groups.google.com/g/screenly-early-access";
const PLAY_EARLY_ACCESS_URL = "https://play.google.com/apps/testing/com.screenly.app";
const PLAY_OPEN_URL = "https://play.google.com/store/apps/details?id=com.screenly.app";

const steps = [
  {
    title: "Join the early group",
    body: "One tap on a Google page. Use the same Google account you'll install with - joining is open to everyone.",
    href: GROUP_JOIN_URL,
    cta: "Join the group",
    primary: true,
  },
  {
    title: "Install from Play",
    body: "Right after joining, open the link below. Play offers Screenly to install - everything else happens inside the app.",
    href: PLAY_EARLY_ACCESS_URL,
    cta: "Install from Play",
    primary: false,
  },
];

function Install() {
  return (
    <div className="bg-background text-foreground">
      <header className="border-b border-border/70">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <a href="/" aria-label="Screenly home" className="transition-opacity hover:opacity-80">
            <Logo iconSize="md" />
          </a>
          <a
            href="/login"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Sign in
          </a>
        </nav>
      </header>

      <main className="mx-auto max-w-2xl px-5 pb-20 pt-16 sm:pt-24">
        <p className="eyebrow text-muted-foreground">
          <span className="live-dot" /> EARLY ACCESS. OPEN RIGHT NOW.
        </p>
        <h1 className="mt-5 text-5xl font-bold leading-[0.98] [word-spacing:0.015em] sm:text-6xl">
          You're early.
          <br />
          That's <span className="serif">the point.</span>
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-foreground/80">
          Screenly for Android is in open early access. You install it through Google's early
          group, which anyone can join right now - no waiting list, no sign-in needed.
        </p>

        <div className="mt-10 space-y-4 rounded-3xl border border-border bg-card p-6 sm:p-8">
          {steps.map((step) => (
            <div key={step.title} className="flex flex-row items-start gap-4">
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white">
                {step.primary ? "1" : "2"}
              </span>
              <div>
                <h2 className="text-base font-semibold">{step.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                <a
                  href={step.href}
                  target={step.primary ? "_blank" : undefined}
                  rel={step.primary ? "noreferrer" : undefined}
                  className={
                    step.primary
                      ? "button mt-4 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-white"
                      : "btn-outline-premium mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-medium text-foreground"
                  }
                >
                  {step.cta} <ArrowRight className="size-4" />
                </a>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
          Use the same Google account for both steps. If Play says Screenly isn't available right
          after you join, Google just needs a few minutes to sync - try again shortly.
        </p>

        <a
          href={PLAY_OPEN_URL}
          className="btn-outline-premium mt-8 inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-medium text-foreground"
        >
          Already joined? Open in Play Store
        </a>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-6 text-sm sm:flex-row">
          <span className="flex items-center gap-2">
            <Logo iconSize="sm" />
          </span>
          <span className="text-muted-foreground">Android only for now. Open source, built for people who want their hours back.</span>
        </div>
      </footer>
    </div>
  );
}
