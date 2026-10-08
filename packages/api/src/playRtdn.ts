/**
 * Google Play Real-time Developer Notifications (RTDN).
 *
 * Google does not POST refund events straight to us — it publishes them to a
 * Pub/Sub topic, and a push subscription on that topic delivers them to this
 * app's webhook. This module owns the part that matters: turning a Google
 * notification into a change in our own state.
 *
 * Why we care: a user can self-refund on Play within 48 hours of buying. That
 * bypasses our tap-to-claim flow entirely, so without these events a refunded
 * stake stays "active" in our database and the user keeps both the money and
 * the block. By the time a notification arrives the money is already gone —
 * this is detection, not prevention.
 */

import { createRequire } from 'node:module'
import { db } from '@screen/db'
import * as schema from '@screen/db/schema'
import { eq } from 'drizzle-orm'

const require = createRequire(import.meta.url)

/** RTDN notifications that mean the user is no longer paying. */
const REFUND_NOTIFICATIONS = new Set([
  'ONE_TIME_PRODUCT_CANCELED',
  'ONE_TIME_PRODUCT_REFUNDED',
])

const PURCHASE_NOTIFICATIONS = new Set(['ONE_TIME_PRODUCT_PURCHASED'])

export type RtdnMessage = {
  /** Present when the topic is linked to an app; absent for account-level topics. */
  packageName?: string
  eventTimeMillis?: string
  notificationType?: string
  purchaseToken?: string
  sku?: string
}

/** Pub/Sub wraps the RTDN payload unless payload unwrapping is enabled. */
export type PubSubEnvelope = {
  message?: {
    data?: string
    messageId?: string
    publishTime?: string
  }
  subscription?: string
}

/** Digests the two message shapes Pub/Sub can deliver. */
export function parseRtdnMessage(raw: unknown): RtdnMessage | null {
  let payload: unknown = raw

  const envelope = raw as PubSubEnvelope | null
  if (envelope?.message?.data) {
    try {
      payload = JSON.parse(Buffer.from(envelope.message.data, 'base64').toString('utf8'))
    } catch {
      return null
    }
  }

  const message = payload as RtdnMessage | null
  if (!message || typeof message !== 'object' || !message.notificationType) return null
  return message
}

export type RtdnOutcome =
  | { action: 'ignored'; reason: string }
  | { action: 'no-rule'; purchaseToken: string }
  | { action: 'recorded'; purchaseToken: string; stakeStatus: string; enabled: boolean }

/**
 * Applies one notification to our rules table.
 *
 * Matching is on purchaseToken because that is what RTDN carries. The stake is
 * then settled as forfeited and the rule disabled, which is what releases the
 * block — a user who self-refunded must not stay locked for a challenge they
 * are no longer paying for.
 */
export async function applyRtdnMessage(message: RtdnMessage): Promise<RtdnOutcome> {
  const type = message.notificationType ?? ''
  const token = message.purchaseToken

  const isRefund = REFUND_NOTIFICATIONS.has(type)
  const isPurchase = PURCHASE_NOTIFICATIONS.has(type)
  if (!isRefund && !isPurchase) {
    return { action: 'ignored', reason: `unhandled notification ${type || '(none)'}` }
  }
  if (!token) return { action: 'ignored', reason: 'notification carried no purchase token' }

  const [rule] = await db
    .select()
    .from(schema.appRules)
    .where(eq(schema.appRules.playPurchaseToken, token))
    .limit(1)

  if (!rule) return { action: 'no-rule', purchaseToken: token }

  // A purchase notification only confirms what confirmStakePurchase already
  // verified against Google directly, so there is nothing to change.
  if (isPurchase) {
    return { action: 'recorded', purchaseToken: token, stakeStatus: rule.stakeStatus, enabled: rule.enabled }
  }

  // Already settled or already forfeited — a refund can be reported more than
  // once, and re-applying it would be harmless but noisy.
  if (rule.stakeStatus !== 'active') {
    return { action: 'recorded', purchaseToken: token, stakeStatus: rule.stakeStatus, enabled: rule.enabled }
  }

  const stake = rule.lockedAmount ?? 0
  await db
    .update(schema.appRules)
    .set({
      // enabled=false is what stops the enforcer blocking the app.
      enabled: false,
      stakeStatus: 'forfeited',
      forfeitedAmount: stake,
    })
    .where(eq(schema.appRules.id, rule.id))

  return { action: 'recorded', purchaseToken: token, stakeStatus: 'forfeited', enabled: false }
}

/**
 * Verifies the OIDC token Pub/Sub attaches when authentication is enabled on
 * the push subscription. The audience must be this exact endpoint, otherwise a
 * token minted for some other push subscription would be accepted here.
 */
export async function verifyPubsubToken(
  authorizationHeader: string | null,
  audience: string,
): Promise<boolean> {
  if (!authorizationHeader?.startsWith('Bearer ')) return false
  const idToken = authorizationHeader.slice('Bearer '.length).trim()
  if (!idToken) return false

  try {
    const { OAuth2Client } = require('google-auth-library')
    const client = new OAuth2Client()
    const ticket = await client.verifyIdToken({ idToken, audience })
    return Boolean(ticket)
  } catch (e) {
    console.error('[rtdn] token verification failed', (e as Error).message)
    return false
  }
}