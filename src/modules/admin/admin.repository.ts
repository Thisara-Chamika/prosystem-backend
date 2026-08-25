import { db } from "../../config/database";
import { shops } from "../../db/schema/shops";
import { users } from "../../db/schema/users";
import { customers } from "../../db/schema/customers";
import { transactions } from "../../db/schema/transactions";
import { count, ne, ilike, or, and, eq, inArray, desc } from "drizzle-orm";

export class AdminRepository {
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

  async updateShopStatus(shopId: string, isActive: boolean) {
    const result = await db
      .update(shops)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(shops.shopId, shopId))
      .returning();

    return result[0] ?? null;
  }
}