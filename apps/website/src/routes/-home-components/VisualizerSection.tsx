import { Button } from "@heroui/react";

const cards = [
  {
    icon: "🚀",
    title: "Take back your time from addictive apps.",
    description: "Bet on apps so you don't overuse them. Get free time to enjoy real life. Requires Android 10+ and a minimum deposit of $10 USDC.",
  },
  {
    icon: "🧠",
    title: "You don't open Instagram. It opens you.",
    description: (
      <>
        It's 2 PM. You're "just checking" one thing. Then the algorithm feeds you a reel, then another, then a reply, then a story. <strong className="text-brand-white">20 minutes vanish</strong> and you can't even remember what you opened your phone for. Every time you give in, it gets easier to give in next time.
      </>
    ),
  },
  {
    icon: "💸",
    title: "Losing $10 hurts more than gaining $10 feels good",
    description: (
      <>
        This is called <strong className="text-brand-white">loss aversion</strong> — your brain is wired to avoid losing money 2x more than it wants to earn it. Screenly uses this against your impulses. When there's real money on the line, your brain finally pays attention.
      </>
    ),
  },
  {
    icon: "⚡",
    title: "The \"I give in\" button has a price tag",
    description: (
      <>
        When Screenly blocks an app, you can still unlock it — but it costs you your entire deposit. That $10–$100 you staked? Gone instantly. Suddenly, "just 5 minutes of scrolling" doesn't feel worth it anymore.
      </>
    ),
  },
];

export default function VisualizerSection() {
  return (
    <section id="science" className="relative mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-24">
      <div className="text-center">
        <h2 className="font-geist text-3xl font-bold tracking-tight text-brand-white sm:text-4xl">
          You picked up your phone to check one notification.<br />
          <span className="text-brand-orange">40 minutes later, you have scrolled 100s of posts.</span>
        </h2>
      </div>

      <div className="mt-12 space-y-8 text-brand-gray">
        {cards.map((card, idx) => (
          <div key={idx} className="bg-brand-card border border-brand-border rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{card.icon}</span>
              <h3 className="font-outfit font-semibold text-lg text-brand-white">{card.title}</h3>
            </div>
            <p className="text-sm leading-7">{card.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 flex justify-center">
        <a
          href="https://explorer.solana.com/address/9e9aVVCftMkbqH9aVA1bmcRB5LmHT7mBnvmAqUXxMyfb?cluster=devnet"
          target="_blank"
          rel="noreferrer"
          className="no-underline"
        >
          <Button
            variant="bordered"
            className="border-brand-border hover:border-brand-orange text-brand-white hover:text-brand-orange transition-all duration-200 rounded-xl px-5 h-11 text-sm font-semibold"
          >
            Inspect Program on Explorer
          </Button>
        </a>
      </div>
    </section>
  )
}
