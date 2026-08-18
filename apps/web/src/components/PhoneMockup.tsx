import { Home, User, Plus } from "lucide-react";

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

export function PhoneMockup() {
  return (
    <div className="phone-aurora float">
      <div className="relative mx-auto w-[280px] rounded-[2.6rem] border-[10px] border-ink bg-ink shadow-soft bezel-glow sm:w-[320px]">
        <div className="glass-reflection overflow-hidden rounded-[2rem] bg-card">
          <div className="flex items-center justify-between px-5 pt-3 text-[10px] font-medium text-muted-foreground">
            <span>7:24</span>
            <span className="tracking-tight">••• ▲ ▮</span>
          </div>

          <div className="flex items-start justify-between px-5 pb-4 pt-4">
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
                  <span
                    className={`grid size-8 place-items-center overflow-hidden rounded-sm ${row.tint}`}
                  >
                    <img
                      src={row.image}
                      alt={row.name}
                      className="size-full object-cover"
                      loading="lazy"
                    />
                  </span>
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

          <div className="flex items-center justify-around border-t border-border py-3 text-[10px]">
            <span className="flex flex-col items-center gap-0.5 text-primary">
              <Home className="size-4" /> Home
            </span>
            <span className="flex flex-col items-center gap-0.5 text-muted-foreground">
              <User className="size-4" /> Account
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
