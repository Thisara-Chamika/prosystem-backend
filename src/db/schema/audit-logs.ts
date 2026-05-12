import { pgTable, uuid, varchar, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { shops } from './shops';
import { users } from './users';

export const auditLogs = pgTable('audit_logs', {
  logId: uuid('log_id')
    .primaryKey()
    .defaultRandom(),

  shopId: uuid('shop_id')
    .references(() => shops.shopId, { onDelete: 'cascade' }),

  userId: uuid('user_id')
    .references(() => users.userId),

  action: varchar('action', { length: 100 })
    .notNull(),

  entityType: varchar('entity_type', { length: 50 }),

  entityId: varchar('entity_id', { length: 255 }),

  details: jsonb('details')
    .default({}),

  ipAddress: varchar('ip_address', { length: 45 }),

  createdAt: timestamp('created_at', { mode: 'date' })
    .defaultNow()
    .notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;