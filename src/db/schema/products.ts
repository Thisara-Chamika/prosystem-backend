import { pgTable, uuid, varchar, text, decimal, boolean, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { shops } from './shops';
import { users } from './users';

export const products = pgTable('products', {
  productId: uuid('product_id')
    .primaryKey()
    .defaultRandom(),

  shopId: uuid('shop_id')
    .notNull()
    .references(() => shops.shopId, { onDelete: 'cascade' }),

  sku: varchar('sku', { length: 100 })
    .notNull(),

  barcode: varchar('barcode', { length: 100 }),

  name: varchar('name', { length: 255 })
    .notNull(),

  description: text('description'),

  category: varchar('category', { length: 100 }),

  price: decimal('price', { precision: 10, scale: 2 })
    .notNull(),

  cost: decimal('cost', { precision: 10, scale: 2 }),

  taxRate: decimal('tax_rate', { precision: 5, scale: 2 })
    .default('0'),

  trackInventory: boolean('track_inventory')
    .default(true),

  isActive: boolean('is_active')
    .default(true),

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
},
(table) => ({
  shopSkuUnique: uniqueIndex('shop_sku_unique').on(table.shopId, table.sku),
}));

// TypeScript types
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;