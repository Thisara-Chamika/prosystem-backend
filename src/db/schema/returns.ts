import { pgTable, uuid, varchar, decimal, integer, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { shops } from './shops';
import { users } from './users';
import { transactions } from './transactions';
import { transactionItems } from './transactions';
import { products } from './products';

// Refund method enum
export const refundMethodEnum = pgEnum('refund_method', [
  'cash',
  'card',
  'store_credit'
]);

// ── RETURNS TABLE ─────────────────────────────────
export const returns = pgTable('returns', {
  returnId: uuid('return_id')
    .primaryKey()
    .defaultRandom(),

  shopId: uuid('shop_id')
    .notNull()
    .references(() => shops.shopId, { onDelete: 'cascade' }),

  transactionId: uuid('transaction_id')
    .notNull()
    .references(() => transactions.transactionId),

  returnedBy: uuid('returned_by')
    .notNull()
    .references(() => users.userId),

  reason: varchar('reason', { length: 500 }),

  refundMethod: refundMethodEnum('refund_method')
    .notNull(),

  totalRefund: decimal('total_refund', { precision: 10, scale: 2 })
    .notNull(),

  status: varchar('status', { length: 20 })
    .default('completed'),

  createdAt: timestamp('created_at', { mode: 'date' })
    .defaultNow()
    .notNull(),

  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .notNull(),
});

// ── RETURN ITEMS TABLE ────────────────────────────
export const returnItems = pgTable('return_items', {
  returnItemId: uuid('return_item_id')
    .primaryKey()
    .defaultRandom(),

  returnId: uuid('return_id')
    .notNull()
    .references(() => returns.returnId, { onDelete: 'cascade' }),

  shopId: uuid('shop_id')
    .notNull()
    .references(() => shops.shopId, { onDelete: 'cascade' }),

  transactionItemId: uuid('transaction_item_id')
    .notNull()
    .references(() => transactionItems.itemId),

  productId: uuid('product_id')
    .notNull()
    .references(() => products.productId),

  quantity: integer('quantity')
    .notNull(),

  unitPrice: decimal('unit_price', { precision: 10, scale: 2 })
    .notNull(),

  total: decimal('total', { precision: 10, scale: 2 })
    .notNull(),

  reason: varchar('reason', { length: 500 }),

  createdAt: timestamp('created_at', { mode: 'date' })
    .defaultNow()
    .notNull(),
});

export type Return = typeof returns.$inferSelect;
export type NewReturn = typeof returns.$inferInsert;
export type ReturnItem = typeof returnItems.$inferSelect;
export type NewReturnItem = typeof returnItems.$inferInsert;