import { pgTable, uuid, varchar, boolean, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { shops } from './shops';

// Create PostgreSQL enum for roles
export const userRoleEnum = pgEnum('user_role', [
  'super_admin',
  'shop_owner', 
  'shop_manager',
  'cashier'
]);

export const users = pgTable('users', {
  userId: uuid('user_id')
    .primaryKey()
    .defaultRandom(),

  shopId: uuid('shop_id')
    .references(() => shops.shopId, { onDelete: 'cascade' }),

  email: varchar('email', { length: 255 })
    .notNull()
    .unique(),

  passwordHash: varchar('password_hash', { length: 255 })
    .notNull(),

  role: userRoleEnum('role')
    .notNull()
    .default('cashier'),

  firstName: varchar('first_name', { length: 100 })
    .notNull(),

  lastName: varchar('last_name', { length: 100 })
    .notNull(),

  phone: varchar('phone', { length: 20 }),

  isActive: boolean('is_active')
    .default(true),

  createdAt: timestamp('created_at', { mode: 'date' })
    .defaultNow()
    .notNull(),

updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .notNull(),

lastLogin: timestamp('last_login', { mode: 'date' }),
});

// TypeScript types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;