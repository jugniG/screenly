import { useEffect, useState } from "react";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Crown,
  Plus,
  ShieldCheck,
  Trophy,
  UserPlus,
} from "lucide-react";

/**
 * Marketing mockup of the real app. Every screen and tab here corresponds to a
 * shipped route - Screen Time, Limits and Leaderboard are the three tabs in
 * apps/android_app/src/app/(protected)/(tabs)/_layout.tsx - so the page never
 * shows something the product doesn't have.
 *
 * Navigation is dots-only. An earlier version advanced itself every 5s, which
 * moved the page under the reader forever and ignored prefers-reduced-motion.
 */

type AppRow = {
  name: string;
  limit: string;
  used: string;
  progress: number;
  danger?: boolean;
  tint: string;
  image: string;
};

const rows: AppRow[] = [
  {
    name: "YouTube",
    limit: "1h / day",
    used: "Limit reached",
    progress: 100,
    danger: true,
    tint: "",
    image: "/yt.png",
  },
  {
    name: "Chess",
    limit: "45m / day",
    used: "15m used",
    progress: 33,
    tint: "bg-[oklch(0.55_0.12_150)]",
    image: "/chesscom.webp",
  },
  {
    name: "X",
    limit: "5m / hr",
    used: "4m used",
    progress: 82,
    danger: true,
    tint: "bg-ink",
    image: "/x.webp",
  },
];

const usageApps = [
  { name: "YouTube", time: "1h 04m", pct: 63, tint: "", image: "/yt.png" },
  { name: "X", time: "38m", pct: 37, tint: "bg-ink", image: "/x.webp" },
  { name: "Chess", time: "15m", pct: 15, tint: "bg-[oklch(0.55_0.12_150)]", image: "/chesscom.webp" },
];

const bars = [42, 68, 55, 80, 47, 62, 35];
const days = ["M", "T", "W", "T", "F", "S", "S"];

const leaders = [
  { name: "Aarav", time: "1h 12m", you: false },
  { name: "You", time: "2h 04m", you: true },
  { name: "Meera", time: "2h 38m", you: false },
  { name: "Dad", time: "3h 21m", you: false },
];

// Icon choice mirrors the shipped tab bar rather than being decorative.
const TABS = [
  { label: "Screen time", icon: BarChart3 },
  { label: "Limits", icon: ShieldCheck },
  { label: "Leaderboard", icon: Trophy },
];

function AppIcon({ image, tint, className }: { image: string; tint: string; className: string }) {
  return (
    <span className={`grid shrink-0 place-items-center overflow-hidden rounded-lg ${tint} ${className}`}>
      <img src={image} alt="" className="size-full object-cover" />
    </span>
  );
}

function ScreenTime() {
  return (
    <div className="px-4 pb-6">
      <div className="flex items-center justify-between px-1 pb-3">
        <div>
          <p className="text-xs text-muted-foreground">Today</p>
          <p className="font-display text-xl font-semibold text-foreground">3h 39m</p>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-border bg-background px-2 py-1 text-[10px] text-muted-foreground">
          <ChevronLeft className="size-3" />
          <span className="font-medium text-foreground">Sep 8</span>
          <ChevronRight className="size-3" />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-background p-3">
        <div className="flex h-24 items-end justify-between gap-1.5">
          {bars.map((h, i) => (
            /* The bar's percentage needs a definite-height parent, and the day
               label must not be counted in that height - otherwise the tallest
               bar (80% of 96px) plus the label overflows the chart. flex-1
               hands the bar a region sized by what is left after the label, and
               items-end stands the bar on the baseline. */
            <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
              <div className="flex w-full flex-1 items-end">
                <div
                  className={`w-full rounded-md ${i === 3 ? "bg-primary" : "bg-primary/25"}`}
                  style={{ height: `${h}%` }}
                />
              </div>
              <span className="text-[9px] text-muted-foreground">{days[i]}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-4 px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Most used
      </p>
      <div className="mt-2 space-y-2">
        {usageApps.map((a) => (
          <div
            key={a.name}
            className="flex items-center gap-3 rounded-xl border border-border bg-background p-2.5"
          >
            <AppIcon image={a.image} tint={a.tint} className="size-7" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">{a.name}</span>
                <span className="text-[10px] text-muted-foreground">{a.time}</span>
              </div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${a.pct}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Limits() {
  return (
    <>
      <div className="flex items-start justify-between px-5 pb-4">
        <div>
          <p className="text-xs text-muted-foreground">Good evening,</p>
          <p className="font-display text-base font-semibold text-foreground">Sahil</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground shadow-[0_0_0_1px_color-mix(in_oklab,var(--primary-foreground)_20%,transparent),0_4px_12px_-4px_color-mix(in_oklab,var(--primary)_60%,transparent),inset_0_1px_0_0_color-mix(in_oklab,var(--primary-foreground)_25%,transparent)]">
          <Plus className="size-3" /> Add App
        </span>
      </div>

      <div className="space-y-3 px-4 pb-6">
        {rows.map((row) => (
          <div
            key={row.name}
            className="rounded-2xl border border-border bg-background p-3 shadow-[0_4px_14px_-6px_color-mix(in_oklab,var(--ink)_12%,transparent),inset_0_1px_0_0_color-mix(in_oklab,var(--primary-foreground)_8%,transparent)]"
          >
            <div className="flex items-center gap-3">
              <AppIcon image={row.image} tint={row.tint} className="size-8" />
              <span className="flex-1 text-sm font-medium text-foreground">{row.name}</span>
              <span className="text-xs text-muted-foreground">{row.limit}</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${row.danger ? "bg-destructive" : "bg-primary"}`}
                style={{ width: `${row.progress}%` }}
              />
            </div>
            <p
              className={`mt-1.5 text-right text-[10px] ${row.danger ? "text-destructive" : "text-muted-foreground"}`}
            >
              {row.used}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}

function Leaderboard() {
  return (
    <div className="px-4 pb-6">
      <div className="flex items-center justify-between px-1 pb-3">
        <div>
          <p className="text-xs text-muted-foreground">This week</p>
          <p className="font-display text-base font-semibold text-foreground">Family circle</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1.5 text-[10px] font-semibold text-primary-foreground">
          <UserPlus className="size-3" /> Invite
        </span>
      </div>

      <div className="rounded-2xl border border-primary/40 bg-primary/10 p-3">
        <div className="flex items-center gap-2">
          <Crown className="size-4 text-primary" />
          <span className="flex-1 text-sm font-semibold text-foreground">Aarav is winning</span>
          <span className="text-xs font-medium text-primary">1h 12m</span>
        </div>
        <p className="mt-1 text-[10px] text-muted-foreground">
          Lowest screentime takes the pot on Sunday.
        </p>
      </div>

      <div className="mt-3 space-y-2">
        {leaders.map((l, i) => (
          <div
            key={l.name}
            className={`flex items-center gap-3 rounded-xl border p-2.5 ${
              l.you ? "border-primary/50 bg-background" : "border-border bg-background"
            }`}
          >
            <span className="grid size-6 place-items-center rounded-full bg-muted text-[10px] font-semibold text-foreground">
              {i + 1}
            </span>
            <span className="flex-1 text-xs font-medium text-foreground">{l.name}</span>
            <span className="text-[10px] text-muted-foreground">{l.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const screens = [
  { Screen: ScreenTime, label: "Screen time" },
  { Screen: Limits, label: "Limits" },
  { Screen: Leaderboard, label: "Leaderboard" },
];

const DWELL_MS = 3000;

/**
 * Auto-advance halts for anyone who asked their OS to reduce motion, and for
 * anyone currently hovering or focused on the mockup - an unstoppable carousel
 * is unreadable, since the screen changes before you finish looking at it.
 */
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  return reduced;
}

/** The device shell, shared by every screen so the bezel never gets duplicated. */
function Phone({ children, activeTab }: { children: React.ReactNode; activeTab: number }) {
  return (
    <div className="relative mx-auto w-[280px] rounded-[2.6rem] border-[10px] border-ink bg-ink shadow-soft bezel-glow sm:w-[320px]">
      <div className="glass-reflection overflow-hidden rounded-[2rem] bg-card">
        <div className="flex items-center justify-between px-5 pt-3 text-[10px] font-medium text-muted-foreground">
          <span>7:24</span>
          <span className="tracking-tight">••• ▲ ▮</span>
        </div>

        {/* Fixed height keeps the carousel from resizing as screens change. */}
        <div className="min-h-[460px] pt-4">{children}</div>

        <div className="flex items-center justify-around border-t border-border py-3 text-[9px]">
          {TABS.map((t, i) => {
            const Icon = t.icon;
            return (
              <span
                key={t.label}
                className={`flex flex-col items-center gap-0.5 ${
                  i === activeTab ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="size-4" /> {t.label}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function PhoneMockup() {
  // Opens on Limits - it is the screen the whole product is about.
  const [active, setActive] = useState(1);
  const [held, setHeld] = useState(false);
  const reduceMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (held || reduceMotion) return;
    const timer = setInterval(() => {
      setActive((current) => (current + 1) % screens.length);
    }, DWELL_MS);
    return () => clearInterval(timer);
  }, [held, reduceMotion]);

  const hold = () => setHeld(true);
  const release = () => setHeld(false);

  return (
    <div
      className="phone-aurora mx-auto w-full max-w-[340px]"
      onMouseEnter={hold}
      onMouseLeave={release}
      onFocusCapture={hold}
      onBlurCapture={release}
    >
      <div className="overflow-hidden py-4">
        <div
          className="flex transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ transform: `translateX(-${active * 100}%)` }}
        >
          {screens.map(({ Screen }, i) => (
            <div
              key={i}
              className={`w-full shrink-0 transition-all duration-700 ${
                i === active ? "scale-100 opacity-100 blur-0" : "scale-90 opacity-40 blur-[1px]"
              }`}
            >
              <Phone activeTab={i}>
                <Screen />
              </Phone>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-2.5">
        {screens.map((s, i) => (
          <button
            key={s.label}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`Show ${s.label} screen`}
            aria-current={i === active}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === active
                ? "w-7 dot-glow bg-primary"
                : "w-2 bg-ink/25 hover:bg-primary/60"
            }`}
          />
        ))}
      </div>
    </div>
  );
}