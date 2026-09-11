import { z } from 'zod'
import { db } from '@screen/db'
import * as schema from '@screen/db/schema'
import { eq, and, or, inArray, sql } from 'drizzle-orm'
import { authedProcedure } from '../base'
import { ORPCError } from '@orpc/server'

const topAppSchema = z.object({
  packageName: z.string(),
  appName: z.string(),
  minutes: z.number().int().min(0),
})

export const sendInvite = authedProcedure
  .route({ method: 'POST', path: '/leaderboard/invite' })
  .input(z.object({ email: z.string().email() }))
  .handler(async ({ input, context }) => {
    const userId = context.user.id
    const email = input.email.toLowerCase().trim()

    if (email === context.user.email.toLowerCase()) {
      throw new ORPCError('BAD_REQUEST', { message: 'Cannot invite yourself' })
    }

    const [target] = await db.select().from(schema.user).where(eq(schema.user.email, email)).limit(1)
    if (!target) {
      throw new ORPCError('NOT_FOUND', { message: 'User not found. They must sign up first.' })
    }

    // check existing friend request in either direction
    const existing = await db
      .select()
      .from(schema.friends)
      .where(
        or(
          and(eq(schema.friends.requesterId, userId), eq(schema.friends.addresseeId, target.id)),
          and(eq(schema.friends.requesterId, target.id), eq(schema.friends.addresseeId, userId)),
        ),
      )
      .limit(1)

    if (existing.length > 0) {
      const s = existing[0].status
      if (s === 'accepted') throw new ORPCError('CONFLICT', { message: 'Already friends' })
      if (s === 'pending') throw new ORPCError('CONFLICT', { message: 'Invite already pending' })
      if (s === 'blocked') throw new ORPCError('FORBIDDEN', { message: 'Cannot invite this user' })
    }

    const [row] = await db
      .insert(schema.friends)
      .values({ requesterId: userId, addresseeId: target.id, status: 'pending' })
      .returning()
    return row
  })

export const acceptInvite = authedProcedure
  .route({ method: 'POST', path: '/leaderboard/accept' })
  .input(z.object({ requestId: z.string() }))
  .handler(async ({ input, context }) => {
    const [row] = await db.select().from(schema.friends).where(eq(schema.friends.id, input.requestId)).limit(1)
    if (!row) throw new ORPCError('NOT_FOUND')
    if (row.addresseeId !== context.user.id) throw new ORPCError('FORBIDDEN')
    if (row.status !== 'pending') throw new ORPCError('BAD_REQUEST', { message: 'Not pending' })

    const [updated] = await db.update(schema.friends).set({ status: 'accepted' }).where(eq(schema.friends.id, row.id)).returning()
    return updated
  })

export const declineInvite = authedProcedure
  .route({ method: 'POST', path: '/leaderboard/decline' })
  .input(z.object({ requestId: z.string() }))
  .handler(async ({ input, context }) => {
    const [row] = await db.select().from(schema.friends).where(eq(schema.friends.id, input.requestId)).limit(1)
    if (!row) throw new ORPCError('NOT_FOUND')
    if (row.addresseeId !== context.user.id) throw new ORPCError('FORBIDDEN')
    await db.delete(schema.friends).where(eq(schema.friends.id, row.id))
    return { success: true }
  })

export const removeFriend = authedProcedure
  .route({ method: 'POST', path: '/leaderboard/remove' })
  .input(z.object({ friendUserId: z.string() }))
  .handler(async ({ input, context }) => {
    const userId = context.user.id
    await db
      .delete(schema.friends)
      .where(
        or(
          and(eq(schema.friends.requesterId, userId), eq(schema.friends.addresseeId, input.friendUserId)),
          and(eq(schema.friends.requesterId, input.friendUserId), eq(schema.friends.addresseeId, userId)),
        ),
      )
    return { success: true }
  })

export const listFriends = authedProcedure
  .route({ method: 'GET', path: '/leaderboard/friends' })
  .handler(async ({ context }) => {
    const userId = context.user.id
    const rows = await db
      .select()
      .from(schema.friends)
      .where(
        and(
          or(eq(schema.friends.requesterId, userId), eq(schema.friends.addresseeId, userId)),
          eq(schema.friends.status, 'accepted'),
        ),
      )
    const friendIds = rows.map((r) => (r.requesterId === userId ? r.addresseeId : r.requesterId))
    if (friendIds.length === 0) return []
    const users = await db.select().from(schema.user).where(inArray(schema.user.id, friendIds))
    return users.map((u) => ({ id: u.id, name: u.name, email: u.email, image: u.image }))
  })

export const listInvites = authedProcedure
  .route({ method: 'GET', path: '/leaderboard/invites' })
  .handler(async ({ context }) => {
    const rows = await db
      .select()
      .from(schema.friends)
      .where(and(eq(schema.friends.addresseeId, context.user.id), eq(schema.friends.status, 'pending')))
    if (rows.length === 0) return []
    const requesterIds = rows.map((r) => r.requesterId)
    const users = await db.select().from(schema.user).where(inArray(schema.user.id, requesterIds))
    const map = new Map(users.map((u) => [u.id, u]))
    return rows.map((r) => ({
      requestId: r.id,
      createdAt: r.createdAt,
      requester: map.get(r.requesterId),
    }))
  })

export const syncSnapshot = authedProcedure
  .route({ method: 'POST', path: '/leaderboard/sync' })
  .input(
    z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      totalMinutes: z.number().int().min(0),
      topApps: z.array(topAppSchema).max(3),
    }),
  )
  .handler(async ({ input, context }) => {
    const userId = context.user.id
    const existing = await db
      .select()
      .from(schema.leaderboardSnapshots)
      .where(and(eq(schema.leaderboardSnapshots.userId, userId), eq(schema.leaderboardSnapshots.date, input.date)))
      .limit(1)

    if (existing.length > 0) {
      const [updated] = await db
        .update(schema.leaderboardSnapshots)
        .set({ totalMinutes: input.totalMinutes, topApps: input.topApps, updatedAt: new Date() })
        .where(eq(schema.leaderboardSnapshots.id, existing[0].id))
        .returning()
      return updated
    }

    const [inserted] = await db
      .insert(schema.leaderboardSnapshots)
      .values({ userId, date: input.date, totalMinutes: input.totalMinutes, topApps: input.topApps })
      .returning()
    return inserted
  })

function getDateRange(period: string, refDateStr?: string) {
  const ref = refDateStr ? new Date(refDateStr) : new Date()
  const toStr = (d: Date) => d.toISOString().split('T')[0]
  if (period === 'today') {
    const d = toStr(ref)
    return { start: d, end: d, dates: [d] }
  }
  if (period === 'yesterday') {
    const y = new Date(ref)
    y.setDate(y.getDate() - 1)
    const d = toStr(y)
    return { start: d, end: d, dates: [d] }
  }
  if (period === '7d') {
    const end = toStr(ref)
    const startD = new Date(ref)
    startD.setDate(startD.getDate() - 6)
    const start = toStr(startD)
    return { start, end, dates: [] as string[] }
  }
  if (period === '30d') {
    const end = toStr(ref)
    const startD = new Date(ref)
    startD.setDate(startD.getDate() - 29)
    const start = toStr(startD)
    return { start, end, dates: [] as string[] }
  }
  throw new ORPCError('BAD_REQUEST', { message: 'Invalid period' })
}

export const getLeaderboard = authedProcedure
  .route({ method: 'GET', path: '/leaderboard' })
  .input(z.object({ period: z.enum(['today', 'yesterday', '7d', '30d']), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional() }))
  .handler(async ({ input, context }) => {
    const userId = context.user.id
    const { start, end } = getDateRange(input.period, input.date)

    // get accepted friend ids
    const friendRows = await db
      .select()
      .from(schema.friends)
      .where(
        and(
          or(eq(schema.friends.requesterId, userId), eq(schema.friends.addresseeId, userId)),
          eq(schema.friends.status, 'accepted'),
        ),
      )
    const friendIds = friendRows.map((r) => (r.requesterId === userId ? r.addresseeId : r.requesterId))
    const allowedIds = [...new Set([userId, ...friendIds])]
    if (allowedIds.length === 0) return []

    // For single day, just read snapshots for that date
    if (input.period === 'today' || input.period === 'yesterday') {
      const snaps = await db
        .select()
        .from(schema.leaderboardSnapshots)
        .where(and(inArray(schema.leaderboardSnapshots.userId, allowedIds), eq(schema.leaderboardSnapshots.date, start)))
      const users = await db.select().from(schema.user).where(inArray(schema.user.id, allowedIds))
      const userMap = new Map(users.map((u) => [u.id, u]))
      const rows = snaps
        .map((s) => {
          const u = userMap.get(s.userId)
          return { userId: s.userId, name: u?.name ?? null, email: u?.email ?? null, image: u?.image ?? null, totalMinutes: s.totalMinutes, topApps: s.topApps as any }
        })
        .sort((a, b) => a.totalMinutes - b.totalMinutes)
      // include friends with no snapshot as 0? skip for now
      return rows.map((r, idx) => ({ ...r, rank: idx + 1 }))
    }

    // 7d / 30d: aggregate SUM across range
    const snaps = await db
      .select()
      .from(schema.leaderboardSnapshots)
      .where(and(inArray(schema.leaderboardSnapshots.userId, allowedIds), sql`${schema.leaderboardSnapshots.date} >= ${start} AND ${schema.leaderboardSnapshots.date} <= ${end}`))

    const grouped = new Map<string, { total: number; topByApp: Map<string, { appName: string; minutes: number }> }>()
    for (const s of snaps) {
      if (!grouped.has(s.userId)) grouped.set(s.userId, { total: 0, topByApp: new Map() })
      const g = grouped.get(s.userId)!
      g.total += s.totalMinutes
      for (const app of (s.topApps as any[]) ?? []) {
        const cur = g.topByApp.get(app.packageName) ?? { appName: app.appName, minutes: 0 }
        cur.minutes += app.minutes
        g.topByApp.set(app.packageName, cur)
      }
    }

    const users = await db.select().from(schema.user).where(inArray(schema.user.id, allowedIds))
    const userMap = new Map(users.map((u) => [u.id, u]))

    const rows = Array.from(grouped.entries())
      .map(([uid, g]) => {
        const u = userMap.get(uid)
        const topApps = Array.from(g.topByApp.entries())
          .map(([pkg, v]) => ({ packageName: pkg, appName: v.appName, minutes: v.minutes }))
          .sort((a, b) => b.minutes - a.minutes)
          .slice(0, 3)
        return { userId: uid, name: u?.name ?? null, email: u?.email ?? null, image: u?.image ?? null, totalMinutes: g.total, topApps }
      })
      .sort((a, b) => a.totalMinutes - b.totalMinutes)

    return rows.map((r, idx) => ({ ...r, rank: idx + 1 }))
  })
