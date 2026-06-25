import { pgTable, uuid, varchar, decimal, integer, boolean, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { shops } from './shops';
import { products } from './products';

export const productVariants = pgTable('product_variants', {
  variantId: uuid('variant_id')
    .primaryKey()
    .defaultRandom(),

  shopId: uuid('shop_id')
    .notNull()
    .references(() => shops.shopId, { onDelete: 'cascade' }),

  productId: uuid('product_id')
    .notNull()
    .references(() => products.productId, { onDelete: 'cascade' }),

  size: varchar('size', { length: 20 }),

  color: varchar('color', { length: 50 }),

  skuVariant: varchar('sku_variant', { length: 100 }),

  priceAdjustment: decimal('price_adjustment', { precision: 10, scale: 2 })
    .default('0'),

  quantity: integer('quantity')
    .notNull()
    .default(0),

  customAttributes: jsonb('custom_attributes')
    .default({}),

  isActive: boolean('is_active')
    .default(true)
    .notNull(),

  createdAt: timestamp('created_at', { mode: 'date' })
    .defaultNow()
    .notNull(),

  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .notNull(),
});

export type ProductVariant = typeof productVariants.$inferSelect;
export type NewProductVariant = typeof productVariants.$inferInsert;