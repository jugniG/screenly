/**
 * Google Play Developer API — purchase verification and refunds.
 *
 * This is the Android in-app rail. Dodo stays for the web app and for refunds on
 * rules that were bought before the switch (those rows have a Dodo payment id
 * and no playPurchaseToken).
 *
 * Credentials are the service account already in .env. GOOGLE_PLAY_PRIVATE_KEY
 * is stored on one line with literal \n, so the newlines have to be restored
 * before the Google auth library will accept it.
 */

import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

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
  const { GoogleAuth } = require('google-auth-library')
  const creds = credentials()
  const auth = new GoogleAuth({
    credentials: {
      client_email: creds.client_email,
      private_key: creds.private_key,
    },
    projectId: creds.project_id || undefined,
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

export type PlayPurchase = {
  purchaseState: number
  consumptionState?: number
  purchaseTimeMillis?: string
  orderId?: string
  acknowledgementState?: number
}

type PlayOrder = {
  orderId?: string
  state?: string
  totalAmount?: { micros?: number | string; currencyCode?: string }
  lineItems?: { productId?: string; quantity?: number; itemPrice?: { micros?: number | string; currencyCode?: string } }[]
}

const PURCHASED = 1
/** 1 major currency unit = 1,000,000 micros, so 1 minor unit (paisa/cent) = 10,000. */
const MICROS_PER_MINOR = 10_000

/**
 * Confirms a token from the client is a real purchase of the given stake
 * product, then reports what Google actually charged.
 *
 * This function never trusts the client: it returns the real amount and
 * currency so the caller can compare them against its own pricing table.
 */
export async function verifyStakePurchase(
  purchaseToken: string,
  productId: string,
): Promise<{ orderId: string; paidMinor: number; currency: string }> {
  const purchase = await call<PlayPurchase>(`/purchases/products/${encodeURIComponent(productId)}`, {
    token: purchaseToken,
  })
  if (purchase.purchaseState !== PURCHASED) {
    throw new Error('Purchase has not completed')
  }
  if (!purchase.orderId) throw new Error('Google Play did not return an order id')

  const order = await call<PlayOrder>(`/purchases/orders/${encodeURIComponent(purchase.orderId)}`, {})

  const micros = Number(order.totalAmount?.micros ?? 0)
  const currency = order.totalAmount?.currencyCode ?? ''
  if (micros <= 0) {
    throw new Error('Google Play did not report an amount for this order')
  }

  return { orderId: purchase.orderId, paidMinor: Math.round(micros / MICROS_PER_MINOR), currency }
}

export type RefundStatus = 'succeeded' | 'failed'

/** Refunds a settled challenge. The stake is the user's own money coming back,
 * so this is called only when a challenge completes — never on a forfeit. */
export async function refundPlayPurchase(orderId: string): Promise<RefundStatus> {
  try {
    await call<{}>(`/purchases/orders/${encodeURIComponent(orderId)}/refund`, {}, { method: 'POST' })
    return 'succeeded'
  } catch (e) {
    console.error('[play] refund failed', orderId, (e as Error).message)
    return 'failed'
  }
}
