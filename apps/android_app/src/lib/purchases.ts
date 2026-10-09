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
  /** Google Play Billing 8.0+ offerToken for one-time purchase options */
  offerToken?: string
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
  } catch (e) {
    console.warn('[IAP] initConnection failed:', e)
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
  console.log('[IAP] fetchProducts skus:', skus, 'returned count:', products?.length)
  if (!products || products.length === 0) return []

  return products
    .map((raw) => {
      const product = first(raw as any) as any
      if (!product) return null
      const offerToken =
        product.discountOffers?.[0]?.offerTokenAndroid ??
        product.discountOffers?.[0]?.offerToken ??
        product.offerToken ??
        undefined
      return {
        id: product.id,
        displayPrice: product.displayPrice,
        currency: normalizeCurrency(product.currency),
        // INR and USD both use 2 decimal places, so minor units = x100.
        priceMinor: Math.round((product.price ?? 0) * 100),
        offerToken,
      } as StakeTier
    })
    .filter((t): t is StakeTier => Boolean(t))
    .sort((a, b) => a.priceMinor - b.priceMinor)
}

/**
 * Turns a Play billing error code into something a person can act on.
 *
 * `item-unavailable` deserves a specific message: it almost always means this
 * install is not a Play install (a sideloaded debug build cannot sell), so
 * saying "not available" without that hint sends people hunting for a product
 * that is already configured correctly.
 */
function purchaseErrorMessage(code?: string, fallback?: string): string {
  switch (code) {
    case 'item-unavailable':
      return 'This amount cannot be purchased from this build. Install Screenly from Play Store to stake money.'
    case 'user-cancelled':
      return 'Purchase cancelled'
    case 'network-error':
      return 'No connection to Google Play. Check your network and try again.'
    case 'service-unavailable':
    case 'service-disconnected':
      return 'Google Play billing is temporarily unavailable. Try again shortly.'
    case 'billing-availability-issues':
      return 'Google Play billing is not available on this device.'
    case 'item-already-owned':
      return 'You already own this stake.'
    default:
      return fallback ?? 'Purchase failed. Please try again.'
  }
}

/**
 * Buys one stake tier. Resolves with the purchase token the server needs to
 * verify the payment with Google. A cancelled purchase resolves with ok:false
 * rather than throwing, so the caller can simply try again.
 */
export async function purchaseStake(tierId: string, offerToken?: string): Promise<StakePurchase> {
  let connected = false
  try {
    connected = await RNIap.initConnection()
  } catch (e) {
    console.error('[IAP] purchaseStake initConnection error:', e)
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
      console.error('[IAP] purchaseErrorListener:', JSON.stringify(error))
      finish({ ok: false, message: purchaseErrorMessage(error.code, error.message) })
    })

    const googleProps: RNIap.RequestPurchaseAndroidProps = {
      skus: [tierId],
      ...(offerToken ? { offerToken } : {}),
    }
    console.log('[IAP] requestPurchase with googleProps:', JSON.stringify(googleProps))

    RNIap.requestPurchase({ request: { google: googleProps }, type: 'in-app' })
      .then((result) => {
        const purchase = first(result)
        if (purchase?.purchaseToken) finish({ ok: true, token: purchase.purchaseToken })
      })
      .catch((e: any) => {
        console.error('[IAP] requestPurchase catch error:', e)
        finish({ ok: false, message: purchaseErrorMessage(e?.code, e?.message) })
      })
  })
}
