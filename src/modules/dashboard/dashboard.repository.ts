import { db } from '../../config/database';
import { transactions } from '../../db/schema/transactions';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

export class DashboardRepository {

  async getCashierSummary(cashierId: string, shopId: string) {
    // Today's start and end in UTC
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setUTCHours(23, 59, 59, 999);

    // Get today's completed transactions for this cashier
    const todayTransactions = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.shopId, shopId),
          eq(transactions.cashierId, cashierId),
          eq(transactions.status, 'completed' as any),
          gte(transactions.createdAt, todayStart),
          lte(transactions.createdAt, todayEnd)
        )
      )
      .orderBy(desc(transactions.createdAt));

    return todayTransactions;
  }
}