import {
  pgTable,
  uuid,
  varchar,
  integer,
  decimal,
  text,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";
import { shops } from "./shops";
import { users } from "./users";
import { customers } from "./customers";
import { products } from "./products";
import { transactions } from './transactions';

export const restaurantTables = pgTable("restaurant_tables", {
  tableId: uuid("table_id").primaryKey().defaultRandom(),
  shopId: uuid("shop_id")
    .notNull()
    .references(() => shops.shopId, { onDelete: "cascade" }),
  tableNumber: integer("table_number").notNull(),
  capacity: integer("capacity").default(4),
  status: varchar("status", { length: 20 }).default("available").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const restaurantOrders = pgTable("restaurant_orders", {
  orderId: uuid("order_id").primaryKey().defaultRandom(),
  shopId: uuid("shop_id")
    .notNull()
    .references(() => shops.shopId, { onDelete: "cascade" }),
  tableId: uuid("table_id")
    .notNull()
    .references(() => restaurantTables.tableId, { onDelete: "cascade" }),
  status: varchar("status", { length: 20 }).default("open").notNull(),
  serverId: uuid("server_id")
    .notNull()
    .references(() => users.userId),
  customerId: uuid("customer_id").references(() => customers.customerId),
  notes: text("notes"),
  openedAt: timestamp("opened_at", { mode: "date" }).defaultNow().notNull(),
  transactionId: uuid('transaction_id').references(() => transactions.transactionId),
  closedAt: timestamp("closed_at", { mode: "date" }),
});

export const restaurantOrderItems = pgTable("restaurant_order_items", {
  orderItemId: uuid("order_item_id").primaryKey().defaultRandom(),
  shopId: uuid("shop_id")
    .notNull()
    .references(() => shops.shopId, { onDelete: "cascade" }),
  orderId: uuid("order_id")
    .notNull()
    .references(() => restaurantOrders.orderId, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.productId),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  specialRequests: text("special_requests"),
  kitchenStatus: varchar("kitchen_status", { length: 20 })
    .default("pending")
    .notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  addedAt: timestamp("added_at", { mode: "date" }).defaultNow().notNull(),
});

export type RestaurantTable = typeof restaurantTables.$inferSelect;
export type NewRestaurantTable = typeof restaurantTables.$inferInsert;

export type RestaurantOrder = typeof restaurantOrders.$inferSelect;
export type NewRestaurantOrder = typeof restaurantOrders.$inferInsert;

export type RestaurantOrderItem = typeof restaurantOrderItems.$inferSelect;
export type NewRestaurantOrderItem = typeof restaurantOrderItems.$inferInsert;
