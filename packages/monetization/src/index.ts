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
 * How much of the stake is kept when a challenge ends early.
 *
 * There is only one early exit. "Unlock now" forfeits the whole stake — a
 * partial unlock was removed because it earned a fifth of what the full
 * forfeit earns on the same user, so it only discounted the better outcome.
 */
export const FORFEIT_PERCENT = {
  complete: 0,
  forceUnlock: 100,
} as const

export type Outcome = keyof typeof FORFEIT_PERCENT

/**
 * How long the user stays locked. Duration is ours, not Google's — the stake
 * amount is the product, and the clock is set from this table once Play
 * confirms payment.
 */
export const CHALLENGE_DURATIONS = {
  week: 7,
  month: 30,
  year: 365,
} as const

export type DurationId = keyof typeof CHALLENGE_DURATIONS

export const DURATION_IDS = Object.keys(CHALLENGE_DURATIONS) as DurationId[]

export const DEFAULT_DURATION_ID: DurationId = 'month'

/** Days for a duration id, or null if the id is not one we offer. */
export function durationDays(id: string): number | null {
  return id in CHALLENGE_DURATIONS
    ? CHALLENGE_DURATIONS[id as DurationId]
    : null
}

export function formatDuration(id: string): string {
  const days = durationDays(id)
  if (days === null) return ''
  if (days % 365 === 0) {
    const years = days / 365
    return `${years} year${years === 1 ? '' : 's'}`
  }
  if (days >= 30) {
    const months = Math.round(days / 30)
    return `${months} month${months === 1 ? '' : 's'}`
  }
  return `${days} day${days === 1 ? '' : 's'}`
}

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

/**
 * The no-money option. Kept out of STAKE_TIERS on purpose: tier ids are Play
 * one-time product ids and the store has no free product, so this never becomes
 * a purchase. Picking it creates a plain rule with nothing at stake.
 */
export const FREE_TIER_ID = 'free' as const

/**
 * Pre-selected amount and duration.
 *
 * The free tier is listed first for discoverability but must not be the default:
 * auto-selecting it silently made every new challenge stake nothing.
 */
export const DEFAULT_TIER_ID: StakeTierId = 'stake_100'

/** True when a tier id means "no money involved". */
export function isFreeTier(tierId: string): boolean {
  return tierId === FREE_TIER_ID
}

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

/**
 * When the challenge clock runs out. `durationId` is validated against our own
 * table, never trusted as a raw number from the client.
 */
export function challengeEndsAt(
  from: Date = new Date(),
  durationId: string = DEFAULT_DURATION_ID,
): Date {
  const days = durationDays(durationId)
  if (days === null) throw new Error(`Unknown challenge duration: ${durationId}`)
  return new Date(from.getTime() + days * 24 * 60 * 60 * 1000)
}

/**
 * Two-letter region code ("IN", "US") to currency.
 *
 * Defaults to INR when the region is unknown: India is the launch market, and
 * defaulting to USD showed a free tier as "$0" to Indian users.
 */
export function resolveCurrency(regionCode?: string | null): CurrencyCode {
  return (regionCode ?? '').toUpperCase() === 'US' ? 'USD' : 'INR'
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

/**
 * Minutes from now until 23:59:59 local.
 *
 * Unused now that an early unlock removes the block outright rather than
 * granting a window. Kept because the Kotlin enforcer's local unlock store is
 * still built around a time-limited grant.
 */
export function minutesUntilMidnight(now: Date = new Date()): number {
  const midnight = new Date(now)
  midnight.setHours(23, 59, 59, 999)
  return Math.max(1, Math.round((midnight.getTime() - now.getTime()) / 60_000))
}
