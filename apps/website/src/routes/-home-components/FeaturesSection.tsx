export default function FeaturesSection() {
  const features = [
    {
      title: '1. Lock any app you want to quit',
      description: 'Pick Instagram, Twitter, YouTube — whatever eats your time. Set a daily limit, block it during work hours, or lock it forever. You choose.',
      icon: (
        <svg className="w-8 h-8 text-brand-orange filter drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
          <line x1="12" y1="18" x2="12.01" y2="18" />
        </svg>
      )
    },
    {
      title: '2. Bet $10+ so you don\'t break the rule',
      description: 'Deposit a minimum of $10 USDC into escrow. When money is on the line, your brain stops negotiating with itself. You simply stay focused.',
      icon: (
        <svg className="w-8 h-8 text-brand-orange filter drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
          <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
          <line x1="6" y1="6" x2="6.01" y2="6" />
          <line x1="6" y1="18" x2="6.01" y2="18" />
        </svg>
      )
    },
    {
      title: '3. Emergency unlock costs $5 for 10 min',
      description: 'Need to check something urgently? You can unlock an app for 10 minutes by forfeiting $5 to the treasury. It\'s there for emergencies — but expensive enough that you won\'t abuse it.',
      icon: (
        <svg className="w-8 h-8 text-brand-orange filter drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5l-3-3" />
        </svg>
      )
    }
  ]

  return (
    <section id="features" className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
      <div className="absolute bottom-1/4 right-1/2 -z-10 h-96 w-96 translate-x-1/2 rounded-full bg-brand-orange/5 blur-3xl pointer-events-none" />

      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="font-outfit text-3xl font-bold tracking-tight text-brand-white sm:text-4xl lg:text-5xl">
          How it works
        </h2>
        <p className="mt-4 text-base text-brand-gray">
          Three steps. Zero willpower required.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {features.map((feature, idx) => (
          <div
            key={idx}
            className="group relative bg-brand-card border border-brand-border rounded-2xl p-8 hover:border-brand-orange transition-all duration-300 hover:shadow-[0_0_24px_rgba(249,115,22,0.1)]"
          >
            <div className="absolute inset-0 rounded-2xl border border-transparent group-hover:border-brand-orange/40 transition-colors duration-300 pointer-events-none" />

            <div className="w-12 h-12 rounded-xl bg-brand-bg border border-brand-border flex items-center justify-center mb-6 group-hover:border-brand-orange/30 transition-colors duration-300">
              {feature.icon}
            </div>

            <h3 className="font-outfit font-semibold text-lg text-brand-white group-hover:text-brand-orange transition-colors duration-300">
              {feature.title}
            </h3>

            <p className="mt-4 text-sm leading-6 text-brand-gray">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
