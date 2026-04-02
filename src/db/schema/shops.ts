import { pgTable, uuid, varchar, boolean, jsonb, timestamp } from 'drizzle-orm/pg-core';

export const shops = pgTable('shops', {
  shopId: uuid('shop_id')
    .primaryKey()
    .defaultRandom(),

  name: varchar('name', { length: 255 })
    .notNull(),

  slug: varchar('slug', { length: 255 })
    .notNull()
    .unique(),

  currency: varchar('currency', { length: 3 })
    .default('USD'),

  timezone: varchar('timezone', { length: 50 })
    .default('UTC'),

  activePlugins: jsonb('active_plugins')
    .default([]),

  configuration: jsonb('configuration')
    .default({}),

  isActive: boolean('is_active')
    .default(true),

  createdAt: timestamp('created_at')
    .defaultNow()
    .notNull(),

  updatedAt: timestamp('updated_at')
    .defaultNow()
    .notNull(),
});

// TypeScript type for Shop
export type Shop = typeof shops.$inferSelect;
export type NewShop = typeof shops.$inferInsert;