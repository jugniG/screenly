import { AlertCircle, Clock, Hourglass, MessageSquare, Trash2 } from "lucide-react";
import { FaInstagram, FaYoutube } from "react-icons/fa";

const SCENARIOS = [
  {
    app: "Instagram",
    time: "1:40 AM",
    icon: FaInstagram,
    iconColor: "text-pink-600 bg-pink-50 border-pink-100",
    quote: "opened Instagram to check one DM. looked up at 1:40 AM.",
    tag: "the midnight drift",
    visualLabel: "Doomscroll Loop",
    visualBadge: "+1h 40m past midnight",
  },
  {
    app: "YouTube",
    time: "Dinner",
    icon: FaYoutube,
    iconColor: "text-red-600 bg-red-50 border-red-100",
    quote: "told myself 5 mins of YouTube with dinner. watched 3 video essays.",
    tag: "the dinner spiral",
    visualLabel: "Auto-play Trap",
    visualBadge: "3 videos · 1h 20m",
  },
  {
    app: "Screen Time",
    time: "Limit Reached",
    icon: Hourglass,
    iconColor: "text-amber-600 bg-amber-50 border-amber-100",
    quote: "set a screen time limit. tapped 'Ignore 15 mins' five times.",
    tag: "the soft lock",
    visualLabel: "Bypass Loophole",
    visualBadge: "Ignored 5x in a row",
  },
  {
    app: "Reflex",
    time: "Phone Unlock",
    icon: MessageSquare,
    iconColor: "text-blue-600 bg-blue-50 border-blue-100",
    quote: "unlocked to write a quick note. lost 35 mins inside Reels.",
    tag: "the zombie pickup",
    visualLabel: "Muscle Twitch",
    visualBadge: "Zero intent scroll",
  },
  {
    app: "Dinner Table",
    time: "Evening",
    icon: Clock,
    iconColor: "text-purple-600 bg-purple-50 border-purple-100",
    quote: "sat at dinner with friends. everyone staring silently at glass.",
    tag: "the silent table",
    visualLabel: "Absent Presence",
    visualBadge: "4 screens glowing",
  },
  {
    app: "Settings",
    time: "Boredom",
    icon: Trash2,
    iconColor: "text-red-600 bg-red-50 border-red-100",
    quote: "downloaded three blocker apps. deleted every one when bored.",
    tag: "the delete escape",
    visualLabel: "No Stakes",
    visualBadge: "Uninstalled in 5s",
  },
];

export function RelatableScenarios() {
  return (
    <section id="scenarios" className="border-y border-border bg-card/40 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mx-auto max-w-2xl text-center">
          <p className="inline-block rounded-full bg-secondary px-3 py-1 text-xs font-bold tracking-wider text-muted-foreground uppercase">
            Relatable moments
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Do any of these sound familiar?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            If these scenes feel uncomfortably relatable, you're in the right place.
          </p>
        </div>

        {/* Visual Phone Notification & Moment Cards */}
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SCENARIOS.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.tag}
                className="group relative flex flex-col justify-between rounded-3xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
              >
                {/* Visual Smartphone Notification Header */}
                <div>
                  <div className="flex items-center justify-between rounded-2xl bg-secondary/60 p-2.5">
                    <div className="flex items-center gap-2">
                      <div className={`grid size-7 place-items-center rounded-lg border ${s.iconColor}`}>
                        <Icon className="size-3.5" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-foreground leading-none">{s.app}</p>
                        <p className="text-[10px] text-muted-foreground">{s.visualLabel}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-card px-2 py-0.5 text-[10px] font-bold text-primary shadow-xs">
                      {s.time}
                    </span>
                  </div>

                  {/* Relatable Quote */}
                  <p className="mt-4 font-display text-base font-bold leading-snug text-foreground">
                    "{s.quote}"
                  </p>
                </div>

                {/* Visual Status Pill & Tag */}
                <div className="mt-5 flex items-center justify-between border-t border-border/70 pt-3 text-xs">
                  <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                    {s.visualBadge}
                  </span>
                  <span className="font-mono text-xs font-bold text-primary">
                    {s.tag}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quippy-style Reassuring Callout */}
        <div className="mt-8 flex items-center justify-center gap-3 rounded-2xl border border-border bg-secondary/50 p-4 text-center">
          <AlertCircle className="size-4 text-primary shrink-0" />
          <p className="text-xs sm:text-sm font-bold text-foreground">
            You don't lack willpower. You just lack consequences.
          </p>
        </div>
      </div>
    </section>
  );
}
