import { useState } from 'react'

export default function CalculatorSection() {
  const [hours, setHours] = useState<number>(3)
  const [rate, setRate] = useState<number>(35)
  const [stake, setStake] = useState<number>(20)

  const lostProductivity = hours * rate * 365
  const focusGain = (lostProductivity * 0.4).toFixed(0) // assumes 40% focus gain

  return (
    <section id="calculator" className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
      {/* Visual background separation */}
      <div className="absolute top-1/2 right-1/4 -z-10 h-72 w-72 rounded-full bg-brand-orange/5 blur-3xl pointer-events-none" />

      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="font-outfit text-3xl font-bold tracking-tight text-brand-white sm:text-4xl lg:text-5xl">
          The True Cost of Distraction
        </h2>
        <p className="mt-4 text-base text-brand-gray">
          Scrolling doesn't just cost you time—it drains your financial potential. 
          Put stakes on your focus and calculate what you save by breaking the loop.
        </p>
      </div>

      {/* Main Calculator Slate Box */}
      <div className="mx-auto max-w-4xl bg-brand-card border border-brand-border rounded-3xl p-6 sm:p-10 shadow-sm border-brand-border">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          
          {/* Sliders (Left Column, 7 Cols) */}
          <div className="md:col-span-7 space-y-8">
            {/* Slider 1: Hours */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-semibold text-brand-white">Daily Scroll Time</span>
                <span className="font-outfit font-bold text-brand-orange text-lg">{hours} Hours</span>
              </div>
              <input
                type="range"
                min="1"
                max="6"
                step="0.5"
                value={hours}
                onChange={(e) => setHours(parseFloat(e.target.value))}
                className="w-full h-2 rounded-lg bg-brand-bg appearance-none cursor-pointer accent-brand-orange border border-brand-border"
              />
              <div className="flex justify-between text-xxs text-brand-gray mt-1">
                <span>1h</span>
                <span>3h</span>
                <span>6h</span>
              </div>
            </div>

            {/* Slider 2: Rate */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-semibold text-brand-white">Your Hourly Value</span>
                <span className="font-outfit font-bold text-brand-orange text-lg">${rate}/hr</span>
              </div>
              <input
                type="range"
                min="15"
                max="150"
                step="5"
                value={rate}
                onChange={(e) => setRate(parseInt(e.target.value))}
                className="w-full h-2 rounded-lg bg-brand-bg appearance-none cursor-pointer accent-brand-orange border border-brand-border"
              />
              <div className="flex justify-between text-xxs text-brand-gray mt-1">
                <span>$15/hr</span>
                <span>$80/hr</span>
                <span>$150/hr</span>
              </div>
            </div>

            {/* Slider 3: Stake */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-semibold text-brand-white">Discipline Bet</span>
                <span className="font-outfit font-bold text-brand-orange text-lg">${stake} USDC</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={stake}
                onChange={(e) => setStake(parseInt(e.target.value))}
                className="w-full h-2 rounded-lg bg-brand-bg appearance-none cursor-pointer accent-brand-orange border border-brand-border"
              />
              <div className="flex justify-between text-xxs text-brand-gray mt-1">
                <span>$10 min</span>
                <span>$50</span>
                <span>$100 max</span>
              </div>
            </div>
          </div>

          {/* Output Display (Right Column, 5 Cols) */}
          <div className="md:col-span-5 bg-brand-bg border border-brand-border rounded-2xl p-6 flex flex-col justify-between h-full space-y-6">
            <div>
              <span className="text-xxs font-bold text-brand-gray tracking-widest uppercase">
                Annual Cost of Scroll
              </span>
              <div className="font-outfit font-extrabold text-3xl sm:text-4xl text-brand-white mt-1">
                ${lostProductivity.toLocaleString()}
              </div>
              <p className="text-xs text-brand-gray mt-2 leading-relaxed">
                This is the raw dollar value of the time spent scrolling social apps instead of focusing.
              </p>
            </div>

            <div className="border-t border-brand-border/60 pt-4">
              <span className="text-xxs font-bold text-brand-gray tracking-widest uppercase">
                Potential Recovered Value
              </span>
              <div className="font-outfit font-extrabold text-2xl sm:text-3xl text-brand-orange mt-1">
                ${Number(focusGain).toLocaleString()}
              </div>
              <p className="text-xs text-brand-gray mt-2 leading-relaxed">
                Reclaiming just 40% of this wasted time boosts your output by this much.
              </p>
            </div>

            <div className="border-t border-brand-border/60 pt-4 text-center">
              <span className="text-xs text-brand-white font-medium">
                Bet <span className="text-brand-orange">${stake} USDC</span> to save <span className="text-brand-orange">${Number(focusGain).toLocaleString()}</span>
              </span>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
