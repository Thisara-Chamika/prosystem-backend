import { db } from "../../config/database";
import { shops } from "../../db/schema/shops";
import { users } from "../../db/schema/users";
import { customers } from "../../db/schema/customers";
import { transactions } from "../../db/schema/transactions";
import {
  supportTickets,
  supportTicketMessages,
} from "../../db/schema/support-tickets";
import { count, ne, ilike, or, and, eq, inArray, desc, asc } from "drizzle-orm";

export class AdminRepository {
  // Get metrics for the admin dashboard
  async getMetrics() {
    const [shopsCount] = await db.select({ count: count() }).from(shops);
    const [usersCount] = await db
      .select({ count: count() })
      .from(users)
      .where(ne(users.role, "super_admin"));
    const [customersCount] = await db
      .select({ count: count() })
      .from(customers);
    const [transactionsCount] = await db
      .select({ count: count() })
      .from(transactions);

    return {
      totalShops: Number(shopsCount?.count ?? 0),
      totalUsers: Number(usersCount?.count ?? 0),
      totalCustomers: Number(customersCount?.count ?? 0),
      totalTransactions: Number(transactionsCount?.count ?? 0),
    };
  }

  // Get a paginated list of shops with optional search filters
  async getShops(filters: { search?: string; page?: number; limit?: number }) {
    const limit = filters.limit ?? 20;
    const offset = ((filters.page ?? 1) - 1) * limit;

    const conditions = filters.search
      ? [
          or(
            ilike(shops.name, `%${filters.search}%`),
            ilike(shops.slug, `%${filters.search}%`),
          )!,
        ]
      : [];

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await db
      .select({ count: count() })
      .from(shops)
      .where(whereClause);
    const total = Number(countResult?.count ?? 0);

    const shopRows = await db
      .select()
      .from(shops)
      .where(whereClause)
      .orderBy(desc(shops.createdAt))
      .limit(limit)
      .offset(offset);

    if (shopRows.length === 0) return { data: [], total };

    const shopIds = shopRows.map((s) => s.shopId);
    const owners = await db
      .select({
        shopId: users.shopId,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(users)
      .where(and(inArray(users.shopId, shopIds), eq(users.role, "shop_owner")));

    const ownerByShopId = new Map(
      owners.map((o) => [o.shopId, `${o.firstName} ${o.lastName}`]),
    );

    const data = shopRows.map((shop) => ({
      shopId: shop.shopId,
      shopName: shop.name,
      ownerName: ownerByShopId.get(shop.shopId) ?? "Unknown",
      businessType: shop.businessType,
      createdAt: shop.createdAt,
      isActive: shop.isActive,
    }));

    return { data, total };
  }

  // Update the status of a shop (activate/deactivate)
  async updateShopStatus(shopId: string, isActive: boolean) {
    const result = await db
      .update(shops)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(shops.shopId, shopId))
      .returning();

    return result[0] ?? null;
  }

  // Get support tickets with optional status filter
  async getSupportTickets(status?: string) {
    const whereClause = status ? eq(supportTickets.status, status) : undefined;

    return await db
      .select({
        ticketId: supportTickets.ticketId,
        shopId: supportTickets.shopId,
        shopName: shops.name,
        raisedBy: supportTickets.raisedBy,
        subject: supportTickets.subject,
        status: supportTickets.status,
        createdAt: supportTickets.createdAt,
        updatedAt: supportTickets.updatedAt,
      })
      .from(supportTickets)
      .leftJoin(shops, eq(shops.shopId, supportTickets.shopId))
      .where(whereClause)
      .orderBy(desc(supportTickets.updatedAt));
  }

  // Get a support ticket by its ID, including its messages
    async getSupportTicketById(ticketId: string) {
    const ticket = await db
      .select({
        ticketId: supportTickets.ticketId,
        shopId: supportTickets.shopId,
        shopName: shops.name,
        raisedBy: supportTickets.raisedBy,
        subject: supportTickets.subject,
        status: supportTickets.status,
        createdAt: supportTickets.createdAt,
        updatedAt: supportTickets.updatedAt,
      })
      .from(supportTickets)
      .leftJoin(shops, eq(shops.shopId, supportTickets.shopId))
      .where(eq(supportTickets.ticketId, ticketId))
      .limit(1);

    if (!ticket[0]) return null;

    const messages = await db
      .select()
      .from(supportTicketMessages)
      .where(eq(supportTicketMessages.ticketId, ticketId))
      .orderBy(asc(supportTicketMessages.createdAt));

    const shopSenderIds = [...new Set(messages.filter((m) => m.senderType === 'shop').map((m) => m.senderId))];

    const senderRows = shopSenderIds.length > 0
      ? await db
          .select({ userId: users.userId, firstName: users.firstName, lastName: users.lastName })
          .from(users)
          .where(inArray(users.userId, shopSenderIds))
      : [];

    const nameById = new Map(senderRows.map((u) => [u.userId, `${u.firstName} ${u.lastName}`]));

    const enrichedMessages = messages.map((m) => ({
      ...m,
      senderName: m.senderType === 'admin' ? 'ProSystem Support' : nameById.get(m.senderId) ?? 'Unknown',
    }));

    return { ...ticket[0], messages: enrichedMessages };
  }

  // Add a message to a support ticket as an admin
  async addAdminMessage(
    ticketId: string,
    adminUserId: string,
    message: string,
  ) {
    const ticket = await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.ticketId, ticketId))
      .limit(1);
    if (!ticket[0]) return null;

    const newMessage = await db
      .insert(supportTicketMessages)
      .values({
        ticketId,
        shopId: ticket[0].shopId,
        senderId: adminUserId,
        senderType: "admin",
        message,
      })
      .returning();

    await db
      .update(supportTickets)
      .set({ updatedAt: new Date() })
      .where(eq(supportTickets.ticketId, ticketId));

    return newMessage[0];
  }

  // Update the status of a support ticket
  async updateTicketStatus(ticketId: string, status: string) {
    const result = await db
      .update(supportTickets)
      .set({ status, updatedAt: new Date() })
      .where(eq(supportTickets.ticketId, ticketId))
      .returning();

    return result[0] ?? null;
  }
}