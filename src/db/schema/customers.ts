import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';
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

  createdAt: timestamp('created_at')
    .defaultNow()
    .notNull(),

  updatedAt: timestamp('updated_at')
    .defaultNow()
    .notNull(),

  createdBy: uuid('created_by')
    .references(() => users.userId),

  updatedBy: uuid('updated_by')
    .references(() => users.userId),
});

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;