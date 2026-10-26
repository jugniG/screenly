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
          "Screenly for Android is rolling out in small rounds. Join the early group and install it right from Google Play.",
      },
      { property: "og:title", content: "Install Screenly - Early Access" },
      {
        property: "og:description",
        content:
          "Screenly for Android is rolling out in small rounds. Join the early group and install it right from Google Play.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Install,
});

// This single link covers both jobs: Google Play first asks the person to join
// the early group, and the same page then offers the install - so the page
// never needs to explain two separate links.
const PLAY_EARLY_ACCESS_URL = "https://play.google.com/apps/testing/com.screenly.app";
const PLAY_OPEN_URL = "https://play.google.com/store/apps/details?id=com.screenly.app";

const steps = [
  {
    title: "Join the early group",
    body: "Tap the button below. Google Play opens and asks whether you want to join Screenly's early group.",
  },
  {
    title: "Install from Play",
    body: "After you accept, the same screen offers Screenly to install. That's it - everything else happens inside the app.",
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
          <span className="live-dot" /> EARLY ACCESS. FEW PEOPLE AT A TIME.
        </p>
        <h1 className="mt-5 text-5xl font-bold leading-[0.98] [word-spacing:0.015em] sm:text-6xl">
          You're early.
          <br />
          That's <span className="serif">the point.</span>
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-foreground/80">
          Screenly for Android is rolling out in small rounds. Each round gets real attention from
          us, and your feedback shapes what ships next.
        </p>

        <div className="mt-10 space-y-4 rounded-3xl border border-border bg-card p-6 sm:p-8">
          {steps.map((step, index) => (
            <div key={step.title} className="flex flex-row items-start gap-4">
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white">
                {index + 1}
              </span>
              <div>
                <h2 className="text-base font-semibold">{step.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </div>
            </div>
          ))}

          <a
            href={PLAY_EARLY_ACCESS_URL}
            className="button mt-6 inline-flex items-center gap-3 rounded-full bg-ink px-7 py-3.5 text-sm font-medium text-white"
          >
            Get early access <ArrowRight className="size-4" />
          </a>
        </div>

        <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
          Rounds fill up. If Play says Screenly isn't available yet, your Google account isn't in
          this round - <a href="/login" className="font-medium text-foreground underline underline-offset-4">sign in</a> and
          we'll add you to the next one.
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
