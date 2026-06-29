import { pgTable, uuid, varchar, integer, timestamp } from 'drizzle-orm/pg-core';
import { shops } from './shops';
import { customers } from './customers';
import { transactions } from './transactions';

export const loyaltyTransactions = pgTable('loyalty_transactions', {
  loyaltyTxId: uuid('loyalty_tx_id')
    .primaryKey()
    .defaultRandom(),

  shopId: uuid('shop_id')
    .notNull()
    .references(() => shops.shopId),

  customerId: uuid('customer_id')
    .notNull()
    .references(() => customers.customerId),

  transactionId: uuid('transaction_id')
    .references(() => transactions.transactionId),

  type: varchar('type', { length: 10 })
    .notNull(),

  points: integer('points')
    .notNull(),

  balanceBefore: integer('balance_before')
    .notNull(),

  balanceAfter: integer('balance_after')
    .notNull(),

  description: varchar('description', { length: 255 }),

  createdAt: timestamp('created_at', { mode: 'date' })
    .defaultNow()
    .notNull(),
});

export type LoyaltyTransaction = typeof loyaltyTransactions.$inferSelect;
export type NewLoyaltyTransaction = typeof loyaltyTransactions.$inferInsert;