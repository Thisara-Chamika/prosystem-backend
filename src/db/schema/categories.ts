import { pgTable, uuid, varchar, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core';
import { shops } from './shops';

export const categories = pgTable('categories', {
  categoryId: uuid('category_id')
    .primaryKey()
    .defaultRandom(),

  shopId: uuid('shop_id')
    .notNull()
    .references(() => shops.shopId, { onDelete: 'cascade' }),

  name: varchar('name', { length: 100 })
    .notNull(),

  description: text('description'),

  sortOrder: integer('sort_order')
    .default(0),

  isActive: boolean('is_active')
    .default(true),

  createdAt: timestamp('created_at', { mode: 'date' })
    .defaultNow()
    .notNull(),

  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .notNull(),
});

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;