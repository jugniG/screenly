import { z } from 'zod'
import { db } from '@screen/db'
import * as schema from '@screen/db/schema'
import { eq, desc } from 'drizzle-orm'
import { authedProcedure } from '../base'

/**
 * Unlock history only. Unlocking no longer involves a payment — a temporary
 * unlock is a slice of the stake, settled by unlockChallenge — so the old
 * paid-unlock checkout routes are gone with Dodo.
 */

export const unlockHistory = authedProcedure
  .route({ method: 'GET', path: '/unlock/history' })
  .input(z.object({}))
  .handler(async ({ context }) => {
    return db
      .select()
      .from(schema.unlockEvents)
      .where(eq(schema.unlockEvents.userId, context.user.id))
      .orderBy(desc(schema.unlockEvents.createdAt))
      .limit(50)
  })
