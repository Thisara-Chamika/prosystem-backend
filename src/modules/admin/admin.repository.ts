import { db } from "../../config/database";
import { shops } from "../../db/schema/shops";
import { users } from "../../db/schema/users";
import { customers } from "../../db/schema/customers";
import { transactions } from "../../db/schema/transactions";
import { count, ne } from "drizzle-orm";

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
}