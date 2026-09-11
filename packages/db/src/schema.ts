import { text, integer, boolean, timestamp, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { screenly } from './pg-schema';

export const appRules = screenly.table('app_rules', {
  id:            text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId:        text('user_id').notNull(),
  packageName:   text('package_name').notNull(),
  appName:       text('app_name').notNull(),
  ruleType:      text('rule_type', { enum: ['daily_limit', 'schedule', 'block_always'] }).notNull(),
  limitMinutes:  integer('limit_minutes'),
  period:        text('period', { enum: ['daily', 'hourly'] }).notNull().default('daily'),
  scheduleStart: text('schedule_start'),
  scheduleEnd:   text('schedule_end'),
  enabled:       boolean('enabled').notNull().default(true),
  createdAt:     timestamp('created_at').$defaultFn(() => new Date()).notNull(),
  paymentStatus: text('payment_status', { enum: ['pending', 'completed'] }).notNull().default('completed'),
  paymentId:     text('payment_id'),
  lockedAmount:  integer('locked_amount'),
});

export const usageLogs = screenly.table('usage_logs', {
  id:           text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId:       text('user_id').notNull(),
  packageName:  text('package_name').notNull(),
  appName:      text('app_name').notNull().default(''),
  date:         text('date').notNull(),
  totalMinutes: integer('total_minutes').notNull().default(0),
  updatedAt:    timestamp('updated_at').$defaultFn(() => new Date()).notNull(),
});

export const unlockEvents = screenly.table('unlock_events', {
  id:              text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId:          text('user_id').notNull(),
  packageName:     text('package_name').notNull(),
  appName:         text('app_name').notNull().default(''),
  unlockType:      text('unlock_type', { enum: ['free', 'paid'] }).notNull(),
  minutesUnlocked: integer('minutes_unlocked').notNull().default(30),
  paymentId:       text('payment_id'),
  amountPaid:      integer('amount_paid'),
  createdAt:       timestamp('created_at').$defaultFn(() => new Date()).notNull(),
});

export const friends = screenly.table('friends', {
  id:            text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  requesterId:   text('requester_id').notNull(),
  addresseeId:   text('addressee_id').notNull(),
  status:        text('status', { enum: ['pending', 'accepted', 'blocked'] }).notNull().default('pending'),
  createdAt:     timestamp('created_at').$defaultFn(() => new Date()).notNull(),
}, (t) => [
  uniqueIndex('friends_requester_addressee_unique').on(t.requesterId, t.addresseeId),
  index('friends_requester_idx').on(t.requesterId),
  index('friends_addressee_idx').on(t.addresseeId),
]);

export const leaderboardSnapshots = screenly.table('leaderboard_snapshots', {
  id:           text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId:       text('user_id').notNull(),
  date:         text('date').notNull(),
  totalMinutes: integer('total_minutes').notNull(),
  topApps:      jsonb('top_apps').$type<{ packageName: string; appName: string; minutes: number }[]>().notNull(),
  updatedAt:    timestamp('updated_at').$defaultFn(() => new Date()).notNull(),
}, (t) => [
  uniqueIndex('leaderboard_user_date_unique').on(t.userId, t.date),
  index('leaderboard_date_idx').on(t.date),
]);

export * from './auth-schema';
