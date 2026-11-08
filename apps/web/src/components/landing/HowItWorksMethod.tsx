import { ShieldCheck } from "lucide-react";
import { Phone } from "../DemoScreens";

export function HowItWorksMethod() {
  return (
    <section id="how-it-works" className="relative border-y border-border bg-background py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="inline-block rounded-full bg-primary/10 px-3.5 py-1 text-xs font-bold tracking-wider text-primary uppercase">
            The 5-Step Screenly Method
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
            How the Screenly method works.
          </h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            From discovering where your hours go to setting allowances, staking real skin in the game, hard enforcer blocks, and staying accountable with friends.
          </p>
        </div>

        {/* Quippy-Style Vertical Timeline Track */}
        <div className="relative mt-20">
          {/* Continuous Center Vertical Line (visible on lg+) */}
          <div className="hidden lg:block absolute left-1/2 top-10 bottom-10 w-0.5 -translate-x-1/2 bg-slate-200" />

          <div className="space-y-24 lg:space-y-32">
            {/* ================= STEP 1: See Your Screen Time ================= */}
            <div className="relative grid gap-8 lg:grid-cols-2 lg:items-center">
              {/* Center Timeline Node (1) */}
              <div className="hidden lg:grid absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 size-11 place-items-center rounded-full border-2 border-primary bg-white text-base font-bold text-primary shadow-md">
                1
              </div>

              {/* Left Side: Mockup Screen with Soft Blue Panel & Phone Inside */}
              <div className="flex justify-center lg:justify-end lg:pr-8">
                <article className="product-panel panel-0 w-full max-w-[360px] shadow-sm">
                  <div className="product-title">
                    <span className="step-tag">01</span>
                    <h2>See your screen time.</h2>
                    <p>See your day. Choose what deserves it.</p>
                  </div>
                  <Phone type={0} />
                </article>
              </div>

              {/* Right Side: Step Copy */}
              <div className="lg:pl-8 text-center lg:text-left">
                <span className="lg:hidden inline-block mb-3 size-9 leading-9 rounded-full bg-primary text-white font-bold text-sm">
                  1
                </span>
                <span className="font-mono text-xs font-bold text-primary block uppercase tracking-wider mb-1">
                  01 / Screen Time
                </span>
                <h3 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
                  See your screen time.
                </h3>
                <p className="mt-3 text-base text-muted-foreground leading-relaxed max-w-lg mx-auto lg:mx-0">
                  Understand exactly where your hours go with transparent daily breakdowns. Tap
                  through any day of the week to inspect app usage and catch doomscrolling habits
                  before they steal your evening.
                </p>
                <div className="mt-6 flex flex-wrap gap-2 justify-center lg:justify-start">
                  <span className="rounded-full bg-secondary px-3.5 py-1 text-xs font-bold text-foreground">
                    Interactive daily trends
                  </span>
                  <span className="rounded-full bg-secondary px-3.5 py-1 text-xs font-bold text-foreground">
                    App usage breakdown
                  </span>
                  <span className="rounded-full bg-secondary px-3.5 py-1 text-xs font-bold text-foreground">
                    Zero spyware or tracking
                  </span>
                </div>
              </div>
            </div>

            {/* ================= STEP 2: Add Limits to Most Distracting Apps ================= */}
            <div className="relative grid gap-8 lg:grid-cols-2 lg:items-center">
              {/* Center Timeline Node (2) */}
              <div className="hidden lg:grid absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 size-11 place-items-center rounded-full border-2 border-primary bg-white text-base font-bold text-primary shadow-md">
                2
              </div>

              {/* Left Side: Step Copy (Alternating) */}
              <div className="order-2 lg:order-1 lg:pr-8 text-center lg:text-left">
                <span className="lg:hidden inline-block mb-3 size-9 leading-9 rounded-full bg-primary text-white font-bold text-sm">
                  2
                </span>
                <span className="font-mono text-xs font-bold text-primary block uppercase tracking-wider mb-1">
                  02 / App Limits
                </span>
                <h3 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
                  Add limits to most distracting apps.
                </h3>
                <p className="mt-3 text-base text-muted-foreground leading-relaxed max-w-lg mx-auto lg:mx-0">
                  App limits that leave space for your real plans. Set precise allowances for the apps
                  that pull you in (like YouTube, Instagram, X, or games). Configure custom daily limits
                  or hourly schedule windows that sync instantly to the native enforcer.
                </p>
                <div className="mt-6 flex flex-wrap gap-2 justify-center lg:justify-start">
                  <span className="rounded-full bg-secondary px-3.5 py-1 text-xs font-bold text-foreground">
                    Custom app allowances
                  </span>
                  <span className="rounded-full bg-secondary px-3.5 py-1 text-xs font-bold text-foreground">
                    Daily & hourly limits
                  </span>
                  <span className="rounded-full bg-secondary px-3.5 py-1 text-xs font-bold text-foreground">
                    Instant enforcer sync
                  </span>
                </div>
              </div>

              {/* Right Side: Mockup Screen with Soft Blue Panel & Phone Inside */}
              <div className="order-1 lg:order-2 flex justify-center lg:justify-start lg:pl-8">
                <article className="product-panel panel-1 w-full max-w-[360px] shadow-sm">
                  <div className="product-title">
                    <span className="step-tag">02</span>
                    <h2>Add limits to distracting apps.</h2>
                    <p>Set clear allowances that leave space for your plans.</p>
                  </div>
                  <Phone type={1} />
                </article>
              </div>
            </div>

            {/* ================= STEP 3: Decide How Much You Can Stake ================= */}
            <div className="relative grid gap-8 lg:grid-cols-2 lg:items-center">
              {/* Center Timeline Node (3) */}
              <div className="hidden lg:grid absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 size-11 place-items-center rounded-full border-2 border-primary bg-white text-base font-bold text-primary shadow-md">
                3
              </div>

              {/* Left Side: Mockup Screen with Soft Blue Panel & Phone Inside */}
              <div className="flex justify-center lg:justify-end lg:pr-8">
                <article className="product-panel panel-2 w-full max-w-[360px] shadow-sm">
                  <div className="product-title">
                    <span className="step-tag">03</span>
                    <h2>Decide what to stake.</h2>
                    <p>Choose ₹0 free or put real skin in the game.</p>
                  </div>
                  <Phone type={2} />
                </article>
              </div>

              {/* Right Side: Step Copy */}
              <div className="lg:pl-8 text-center lg:text-left">
                <span className="lg:hidden inline-block mb-3 size-9 leading-9 rounded-full bg-primary text-white font-bold text-sm">
                  3
                </span>
                <span className="font-mono text-xs font-bold text-primary block uppercase tracking-wider mb-1">
                  03 / Stake Decision
                </span>
                <h3 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
                  Decide how much you can stake.
                </h3>
                <p className="mt-3 text-base text-muted-foreground leading-relaxed max-w-lg mx-auto lg:mx-0">
                  Willpower is finite, but incentives work. Start completely free with the ₹0 option,
                  or choose a stake tier (₹50, ₹100, ₹250, ₹500, or ₹1,000) backed by Google Play
                  Billing. Pick your challenge duration (1 week, 1 month, or 1 year) — stay under
                  your limits and get 100% of your deposit returned.
                </p>
                <div className="mt-6 flex flex-wrap gap-2 justify-center lg:justify-start">
                  <span className="rounded-full bg-secondary px-3.5 py-1 text-xs font-bold text-foreground">
                    ₹0 free option included
                  </span>
                  <span className="rounded-full bg-secondary px-3.5 py-1 text-xs font-bold text-foreground">
                    ₹50 to ₹1,000 stake tiers
                  </span>
                  <span className="rounded-full bg-secondary px-3.5 py-1 text-xs font-bold text-foreground">
                    100% returned on win
                  </span>
                </div>
              </div>
            </div>

            {/* ================= STEP 4: Get Blocked When You Try to Overuse ================= */}
            <div className="relative grid gap-8 lg:grid-cols-2 lg:items-center">
              {/* Center Timeline Node (4) */}
              <div className="hidden lg:grid absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 size-11 place-items-center rounded-full border-2 border-primary bg-white text-base font-bold text-primary shadow-md">
                4
              </div>

              {/* Left Side: Step Copy (Alternating) */}
              <div className="order-2 lg:order-1 lg:pr-8 text-center lg:text-left">
                <span className="lg:hidden inline-block mb-3 size-9 leading-9 rounded-full bg-primary text-white font-bold text-sm">
                  4
                </span>
                <span className="font-mono text-xs font-bold text-primary block uppercase tracking-wider mb-1">
                  04 / The Hard Barrier
                </span>
                <h3 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
                  Get blocked when you try to overuse those apps.
                </h3>
                <p className="mt-3 text-base text-muted-foreground leading-relaxed max-w-lg mx-auto lg:mx-0">
                  When you hit your limit, our native Android Accessibility Enforcer stops you cold.
                  No snooze buttons. No easy passcodes. <strong>The only way to unlock early is by
                  forfeiting your money on the spot.</strong> And don't try to cheat the system: Screenly
                  actively detects if you attempt to force-stop or uninstall the app, immediately
                  triggering a full forfeit to protect your commitment.
                </p>
                <div className="mt-6 flex flex-wrap gap-2 justify-center lg:justify-start">
                  <span className="rounded-full bg-secondary px-3.5 py-1 text-xs font-bold text-foreground">
                    Unlock only by losing money
                  </span>
                  <span className="rounded-full bg-secondary px-3.5 py-1 text-xs font-bold text-foreground">
                    Anti-uninstall detection
                  </span>
                  <span className="rounded-full bg-secondary px-3.5 py-1 text-xs font-bold text-foreground">
                    Zero soft bypasses
                  </span>
                </div>
              </div>

              {/* Right Side: Mockup Screen with Soft Blue Panel & Phone Inside */}
              <div className="order-1 lg:order-2 flex justify-center lg:justify-start lg:pl-8">
                <article className="product-panel panel-3 w-full max-w-[360px] shadow-sm">
                  <div className="product-title">
                    <span className="step-tag">04</span>
                    <h2>Get blocked on overuse.</h2>
                    <p>Unlock only by losing money or anti-uninstall detection.</p>
                  </div>
                  <Phone type={3} />
                </article>
              </div>
            </div>

            {/* ================= STEP 5: Share Screen Time with Friends & Relatives ================= */}
            <div className="relative grid gap-8 lg:grid-cols-2 lg:items-center">
              {/* Center Timeline Node (5) */}
              <div className="hidden lg:grid absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 size-11 place-items-center rounded-full border-2 border-primary bg-white text-base font-bold text-primary shadow-md">
                5
              </div>

              {/* Left Side: Mockup Screen with Soft Blue Panel & Phone Inside */}
              <div className="flex justify-center lg:justify-end lg:pr-8">
                <article className="product-panel panel-4 w-full max-w-[360px] shadow-sm">
                  <div className="product-title">
                    <span className="step-tag">05</span>
                    <h2>Share with friends & relatives.</h2>
                    <p>Keep yourself accountable with social circles.</p>
                  </div>
                  <Phone type={4} />
                </article>
              </div>

              {/* Right Side: Step Copy */}
              <div className="lg:pl-8 text-center lg:text-left">
                <span className="lg:hidden inline-block mb-3 size-9 leading-9 rounded-full bg-primary text-white font-bold text-sm">
                  5
                </span>
                <span className="font-mono text-xs font-bold text-primary block uppercase tracking-wider mb-1">
                  05 / Social Accountability
                </span>
                <h3 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
                  Share screen time with friends and relatives.
                </h3>
                <p className="mt-3 text-base text-muted-foreground leading-relaxed max-w-lg mx-auto lg:mx-0">
                  Accountability is ten times stronger when you're not in it alone. Share your daily
                  screen time with friends, roommates, and relatives to keep yourself honest.
                  Compete to see who can reclaim the most time — the lowest screen time takes the pot
                  on Sunday.
                </p>
                <div className="mt-6 flex flex-wrap gap-2 justify-center lg:justify-start">
                  <span className="rounded-full bg-secondary px-3.5 py-1 text-xs font-bold text-foreground">
                    Friends & relatives circles
                  </span>
                  <span className="rounded-full bg-secondary px-3.5 py-1 text-xs font-bold text-foreground">
                    Mutual accountability
                  </span>
                  <span className="rounded-full bg-secondary px-3.5 py-1 text-xs font-bold text-foreground">
                    Weekly group pots
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Guarantee Banner */}
        <div className="mt-20 flex flex-col items-center justify-between gap-4 rounded-3xl border border-border bg-card p-6 text-center shadow-sm sm:flex-row sm:text-left">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
              <ShieldCheck className="size-5" />
            </div>
            <p className="text-xs sm:text-sm font-bold text-foreground">
              Your time, your limits, your people. All in one place.
            </p>
          </div>
          <span className="text-[11px] font-semibold text-muted-foreground">
            Interactive preview · Click any day on the chart above
          </span>
        </div>
      </div>
    </section>
  );
}
