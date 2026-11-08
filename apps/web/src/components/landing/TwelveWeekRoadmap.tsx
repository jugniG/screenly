import { Sparkles } from "lucide-react";

const MILESTONES = [
  {
    week: "Right now",
    badge: "Day 00",
    time: "4h 30m",
    pct: "100%",
    barColor: "bg-destructive",
    headline: "Unconscious loops",
    desc: "Unlocking every 6 minutes out of reflex.",
    highlight: false,
  },
  {
    week: "Week 01",
    badge: "First Win",
    time: "3h 15m",
    pct: "72%",
    barColor: "bg-amber-500",
    headline: "First stake kept",
    desc: "7 straight days under limit. Stake safe.",
    highlight: false,
  },
  {
    week: "Week 03",
    badge: "Reflex Broken",
    time: "2h 30m",
    pct: "55%",
    barColor: "bg-primary",
    headline: "Phantom checks fade",
    desc: "No reaching for phone in elevators.",
    highlight: false,
  },
  {
    week: "Week 06",
    badge: "Deep Work",
    time: "1h 45m",
    pct: "38%",
    barColor: "bg-primary",
    headline: "90-minute flow",
    desc: "Unbroken focus without notification checks.",
    highlight: false,
  },
  {
    week: "Week 09",
    badge: "Restful",
    time: "1h 15m",
    pct: "28%",
    barColor: "bg-primary",
    headline: "Bedtime calm",
    desc: "Hard stop at 10:30 PM. Fast sleep.",
    highlight: false,
  },
  {
    week: "Week 12",
    badge: "Sovereign",
    time: "45m",
    pct: "16%",
    barColor: "bg-emerald-500",
    headline: "15+ hours back",
    desc: "Phone is a deliberate tool, not a pacifier.",
    highlight: true,
  },
];

export function TwelveWeekRoadmap() {
  return (
    <section id="roadmap" className="py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mx-auto max-w-2xl text-center">
          <p className="inline-block rounded-full bg-secondary px-3 py-1 text-xs font-bold tracking-wider text-muted-foreground uppercase">
            12-Week Protocol
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Accomplish the focus you've dreamed of.
          </h2>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            A behavioral retraining protocol to permanently break the phone reflex.
          </p>
        </div>

        {/* Visual Progress Graph / Roadmap */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MILESTONES.map((m) => (
            <div
              key={m.week}
              className={`flex flex-col justify-between rounded-3xl border p-5 transition-all shadow-sm ${
                m.highlight
                  ? "border-primary bg-primary/5 shadow-md"
                  : "border-border bg-card"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-primary">
                    {m.week}
                  </span>
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-bold text-secondary-foreground">
                    {m.badge}
                  </span>
                </div>

                {/* Visual Daily Screen Time Meter */}
                <div className="mt-4 rounded-2xl bg-secondary/60 p-3">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-muted-foreground">Screen Time</span>
                    <span className="font-mono text-foreground">{m.time}</span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-border">
                    <div
                      className={`h-full rounded-full transition-all ${m.barColor}`}
                      style={{ width: m.pct }}
                    />
                  </div>
                </div>

                <h3 className="mt-3 text-base font-bold text-foreground">
                  {m.headline}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {m.desc}
                </p>
              </div>

              <div className="mt-4 border-t border-border/70 pt-3 text-[11px] font-bold text-muted-foreground">
                {m.highlight ? (
                  <span className="text-primary flex items-center gap-1">
                    <Sparkles className="size-3" /> Permanent habit upgrade
                  </span>
                ) : (
                  <span>Verified milestone</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
