import { pgTable, uuid, varchar, timestamp, decimal, integer } from 'drizzle-orm/pg-core';
import { shops } from './shops';
import { users } from './users';

export const customers = pgTable('customers', {
  customerId: uuid('customer_id')
    .primaryKey()
    .defaultRandom(),

  shopId: uuid('shop_id')
    .notNull()
    .references(() => shops.shopId, { onDelete: 'cascade' }),

  firstName: varchar('first_name', { length: 100 })
    .notNull(),

  lastName: varchar('last_name', { length: 100 })
    .notNull(),

  email: varchar('email', { length: 255 }),

  phone: varchar('phone', { length: 20 }),

  address: varchar('address', { length: 500 }),

  pointsBalance: integer('points_balance')
    .notNull()
    .default(0),

totalPointsEarned: integer('total_points_earned')
    .notNull()
    .default(0),

loyaltyTier: varchar('loyalty_tier', { length: 20 })
    .notNull()
    .default('bronze'),

totalSpent: decimal('total_spent', { precision: 10, scale: 2 })
    .notNull()
    .default('0'),

totalVisits: integer('total_visits')
    .notNull()
    .default(0),

lastVisit: timestamp('last_visit', { mode: 'date' }),

  createdAt: timestamp('created_at', { mode: 'date' })
    .defaultNow()
    .notNull(),

  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .notNull(),

  createdBy: uuid('created_by')
    .references(() => users.userId),

  updatedBy: uuid('updated_by')
    .references(() => users.userId),
});

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;