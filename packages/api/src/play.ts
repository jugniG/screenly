import { google, type androidpublisher_v3 } from 'googleapis'

const SCOPE = 'https://www.googleapis.com/auth/androidpublisher'

type Credentials = {
  client_email: string
  private_key: string
  private_key_id: string
  project_id: string
}

let cached: androidpublisher_v3.Androidpublisher | null = null

function credentials(): Credentials {
  const email = process.env.GOOGLE_PLAY_CLIENT_EMAIL
  const key = process.env.GOOGLE_PLAY_PRIVATE_KEY
  const keyId = process.env.GOOGLE_PLAY_PRIVATE_KEY_ID
  const projectId = process.env.GOOGLE_PLAY_PROJECT_ID
  if (!email || !key) throw new Error('Google Play service account is not configured')
  return {
    client_email: email,
    // .env holds one line with escaped newlines; crypto needs real ones.
    private_key: key.replace(/\\n/g, '\n'),
    private_key_id: keyId ?? '',
    project_id: projectId ?? '',
  }
}

/**
 * The official generated client. Using this instead of hand-built URLs means
 * endpoint paths, field names and enums come from Google's own spec - a
 * `totalAmount` that does not exist, or an `/orders` route nested wrongly under
 * `/purchases`, cannot happen.
 */
async function play(): Promise<androidpublisher_v3.Androidpublisher> {
  if (cached) return cached
  const creds = credentials()
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: creds.client_email,
      private_key: creds.private_key,
    },
    scopes: [SCOPE],
  })
  cached = google.androidpublisher({ version: 'v3', auth })
  return cached
}

function packageName(): string {
  const pkg = process.env.PLAY_ANDROID_PACKAGE
  if (!pkg) throw new Error('PLAY_ANDROID_PACKAGE is not configured')
  return pkg
}

/**
 * Converts a Money value to integer minor units (paise / cents).
 *
 * Money is `{ currencyCode, units, nanos }` - there is no `micros` field, and
 * the SDK's generated types say so. ₹50 is units="50", nanos=0.
 */
function toMinorUnits(money: { units?: string | null; nanos?: number | null } | null | undefined): number {
  if (!money) return 0
  const units = Number(money.units ?? 0)
  const nanos = money.nanos ?? 0
  // 1 major unit = 100 minor units; 1 nano = 1e-9 major = 1e-7 minor.
  return Math.round(units * 100 + nanos / 1e7)
}

export type VerifiedPurchase = {
  orderId: string
  productId: string
  isTestPurchase: boolean
}

/**
 * Confirms a token is a real, completed purchase.
 *
 * Never trusts the client: the product, order and state all come from Google,
 * and the caller compares the charged amount against its own pricing table.
 */
export async function verifyStakePurchase(purchaseToken: string): Promise<VerifiedPurchase> {
  const { data } = await (await play()).purchases.productsv2.getproductpurchasev2({
    packageName: packageName(),
    token: purchaseToken,
  })

  const state = data.purchaseStateContext?.purchaseState
  if (state !== 'PURCHASED') {
    throw new Error(`Purchase is ${state ?? 'in an unknown state'}, not completed`)
  }
  if (!data.orderId) {
    // Refunds need an order; a challenge we cannot refund must not start.
    throw new Error('Google Play did not return an order for this purchase')
  }

  return {
    orderId: data.orderId,
    productId: data.productLineItem?.[0]?.productId ?? '',
    // testPurchaseContext is only set for license-tester purchases, which Play
    // never charges for.
    isTestPurchase: Boolean(data.testPurchaseContext),
  }
}

/**
 * Fetches the money Google actually charged. This is the figure the server
 * checks against its own price table, so a tampered client cannot change it.
 */
export async function fetchOrderAmount(
  orderId: string,
): Promise<{ paidMinor: number; currency: string }> {
  const { data } = await (await play()).orders.get({
    packageName: packageName(),
    orderId,
  })

  const state = data.state
  if (state !== 'PROCESSED') {
    throw new Error(`Order is ${state ?? 'in an unknown state'}, not processed`)
  }

  const paidMinor = toMinorUnits(data.total)
  const currency = data.total?.currencyCode ?? ''
  if (paidMinor <= 0) {
    throw new Error('Google Play did not report an amount for this order')
  }

  return { paidMinor, currency }
}

/**
 * Reports a verified purchase to Play as delivered: consuming it (or, when the
 * product is non-consumable, acknowledging it) is what Google looks at when it
 * decides to auto-refund. Without this call Play reverses unreported purchases
 * on its own - after 3 days for real buyers, after 3 minutes for license
 * testers - handing the user their stake back while the challenge still runs.
 * Consumption also frees the product so the same tier can be staked again.
 *
 * Failures are logged, never thrown: the challenge is already active at this
 * point, and a settlement hiccup must not read as a failed payment.
 */
export async function acknowledgePlayPurchase(purchaseToken: string): Promise<void> {
  try {
    await (await play()).purchases.products.consume({
      packageName: packageName(),
      token: purchaseToken,
    })
  } catch (e) {
    // Non-consumable products reject consumption; acknowledging still stops
    // the auto-refund clock.
    try {
      await (await play()).purchases.products.acknowledge({
        packageName: packageName(),
        token: purchaseToken,
      })
    } catch (ackError) {
      console.error('[play] acknowledge failed', (ackError as Error).message)
    }
  }
}

export type RefundStatus = 'succeeded' | 'failed'

/**
 * Refunds a settled challenge. The stake is the user's own money coming back,
 * so this runs only when a challenge completes - never on a forfeit.
 */
export async function refundPlayPurchase(orderId: string): Promise<RefundStatus> {
  try {
    await (await play()).orders.refund({ packageName: packageName(), orderId })
    return 'succeeded'
  } catch (e) {
    console.error('[play] refund failed', orderId, (e as Error).message)
    return 'failed'
  }
}