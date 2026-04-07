import { pgTable, uuid, varchar, decimal, integer, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { shops } from './shops';
import { users } from './users';
import { customers } from './customers';
import { products } from './products';

// Transaction status enum
export const transactionStatusEnum = pgEnum('transaction_status', [
  'pending',
  'completed',
  'cancelled',
  'refunded'
]);

// Payment method enum
export const paymentMethodEnum = pgEnum('payment_method', [
  'cash',
  'card',
  'online',
  'mixed'
]);

// Payment status enum
export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'paid',
  'failed',
  'refunded'
]);

// ── TRANSACTIONS TABLE ────────────────────────────
export const transactions = pgTable('transactions', {
  transactionId: uuid('transaction_id')
    .primaryKey()
    .defaultRandom(),

  shopId: uuid('shop_id')
    .notNull()
    .references(() => shops.shopId, { onDelete: 'cascade' }),

  transactionNumber: varchar('transaction_number', { length: 50 })
    .notNull()
    .unique(),

  customerId: uuid('customer_id')
    .references(() => customers.customerId),

  cashierId: uuid('cashier_id')
    .notNull()
    .references(() => users.userId),

  subtotal: decimal('subtotal', { precision: 10, scale: 2 })
    .notNull(),

  tax: decimal('tax', { precision: 10, scale: 2 })
    .notNull()
    .default('0'),

  discount: decimal('discount', { precision: 10, scale: 2 })
    .notNull()
    .default('0'),

  total: decimal('total', { precision: 10, scale: 2 })
    .notNull(),

  paymentMethod: paymentMethodEnum('payment_method')
    .notNull()
    .default('cash'),

  paymentStatus: paymentStatusEnum('payment_status')
    .notNull()
    .default('pending'),

  status: transactionStatusEnum('status')
    .notNull()
    .default('pending'),

  notes: varchar('notes', { length: 500 }),

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

// ── TRANSACTION ITEMS TABLE ───────────────────────
export const transactionItems = pgTable('transaction_items', {
  itemId: uuid('item_id')
    .primaryKey()
    .defaultRandom(),

  transactionId: uuid('transaction_id')
    .notNull()
    .references(() => transactions.transactionId, { onDelete: 'cascade' }),

  shopId: uuid('shop_id')
    .notNull()
    .references(() => shops.shopId, { onDelete: 'cascade' }),

  productId: uuid('product_id')
    .notNull()
    .references(() => products.productId),

  productName: varchar('product_name', { length: 255 })
    .notNull(),

  productSku: varchar('product_sku', { length: 100 })
    .notNull(),

  quantity: integer('quantity')
    .notNull(),

  unitPrice: decimal('unit_price', { precision: 10, scale: 2 })
    .notNull(),

  discount: decimal('discount', { precision: 10, scale: 2 })
    .default('0'),

  total: decimal('total', { precision: 10, scale: 2 })
    .notNull(),

  createdAt: timestamp('created_at')
    .defaultNow()
    .notNull(),
});

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type TransactionItem = typeof transactionItems.$inferSelect;
export type NewTransactionItem = typeof transactionItems.$inferInsert;