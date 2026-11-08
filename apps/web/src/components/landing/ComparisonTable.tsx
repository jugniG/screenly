import { Check, Minus, X } from "lucide-react";

const COMPARISONS = [
  {
    feature: "Real money on the line (Loss Aversion)",
    screenly: "Yes (₹50 to ₹1,000)",
    defaultTools: "None",
    blockers: "No (subscriptions)",
    willpower: "None",
  },
  {
    feature: "Zero 'Ignore for 15 mins' bypasses",
    screenly: "True (Unbreakable)",
    defaultTools: "Bypassable in 1 tap",
    blockers: "Easily toggled off",
    willpower: "Constant bargaining",
  },
  {
    feature: "Native Android Accessibility enforcer",
    screenly: "Yes (Kotlin module)",
    defaultTools: "Soft alerts",
    blockers: "Killed in Settings",
    willpower: "No friction",
  },
  {
    feature: "100% Free when you succeed",
    screenly: "Yes (Keep all money)",
    defaultTools: "Free (ineffective)",
    blockers: "$60–$100/yr lock-in",
    willpower: "Free (high relapse)",
  },
  {
    feature: "100% Open source on GitHub",
    screenly: "Yes (Audited code)",
    defaultTools: "Closed proprietary",
    blockers: "Closed proprietary",
    willpower: "N/A",
  },
  {
    feature: "Google Play verified billing & refunds",
    screenly: "Yes (Play Billing)",
    defaultTools: "N/A",
    blockers: "Recurring traps",
    willpower: "N/A",
  },
];

export function ComparisonTable() {
  return (
    <section id="compare" className="py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mx-auto max-w-2xl text-center">
          <p className="inline-block rounded-full bg-secondary px-3 py-1 text-xs font-bold tracking-wider text-muted-foreground uppercase">
            Comparison
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Screenly does what others can't.
          </h2>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Default timers send soft warnings. Screenly introduces real psychological stakes.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="mt-12 overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50 text-xs font-bold text-foreground">
                  <th scope="col" className="p-4 sm:p-5">
                    Feature
                  </th>
                  <th scope="col" className="bg-primary/10 p-4 text-primary sm:p-5 font-bold">
                    Screenly
                  </th>
                  <th scope="col" className="p-4 text-muted-foreground sm:p-5">
                    OS Screen Time
                  </th>
                  <th scope="col" className="p-4 text-muted-foreground sm:p-5">
                    Blocker Apps
                  </th>
                  <th scope="col" className="p-4 text-muted-foreground sm:p-5">
                    Willpower
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {COMPARISONS.map((row, i) => (
                  <tr
                    key={row.feature}
                    className={`transition-colors hover:bg-secondary/30 ${
                      i % 2 === 0 ? "bg-card" : "bg-background/40"
                    }`}
                  >
                    <th scope="row" className="p-4 font-bold text-foreground sm:p-5">
                      {row.feature}
                    </th>
                    <td className="bg-primary/5 p-4 font-bold text-primary sm:p-5">
                      <div className="flex items-center gap-1.5">
                        <Check className="size-4 shrink-0 text-primary" />
                        <span>{row.screenly}</span>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground sm:p-5">
                      <div className="flex items-center gap-1.5">
                        <X className="size-3.5 shrink-0 text-muted-foreground/60" />
                        <span>{row.defaultTools}</span>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground sm:p-5">
                      <div className="flex items-center gap-1.5">
                        <Minus className="size-3.5 shrink-0 text-muted-foreground/60" />
                        <span>{row.blockers}</span>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground sm:p-5">
                      <div className="flex items-center gap-1.5">
                        <X className="size-3.5 shrink-0 text-muted-foreground/60" />
                        <span>{row.willpower}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
