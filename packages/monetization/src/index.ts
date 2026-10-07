/**
 * Single source of truth for the money rules. Imported by both the API and the
 * app so the number the user is quoted can never drift from the number the
 * server charges or forfeits.
 *
 * All amounts are integer minor units (paise / cents) — never floats.
 */

export type CurrencyCode = 'INR' | 'USD'

export const CURRENCIES = {
  INR: { code: 'INR', symbol: '₹', locale: 'en-IN', minorUnits: 100 },
  USD: { code: 'USD', symbol: '$', locale: 'en-US', minorUnits: 100 },
} as const satisfies Record<CurrencyCode, { code: CurrencyCode; symbol: string; locale: string; minorUnits: number }>

/**
 * The whole ladder. Completing the challenge costs nothing, breaking it costs
 * a slice of the stake, giving up entirely costs all of it.
 */
export const FORFEIT_PERCENT = {
  complete: 0,
  unlock: 20,
  forceUnlock: 100,
} as const

export type Outcome = keyof typeof FORFEIT_PERCENT

/** Default challenge length in days. */
export const CHALLENGE_DAYS = 3

/**
 * Stake amounts. Google Play prices are fixed per product — the app cannot ask
 * the store to charge an arbitrary amount — so the choice is a set of products
 * rather than a free-text field. The Play product ID is the tier id.
 *
 * The server resolves the expected amount from this table, never from the
 * client, so a tampered app cannot stake ₹10 on a ₹1,000 challenge.
 */
export const STAKE_TIERS = [
  { id: 'stake_50', minor: { INR: 5000, USD: 500 } },
  { id: 'stake_100', minor: { INR: 10000, USD: 1000 } },
  { id: 'stake_250', minor: { INR: 25000, USD: 2500 } },
  { id: 'stake_500', minor: { INR: 50000, USD: 5000 } },
  { id: 'stake_1000', minor: { INR: 100000, USD: 10000 } },
] as const satisfies readonly { id: string; minor: Record<CurrencyCode, number> }[]

export type StakeTierId = (typeof STAKE_TIERS)[number]['id']

export const DEFAULT_TIER_ID: StakeTierId = 'stake_100'

/** What this tier should cost in the given currency, or null if the tier is unknown. */
export function tierMinor(tierId: string, currency: CurrencyCode): number | null {
  const tier = (STAKE_TIERS as readonly { id: string; minor: Record<CurrencyCode, number> }[]).find(
    (t) => t.id === tierId,
  )
  return tier ? tier.minor[currency] : null
}

export function forfeitAmount(stakeMinor: number, outcome: Outcome): number {
  return Math.round((stakeMinor * FORFEIT_PERCENT[outcome]) / 100)
}

/** What the user gets back — the full stake when they complete. */
export function settledAmount(stakeMinor: number, outcome: Outcome): number {
  return stakeMinor - forfeitAmount(stakeMinor, outcome)
}

export function challengeEndsAt(from: Date = new Date(), days: number = CHALLENGE_DAYS): Date {
  return new Date(from.getTime() + days * 24 * 60 * 60 * 1000)
}

/** Two-letter region code ("IN", "US") to currency. Unknown regions get INR — we launch India-first. */
export function resolveCurrency(regionCode?: string | null): CurrencyCode {
  return (regionCode ?? '').toUpperCase() === 'IN' ? 'INR' : 'USD'
}

export function formatMoney(minor: number, currency: CurrencyCode = 'INR'): string {
  const c = CURRENCIES[currency]
  return new Intl.NumberFormat(c.locale, {
    style: 'currency',
    currency: c.code,
    minimumFractionDigits: 0,
    // Whole rupee/dollar amounts stay clean; anything with paise/cents shows them.
    maximumFractionDigits: minor % c.minorUnits === 0 ? 0 : 2,
  }).format(minor / c.minorUnits)
}

/** Minutes from now until 23:59:59 local — the window a temporary unlock grants. */
export function minutesUntilMidnight(now: Date = new Date()): number {
  const midnight = new Date(now)
  midnight.setHours(23, 59, 59, 999)
  return Math.max(1, Math.round((midnight.getTime() - now.getTime()) / 60_000))
}
