import { pgTable, uuid, varchar, jsonb, boolean, timestamp } from 'drizzle-orm/pg-core';
import { shops } from './shops';

export const pluginConfigurations = pgTable('plugin_configurations', {
  configId: uuid('config_id')
    .primaryKey()
    .defaultRandom(),

  shopId: uuid('shop_id')
    .notNull()
    .references(() => shops.shopId, { onDelete: 'cascade' }),

  pluginId: varchar('plugin_id', { length: 100 })
    .notNull(),

  configuration: jsonb('configuration')
    .default({}),

  isActive: boolean('is_active')
    .default(true)
    .notNull(),

  installedAt: timestamp('installed_at', { mode: 'date' })
    .defaultNow()
    .notNull(),

  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .notNull(),
});

export type PluginConfiguration = typeof pluginConfigurations.$inferSelect;
export type NewPluginConfiguration = typeof pluginConfigurations.$inferInsert;