import { Brain, Clock, Sparkles, Zap } from "lucide-react";

export function ScienceStory() {
  return (
    <section id="science" className="py-20 sm:py-28 bg-gradient-to-b from-transparent via-secondary/30 to-transparent">
      <div className="mx-auto max-w-6xl px-5">
        {/* Section Heading */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="inline-block rounded-full bg-primary/10 px-3.5 py-1 text-xs font-bold tracking-wider text-primary uppercase">
            The Science of Boredom
          </p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl leading-tight">
            You don’t pull out your phone because you need it.{" "}
            <span className="serif text-primary">You pull it out because you’re bored.</span>
          </h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base max-w-2xl mx-auto leading-relaxed">
            Elevator rides. Waiting in line. 10 seconds of downtime. We’ve trained ourselves to treat
            every quiet pause as an emergency to be medicated with feeds. But boredom is where your
            best thinking, clarity, and life changes actually happen.
          </p>
        </div>

        {/* 3 Relatable Concrete Cards */}
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {/* Card 1: The Twitch */}
          <div className="flex flex-col justify-between rounded-3xl border border-border bg-card p-6 shadow-sm transition-all hover:border-primary/40 hover:shadow-md">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-primary">01 / THE REFLEX</span>
                <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Zap className="size-4" />
                </div>
              </div>

              <h3 className="mt-4 text-xl font-bold text-foreground">The 5-second twitch</h3>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-muted-foreground">
                Waiting for an elevator? In a checkout queue? A pause in conversation? Your thumb
                reaches for your pocket before your conscious mind even realizes you were bored.
              </p>

              {/* Visual simulation of the unconscious micro-loop */}
              <div className="mt-6 rounded-2xl border border-border/80 bg-secondary/50 p-4">
                <div className="text-[11px] font-bold text-foreground flex items-center justify-between">
                  <span>Micro-Downtime Loop</span>
                  <span className="font-mono text-[10px] text-destructive font-bold">Unconscious</span>
                </div>

                <div className="mt-3 space-y-2 text-[11px]">
                  <div className="flex items-center justify-between rounded-lg bg-card px-2.5 py-1.5 border border-border/50">
                    <span className="text-muted-foreground font-mono">0:00</span>
                    <span className="font-medium text-foreground">3 seconds of silence</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-card px-2.5 py-1.5 border border-border/50">
                    <span className="text-muted-foreground font-mono">0:02</span>
                    <span className="font-medium text-destructive">Thumb unlocks screen</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-destructive/10 px-2.5 py-1.5 border border-destructive/20 text-destructive font-semibold">
                    <span className="font-mono">0:05</span>
                    <span>Doomscrolling endless feed</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-border/70 pt-3 text-[11px] font-bold text-muted-foreground">
              We traded quiet moments for 5-second dopamine hits
            </div>
          </div>

          {/* Card 2: The Stolen Genius */}
          <div className="flex flex-col justify-between rounded-3xl border border-border bg-card p-6 shadow-sm transition-all hover:border-primary/40 hover:shadow-md">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-primary">02 / WHAT YOU LOSE</span>
                <div className="grid size-9 place-items-center rounded-xl bg-amber-500/10 text-amber-600">
                  <Brain className="size-4" />
                </div>
              </div>

              <h3 className="mt-4 text-xl font-bold text-foreground">Boredom changes your life</h3>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-muted-foreground">
                When you allow your mind to be unoccupied, your brain activates the{" "}
                <span className="font-semibold text-foreground">Default Mode Network</span>. It
                consolidates memories, untangles anxiety, and sparks life-changing epiphanies.
              </p>

              {/* Visual Graphic: Brain State Comparison */}
              <div className="mt-6 rounded-2xl border border-border/80 bg-secondary/50 p-4">
                <div className="text-[11px] font-bold text-foreground flex items-center justify-between">
                  <span>Brain State Comparison</span>
                  <span className="text-[10px] font-bold text-emerald-600">Neuroscience</span>
                </div>

                <div className="mt-3 space-y-2">
                  <div className="rounded-xl bg-card p-2.5 border border-border/60">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-foreground">Phone scrolling</span>
                      <span className="text-[10px] font-bold text-destructive">0% Synthesis</span>
                    </div>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      Passive consumption, sensory overload, zero breakthroughs.
                    </p>
                  </div>

                  <div className="rounded-xl bg-emerald-500/10 p-2.5 border border-emerald-500/20">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-emerald-950">Quiet boredom</span>
                      <span className="text-[10px] font-bold text-emerald-700">100% Incubation</span>
                    </div>
                    <p className="mt-1 text-[10px] text-emerald-800">
                      Subconscious problem solving, original thoughts, creativity.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-border/70 pt-3 text-[11px] font-bold text-amber-600">
              No one ever had a life-changing epiphany on Reels
            </div>
          </div>

          {/* Card 3: The 3-Minute Breakthrough */}
          <div className="flex flex-col justify-between rounded-3xl border border-border bg-card p-6 shadow-sm transition-all hover:border-primary/40 hover:shadow-md">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-primary">03 / THE BREAKTHROUGH</span>
                <div className="grid size-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600">
                  <Clock className="size-4" />
                </div>
              </div>

              <h3 className="mt-4 text-xl font-bold text-foreground">The 3-minute hurdle</h3>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-muted-foreground">
                Craving peaks within 180 seconds, then dissolves. Screenly puts your money on the line
                to make quitting painless: endure 3 minutes of boredom, and the itch vanishes.
              </p>

              {/* Visual Graphic: Craving Curve */}
              <div className="mt-6 rounded-2xl border border-border/80 bg-secondary/50 p-4">
                <div className="flex items-center justify-between text-[11px] font-bold text-foreground">
                  <span>Dopamine Urge Curve</span>
                  <span className="font-mono text-[10px] text-primary font-bold">180s Peak</span>
                </div>

                <div className="mt-3">
                  <div className="flex justify-between text-[10px] font-semibold text-muted-foreground mb-1">
                    <span>Twitch (0m)</span>
                    <span className="text-destructive">Peak Craving</span>
                    <span className="text-emerald-600">Clarity (3m)</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-border flex">
                    <div className="h-full w-1/3 bg-destructive" />
                    <div className="h-full w-1/3 bg-amber-400" />
                    <div className="h-full w-1/3 bg-emerald-500" />
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between rounded-xl bg-card px-3 py-2 border border-border/60">
                  <span className="text-[11px] font-medium text-muted-foreground">Hard block barrier</span>
                  <span className="font-mono text-xs font-bold text-emerald-600">₹100 Protected</span>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-border/70 pt-3 text-[11px] font-bold text-emerald-600">
              Skin in the game breaks the unconscious reflex
            </div>
          </div>
        </div>

        {/* Famous Person Trust Quotes */}
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {/* Steve Jobs Quote Card */}
          <figure className="relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border bg-card p-7 shadow-sm transition-all hover:border-primary/40 hover:shadow-md">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                <Sparkles className="size-3.5" />
                <span>The creator of the iPhone on boredom</span>
              </div>

              <blockquote className="mt-4 text-base sm:text-lg font-bold text-foreground leading-snug">
                “I’m a big believer in boredom. Boredom allows one to indulge in curiosity, and out of
                curiosity comes everything. All the technology stuff is wonderful, but having nothing
                to do can be wonderful, too.”
              </blockquote>
            </div>

            <figcaption className="mt-6 flex items-center gap-3.5 border-t border-border/70 pt-4">
              <img
                src="/images/steve-jobs.jpg"
                alt="Steve Jobs"
                className="size-12 rounded-full object-cover border-2 border-primary/20 shadow-sm"
                loading="lazy"
              />
              <div>
                <div className="font-bold text-sm text-foreground">Steve Jobs</div>
                <div className="text-xs text-muted-foreground">
                  Co-founder of Apple · Created the iPhone & Mac
                </div>
              </div>
            </figcaption>
          </figure>

          {/* Naval Ravikant Quote Card */}
          <figure className="relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border bg-card p-7 shadow-sm transition-all hover:border-primary/40 hover:shadow-md">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                <Sparkles className="size-3.5" />
                <span>Naval on high-leverage thinking</span>
              </div>

              <blockquote className="mt-4 text-base sm:text-lg font-bold text-foreground leading-snug">
                “It’s only after you’re bored that you have the great ideas. It’s never going to be
                when you’re stressed, or busy, running around or rushed. Make the time.”
              </blockquote>
            </div>

            <figcaption className="mt-6 flex items-center gap-3.5 border-t border-border/70 pt-4">
              <img
                src="/images/naval.jpg"
                alt="Naval Ravikant"
                className="size-12 rounded-full object-cover border-2 border-primary/20 shadow-sm"
                loading="lazy"
              />
              <div>
                <div className="font-bold text-sm text-foreground">Naval Ravikant</div>
                <div className="text-xs text-muted-foreground">
                  Founder of AngelList · Author of The Almanack of Naval Ravikant
                </div>
              </div>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
