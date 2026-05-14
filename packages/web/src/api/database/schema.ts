import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export * from './auth-schema';

// App rules — one per restricted app per user
export const appRules = sqliteTable('app_rules', {
  id:            text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId:        text('user_id').notNull(),
  packageName:   text('package_name').notNull(),
  appName:       text('app_name').notNull(),
  ruleType:      text('rule_type', { enum: ['daily_limit', 'schedule', 'block_always'] }).notNull(),
  limitMinutes:  integer('limit_minutes'),
  scheduleStart: text('schedule_start'),
  scheduleEnd:   text('schedule_end'),
  enabled:       integer('enabled', { mode: 'boolean' }).notNull().default(true),
  createdAt:     integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

// Daily usage logs — synced from device
export const usageLogs = sqliteTable('usage_logs', {
  id:           text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId:       text('user_id').notNull(),
  packageName:  text('package_name').notNull(),
  appName:      text('app_name').notNull().default(''),
  date:         text('date').notNull(), // YYYY-MM-DD
  totalMinutes: integer('total_minutes').notNull().default(0),
  updatedAt:    integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

// Unlock events — free countdowns and paid unlocks
export const unlockEvents = sqliteTable('unlock_events', {
  id:             text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId:         text('user_id').notNull(),
  packageName:    text('package_name').notNull(),
  appName:        text('app_name').notNull().default(''),
  unlockType:     text('unlock_type', { enum: ['free', 'paid'] }).notNull(),
  minutesUnlocked: integer('minutes_unlocked').notNull().default(30),
  paymentId:      text('payment_id'),
  amountPaid:     integer('amount_paid'), // cents
  createdAt:      integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});
