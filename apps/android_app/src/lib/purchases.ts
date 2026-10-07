import * as RNIap from 'react-native-iap'
import { STAKE_TIERS, type CurrencyCode } from '@screen/monetization'

/**
 * Google Play purchases, Android only.
 *
 * The stake is a real purchase of a real Play product. Play prices are fixed per
 * product, so the amount is chosen from STAKE_TIERS rather than typed in — each
 * tier id is also the Play product id.
 */

export type StakePurchase =
  | { ok: true; token: string }
  | { ok: false; message: string }

export type StakeTier = {
  id: string
  /** Price as Google formats it for this user's country, e.g. "₹100" or "$1.99". */
  displayPrice: string
  currency: string
  /** What Play charges for this tier, in minor units. */
  priceMinor: number
}

function first<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

function normalizeCurrency(value: string | undefined): CurrencyCode {
  return value === 'USD' ? 'USD' : 'INR'
}

async function withConnection<T>(fn: () => Promise<T>): Promise<T | null> {
  let connected = false
  try {
    connected = await RNIap.initConnection()
  } catch {
    return null
  }
  if (!connected) return null
  try {
    return await fn()
  } finally {
    await RNIap.endConnection()
  }
}

/**
 * Reads every stake tier from Play, priced for this user's country. Tiers that
 * are missing or inactive in Play Console are simply left out, so a half-built
 * catalogue degrades instead of showing a price that cannot be bought.
 */
export async function getStakeTiers(): Promise<StakeTier[]> {
  const skus = STAKE_TIERS.map((t) => t.id)
  const products = await withConnection(() => RNIap.fetchProducts({ skus }))
  if (!products) return []

  return products
    .map((raw) => {
      const product = first(raw as any)
      if (!product) return null
      return {
        id: product.id,
        displayPrice: product.displayPrice,
        currency: normalizeCurrency(product.currency),
        // INR and USD both use 2 decimal places, so minor units = x100.
        priceMinor: Math.round((product.price ?? 0) * 100),
      } as StakeTier
    })
    .filter((t): t is StakeTier => Boolean(t))
    .sort((a, b) => a.priceMinor - b.priceMinor)
}

/**
 * Buys one stake tier. Resolves with the purchase token the server needs to
 * verify the payment with Google. A cancelled purchase resolves with ok:false
 * rather than throwing, so the caller can simply try again.
 */
export async function purchaseStake(tierId: string): Promise<StakePurchase> {
  let connected = false
  try {
    connected = await RNIap.initConnection()
  } catch {
    return { ok: false, message: 'Google Play billing is unavailable' }
  }
  if (!connected) {
    return { ok: false, message: 'Google Play billing is unavailable on this device' }
  }

  return new Promise<StakePurchase>((resolve) => {
    let settled = false

    const finish = (result: StakePurchase) => {
      if (settled) return
      settled = true
      sub.remove()
      errSub.remove()
      void RNIap.endConnection()
      resolve(result)
    }

    const sub = RNIap.purchaseUpdatedListener((event) => {
      const purchase = first(event)
      const token = purchase?.purchaseToken
      if (token) finish({ ok: true, token })
    })
    const errSub = RNIap.purchaseErrorListener((error) => {
      finish({ ok: false, message: error.message })
    })

    // Typed explicitly: the union of Android request props trips the
    // excess-property check.
    const googleProps: RNIap.RequestPurchaseAndroidProps = { skus: [tierId] }

    RNIap.requestPurchase({ request: { google: googleProps }, type: 'in-app' })
      .then((result) => {
        const purchase = first(result)
        if (purchase?.purchaseToken) finish({ ok: true, token: purchase.purchaseToken })
      })
      .catch((e: any) => finish({ ok: false, message: e?.message ?? 'Purchase failed' }))
  })
}
