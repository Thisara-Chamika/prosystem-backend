import { pgTable, uuid, boolean, decimal, integer, timestamp } from 'drizzle-orm/pg-core';
import { shops } from './shops';

export const loyaltySettings = pgTable('loyalty_settings', {
  settingId: uuid('setting_id')
    .primaryKey()
    .defaultRandom(),

  shopId: uuid('shop_id')
    .notNull()
    .references(() => shops.shopId)
    .unique(),

  isEnabled: boolean('is_enabled')
    .default(true)
    .notNull(),

  pointsPer100: decimal('points_per_100', { precision: 5, scale: 2 })
    .default('1'),

  pointsToRedeem: integer('points_to_redeem')
    .default(100),

  redeemValue: decimal('redeem_value', { precision: 10, scale: 2 })
    .default('50'),

  silverThreshold: integer('silver_threshold')
    .default(501),

  goldThreshold: integer('gold_threshold')
    .default(2001),

  createdAt: timestamp('created_at', { mode: 'date' })
    .defaultNow()
    .notNull(),

  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .notNull(),
});

export type LoyaltySetting = typeof loyaltySettings.$inferSelect;
export type NewLoyaltySetting = typeof loyaltySettings.$inferInsert;