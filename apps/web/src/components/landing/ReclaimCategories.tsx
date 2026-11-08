import { useState } from "react";
import { Coffee, Focus, Lock, Moon, ShieldCheck, Sparkles, Users } from "lucide-react";

const CATEGORIES = [
  {
    id: "deep-work",
    icon: Focus,
    name: "Deep Work",
    stat: "+2.5h / day",
    headline: "Finish work by 5:30 PM.",
    desc: "Lock feeds during work hours. Stop losing 30 minutes to random notification rabbit holes.",
    visual: {
      title: "Focus Block: Active",
      badge: "YouTube & X Locked",
      statLabel: "Focus State",
      statValue: "1h 45m uninterrupted",
      status: "Flow state protected",
    },
  },
  {
    id: "sleep",
    icon: Moon,
    name: "Sleep",
    stat: "+90 mins rest",
    headline: "Hard stop at 10:30 PM.",
    desc: "No blue light or infinite scrolls in bed. Fall asleep naturally within minutes.",
    visual: {
      title: "Bedtime Barrier: 10:30 PM",
      badge: "All Social Feeds Blocked",
      statLabel: "Rest Quality",
      statValue: "Asleep in 12 minutes",
      status: "Deep sleep restored",
    },
  },
  {
    id: "presence",
    icon: Users,
    name: "Presence",
    stat: "100% focused",
    headline: "Be in the room with people.",
    desc: "Leave your phone face-down at dinner. Zero nervous phantom checks.",
    visual: {
      title: "Dinner Table Protocol",
      badge: "Zero Pickups",
      statLabel: "Presence Score",
      statValue: "45m phone facedown",
      status: "Real conversations",
    },
  },
  {
    id: "boredom",
    icon: Sparkles,
    name: "Boredom",
    stat: "Calm restored",
    headline: "Re-learn downtime.",
    desc: "Stop reaching for dopamine in every elevator ride. Let your brain daydream again.",
    visual: {
      title: "Downtime Buffer",
      badge: "No Reflex Checking",
      statLabel: "Impulse Control",
      statValue: "0 unlocks in elevator",
      status: "Mind wandering restored",
    },
  },
  {
    id: "morning",
    icon: Coffee,
    name: "Mornings",
    stat: "+60 mins calm",
    headline: "Start with your own thoughts.",
    desc: "First hour belongs to you and your morning, not other people's feeds and notifications.",
    visual: {
      title: "Morning Autonomy",
      badge: "Feeds Locked until 8 AM",
      statLabel: "Morning Clarity",
      statValue: "60m screen-free start",
      status: "Coffee & Daylight first",
    },
  },
];

export function ReclaimCategories() {
  const [activeTab, setActiveTab] = useState(0);
  const active = CATEGORIES[activeTab];
  const Icon = active.icon;

  return (
    <section id="categories" className="border-b border-border bg-card/40 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mx-auto max-w-2xl text-center">
          <p className="inline-block rounded-full bg-secondary px-3 py-1 text-xs font-bold tracking-wider text-muted-foreground uppercase">
            Life reclaimed
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            What Screenly helps you reclaim.
          </h2>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Five daily moments where hours quietly disappear into glass.
          </p>
        </div>

        {/* Category Selector Pills */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          {CATEGORIES.map((cat, idx) => {
            const CatIcon = cat.icon;
            const isSelected = activeTab === idx;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveTab(idx)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all sm:text-sm ${
                  isSelected
                    ? "btn-quippy text-white scale-102"
                    : "border border-border bg-card text-foreground hover:bg-secondary/70"
                }`}
              >
                <CatIcon className="size-3.5" />
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Rich Visual Showcase Card */}
        <div className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-10">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
            {/* Left Column: Short, punchy copy */}
            <div className="lg:col-span-6">
              <div className="flex items-center gap-3">
                <div className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Moment 0{activeTab + 1}
                  </span>
                  <p className="font-mono text-sm font-bold text-primary">{active.stat}</p>
                </div>
              </div>

              <h3 className="mt-5 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {active.headline}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground sm:text-base leading-relaxed">
                {active.desc}
              </p>
            </div>

            {/* Right Column: Visual Product Widget Mockup */}
            <div className="lg:col-span-6">
              <div className="rounded-3xl border border-border bg-secondary/50 p-6 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-xs font-bold text-foreground">{active.visual.title}</span>
                  </div>
                  <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-[11px] font-bold text-destructive">
                    {active.visual.badge}
                  </span>
                </div>

                {/* Progress bar / Gauge */}
                <div className="mt-5 rounded-2xl bg-card p-4 border border-border/80">
                  <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                    <span>{active.visual.statLabel}</span>
                    <span className="font-mono text-primary font-bold">{active.visual.statValue}</span>
                  </div>
                  <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div className="h-full w-4/5 rounded-full bg-primary" />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs font-bold text-foreground">
                  <div className="flex items-center gap-1.5 text-primary">
                    <ShieldCheck className="size-4" />
                    <span>{active.visual.status}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Lock className="size-3" />
                    <span>Stakes Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
