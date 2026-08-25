import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { shops } from "./shops";
import { users } from "./users";

export const supportTickets = pgTable("support_tickets", {
  ticketId: uuid("ticket_id").primaryKey().defaultRandom(),
  shopId: uuid("shop_id")
    .notNull()
    .references(() => shops.shopId, { onDelete: "cascade" }),
  raisedBy: uuid("raised_by")
    .notNull()
    .references(() => users.userId),
  subject: varchar("subject", { length: 255 }).notNull(),
  status: varchar("status", { length: 20 }).default("open").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
});

export const supportTicketMessages = pgTable("support_ticket_messages", {
  messageId: uuid("message_id").primaryKey().defaultRandom(),
  ticketId: uuid("ticket_id")
    .notNull()
    .references(() => supportTickets.ticketId, { onDelete: "cascade" }),
  shopId: uuid("shop_id")
    .notNull()
    .references(() => shops.shopId, { onDelete: "cascade" }),
  senderId: uuid("sender_id")
    .notNull()
    .references(() => users.userId),
  senderType: varchar("sender_type", { length: 10 }).notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

export type SupportTicket = typeof supportTickets.$inferSelect;
export type NewSupportTicket = typeof supportTickets.$inferInsert;

export type SupportTicketMessage = typeof supportTicketMessages.$inferSelect;
export type NewSupportTicketMessage = typeof supportTicketMessages.$inferInsert;
