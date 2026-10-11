/**
 * Google Play Developer API — purchase verification and refunds.
 *
 * This is the only payment rail. Stake amounts come from fixed tiers whose ids
 * double as Play one-time product ids, so the amount is always resolved from
 * the server's own STAKE_TIERS table and never from the client.
 *
 * Credentials are the service account already in .env. GOOGLE_PLAY_PRIVATE_KEY
 * is stored on one line with literal \n, so the newlines have to be restored
 * before the Google auth library will accept it.
 */

import { GoogleAuth } from 'google-auth-library'
import { resolveCurrency } from '@screen/monetization'

type Credentials = {
  client_email: string
  private_key: string
  private_key_id: string
  project_id: string
}

let cached: { auth: unknown; cachedAt: number } | null = null
const CACHE_MS = 50 * 60 * 1000

function credentials(): Credentials {
  const email = process.env.GOOGLE_PLAY_CLIENT_EMAIL
  const key = process.env.GOOGLE_PLAY_PRIVATE_KEY
  const keyId = process.env.GOOGLE_PLAY_PRIVATE_KEY_ID
  const projectId = process.env.GOOGLE_PLAY_PROJECT_ID
  if (!email || !key) throw new Error('Google Play service account is not configured')
  return {
    client_email: email,
    // The .env holds one line with escaped newlines; crypto needs real ones.
    private_key: key.replace(/\\n/g, '\n'),
    private_key_id: keyId ?? '',
    project_id: projectId ?? '',
  }
}

async function authClient(): Promise<any> {
  if (cached && Date.now() - cached.cachedAt < CACHE_MS) return cached.auth
  const creds = credentials()
  const auth = new GoogleAuth({
    credentials: {
      client_email: creds.client_email,
      private_key: creds.private_key,
    },
    projectId: creds.project_id || undefined,
    // Required. Without an explicit scope the JWT is requested with no audience
    // and Google rejects the token with "invalid_scope", which breaks every
    // purchase verification and refund.
    scopes: ['https://www.googleapis.com/auth/androidpublisher'],
  })
  cached = { auth, cachedAt: Date.now() }
  return auth
}

function playConfig() {
  const pkg = process.env.PLAY_ANDROID_PACKAGE
  if (!pkg) throw new Error('PLAY_ANDROID_PACKAGE is not configured')
  return { pkg }
}

async function call<T>(path: string, params: Record<string, string>, init?: RequestInit): Promise<T> {
  const client = await authClient()
  const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(
    playConfig().pkg,
  )}${path}?${new URLSearchParams(params).toString()}`
  const token = await client.getAccessToken()
  const accessToken = typeof token === 'string' ? token : token.token

  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Google Play API ${res.status}: ${body.slice(0, 300)}`)
  }
  if (res.status === 204) return {} as T
  return (await res.json()) as T
}

/**
 * ProductPurchaseV2, from purchases.productsv2.getproductpurchasev2.
 *
 * The v1 purchases.products.get route has been removed by Google — it now
 * returns a generic HTML 404, not JSON, which made the failure look like a bad
 * purchase token. v2 is keyed on the token alone and returns the state as a
 * string enum, so there is no integer constant to get wrong.
 */
type PlayPurchaseV2 = {
  purchaseStateContext?: { purchaseState?: string }
  /** 0 test, 1 promo, 2 rewarded. Only set for non-standard purchases. */
  purchaseType?: number
  orderId?: string
  productLineItem?: { productId?: string; productOfferDetails?: { offerId?: string } }
  acknowledgementState?: string
  testPurchaseContext?: unknown
  regionCode?: string
}

/**
 * Money, per the Play Developer API's shared type. Micros is the only precise
 * field — units can be absent and nanos carry the remainder, so amount is read
 * from micros alone rather than reconstructed from three fields.
 */
type PlayMoney = {
  currencyCode?: string
  units?: string | number
  nanos?: number
  micros?: number | string
}

/**
 * The Order resource. Note the total is `total`, not `totalAmount` — that name
 * does not exist on this resource, and reading it yields 0 and a confusing
 * "no amount" error.
 */
type PlayOrder = {
  orderId?: string
  purchaseToken?: string
  /** PENDING | PROCESSED | CANCELED | PENDING_REFUND | PARTIALLY_REFUNDED | REFUNDED */
  state?: string
  /** The final amount paid by the customer, including taxes. */
  total?: PlayMoney
  lineItems?: Array<{
    productId?: string
    quantity?: number
    listingPrice?: PlayMoney
    total?: PlayMoney
  }>
}

/** 1 major currency unit = 1,000,000 micros, so 1 minor unit (paisa/cent) = 10,000. */
const MICROS_PER_MINOR = 10_000

/**
 * Confirms a token from the client is a real, completed purchase, and reports
 * what Google says was charged.
 *
 * Never trusts the client: the amount and currency come from Google and are
 * compared by the caller against its own pricing table.
 *
 * `orderId` is returned but may be absent — the v2 doc notes it "may not be set
 * if there is no order associated with the purchase". The refund flow needs it,
 * so the caller must handle a missing order rather than assume one exists.
 */
export async function verifyStakePurchase(
  purchaseToken: string,
): Promise<{
  orderId: string | null
  paidMinor: number
  currency: string
  productId: string
  isTestPurchase: boolean
}> {
  const purchase = await call<PlayPurchaseV2>(
    `/purchases/productsv2/tokens/${encodeURIComponent(purchaseToken)}`,
    {},
  )

  const state = purchase.purchaseStateContext?.purchaseState
  if (state !== 'PURCHASED') {
    throw new Error(`Purchase is ${state ?? 'in an unknown state'}, not completed`)
  }

  const currency = purchase.regionCode === 'US' ? 'USD' : resolveCurrency(purchase.regionCode)
  // Play reports amounts in micros on the order, not here; a token-only lookup
  // gives no total, so the caller resolves the expected price from its own
  // table for this currency rather than trusting a client-supplied figure.
  const productId = purchase.productLineItem?.productId ?? ''

  return {
    orderId: purchase.orderId ?? null,
    paidMinor: 0,
    currency,
    productId,
    isTestPurchase: purchase.purchaseType === 0,
  }
}

/**
 * Fetches the money actually charged for an order. Called after verify, because
 * the token lookup returns no total.
 *
 * `orders` is a top-level resource — the path has no `/purchases` prefix. With
 * one, Google answers with a generic HTML 404 page rather than a JSON error,
 * which made a wrong route look identical to a missing order.
 */
export async function fetchOrderAmount(orderId: string): Promise<{ paidMinor: number; currency: string; state: string }> {
  const order = await call<PlayOrder>(`/orders/${encodeURIComponent(orderId)}`, {})
  if (order.state !== 'PROCESSED') {
    throw new Error(`Order is ${order.state ?? 'in an unknown state'}, not processed`)
  }

  const micros = Number(order.total?.micros ?? 0)
  const currency = order.total?.currencyCode ?? ''
  if (micros <= 0) {
    throw new Error('Google Play did not report an amount for this order')
  }
  return { paidMinor: Math.round(micros / MICROS_PER_MINOR), currency, state: order.state }
}

export type RefundStatus = 'succeeded' | 'failed'

/** Refunds a settled challenge. The stake is the user's own money coming back,
 * so this is called only when a challenge completes — never on a forfeit.
 *
 * Same top-level `/orders` resource as fetchOrderAmount — not `/purchases/orders`. */
export async function refundPlayPurchase(orderId: string): Promise<RefundStatus> {
  try {
    await call<{}>(`/orders/${encodeURIComponent(orderId)}/refund`, {}, { method: 'POST' })
    return 'succeeded'
  } catch (e) {
    console.error('[play] refund failed', orderId, (e as Error).message)
    return 'failed'
  }
}
