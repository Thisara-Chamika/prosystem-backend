import { pgTable, uuid, integer, timestamp } from 'drizzle-orm/pg-core';
import { shops } from './shops';
import { products } from './products';
import { users } from './users';
import { uniqueIndex } from 'drizzle-orm/pg-core';

export const inventory = pgTable('inventory', {
  inventoryId: uuid('inventory_id')
    .primaryKey()
    .defaultRandom(),

  shopId: uuid('shop_id')
    .notNull()
    .references(() => shops.shopId, { onDelete: 'cascade' }),

  productId: uuid('product_id')
    .notNull()
    .references(() => products.productId, { onDelete: 'cascade' }),

  quantity: integer('quantity')
    .notNull()
    .default(0),

  reserved: integer('reserved')
    .notNull()
    .default(0),

  reorderPoint: integer('reorder_point')
    .default(0),

  reorderQuantity: integer('reorder_quantity')
    .default(0),

 updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .notNull(),

  updatedBy: uuid('updated_by')
    .references(() => users.userId),

}, (table) => ({
  shopProductUnique: uniqueIndex('shop_product_unique').on(
    table.shopId,
    table.productId
  ),
}));

// TypeScript types
export type Inventory = typeof inventory.$inferSelect;
export type NewInventory = typeof inventory.$inferInsert;