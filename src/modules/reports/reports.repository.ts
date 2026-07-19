import { db } from "../../config/database";
import { transactions } from "../../db/schema/transactions";
import { transactionItems } from "../../db/schema/transactions";
import { returns } from "../../db/schema/returns";
import { users } from "../../db/schema/users";
import { eq, and, gte, lte, sum, count, desc } from "drizzle-orm";
import { customers } from "../../db/schema/customers";
import { inventory } from "../../db/schema/inventory";
import { products } from "../../db/schema/products";

export class ReportsRepository {
  // ── SUMMARY ───────────────────────────────────────
  async getSummary(shopId: string, fromDate: Date, toDate: Date) {
    // Current period transactions
    const current = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.shopId, shopId),
          eq(transactions.status, "completed" as any),
          gte(transactions.createdAt, fromDate),
          lte(transactions.createdAt, toDate),
        ),
      );

    // Previous period (same duration, day before)
    const duration = toDate.getTime() - fromDate.getTime();
    const prevFromDate = new Date(fromDate.getTime() - duration - 86400000);
    const prevToDate = new Date(fromDate.getTime() - 1);

    const previous = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.shopId, shopId),
          eq(transactions.status, "completed" as any),
          gte(transactions.createdAt, prevFromDate),
          lte(transactions.createdAt, prevToDate),
        ),
      );

    return { current, previous };
  }

  // ── DAILY SALES ───────────────────────────────────
  async getDailySales(shopId: string, fromDate: Date, toDate: Date) {
    const result = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.shopId, shopId),
          eq(transactions.status, "completed" as any),
          gte(transactions.createdAt, fromDate),
          lte(transactions.createdAt, toDate),
        ),
      )
      .orderBy(transactions.createdAt);

    return result;
  }

  // ── TOP PRODUCTS ──────────────────────────────────
  async getTopProducts(
    shopId: string,
    fromDate: Date,
    toDate: Date,
    limit: number,
  ) {
    // Get all completed transaction IDs in date range
    const completedTxns = await db
      .select({ transactionId: transactions.transactionId })
      .from(transactions)
      .where(
        and(
          eq(transactions.shopId, shopId),
          eq(transactions.status, "completed" as any),
          gte(transactions.createdAt, fromDate),
          lte(transactions.createdAt, toDate),
        ),
      );

    if (completedTxns.length === 0) return [];

    // Get all items from those transactions
    const allItems = await db
      .select()
      .from(transactionItems)
      .where(eq(transactionItems.shopId, shopId));

    // Filter items belonging to completed transactions
    const txnIds = new Set(completedTxns.map((t) => t.transactionId));
    const filteredItems = allItems.filter((item) =>
      txnIds.has(item.transactionId),
    );

    // Aggregate by product
    const productMap: Record<
      string,
      {
        productId: string;
        productName: string;
        sku: string;
        quantitySold: number;
        revenue: number;
      }
    > = {};

    for (const item of filteredItems) {
      if (!productMap[item.productId]) {
        productMap[item.productId] = {
          productId: item.productId,
          productName: item.productName,
          sku: item.productSku,
          quantitySold: 0,
          revenue: 0,
        };
      }
      productMap[item.productId].quantitySold += item.quantity;
      productMap[item.productId].revenue += parseFloat(item.total);
    }

    // Sort by quantity sold and limit
    return Object.values(productMap)
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, limit);
  }

  // ── PAYMENT METHODS ───────────────────────────────
  async getPaymentMethods(shopId: string, fromDate: Date, toDate: Date) {
    const result = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.shopId, shopId),
          eq(transactions.status, "completed" as any),
          gte(transactions.createdAt, fromDate),
          lte(transactions.createdAt, toDate),
        ),
      );

    return result;
  }

  // ── CASHIER SUMMARY ───────────────────────────────
  async getCashierSummary(shopId: string, fromDate: Date, toDate: Date) {
    // Get all completed transactions
    const txns = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.shopId, shopId),
          eq(transactions.status, "completed" as any),
          gte(transactions.createdAt, fromDate),
          lte(transactions.createdAt, toDate),
        ),
      );

    // Get all returns in date range
    const allReturns = await db
      .select()
      .from(returns)
      .where(
        and(
          eq(returns.shopId, shopId),
          gte(returns.createdAt, fromDate),
          lte(returns.createdAt, toDate),
        ),
      );

    // Get all cashiers for this shop
    const cashiers = await db
      .select({
        userId: users.userId,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(users)
      .where(eq(users.shopId, shopId));

    return { txns, allReturns, cashiers };
  }

  // ── REVENUE TRENDS ────────────────────────────────
  async getRevenueTrends(
    shopId: string,
    currentFrom: Date,
    currentTo: Date,
    previousFrom: Date,
    previousTo: Date,
  ) {
    const current = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.shopId, shopId),
          eq(transactions.status, "completed" as any),
          gte(transactions.createdAt, currentFrom),
          lte(transactions.createdAt, currentTo),
        ),
      );

    const previous = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.shopId, shopId),
          eq(transactions.status, "completed" as any),
          gte(transactions.createdAt, previousFrom),
          lte(transactions.createdAt, previousTo),
        ),
      );

    return { current, previous };
  }

  // ── CUSTOMER ANALYTICS ────────────────────────────
  async getCustomerAnalytics(shopId: string, fromDate: Date, toDate: Date) {
    // Customers created within the period
    const newCustomersInPeriod = await db
      .select()
      .from(customers)
      .where(
        and(
          eq(customers.shopId, shopId),
          gte(customers.createdAt, fromDate),
          lte(customers.createdAt, toDate),
        ),
      );

    // All transactions in the period (completed only — a cancelled
    // sale shouldn't count as "activity" for this metric)
    const periodTransactions = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.shopId, shopId),
          eq(transactions.status, "completed" as any),
          gte(transactions.createdAt, fromDate),
          lte(transactions.createdAt, toDate),
        ),
      );

    // All customers for this shop (needed to check createdAt
    // for "returning" classification, and for topCustomers/atRisk)
    const allCustomers = await db
      .select()
      .from(customers)
      .where(eq(customers.shopId, shopId));

    return { newCustomersInPeriod, periodTransactions, allCustomers };
  }

  // ── INVENTORY VALUATION ───────────────────────────
  async getInventoryValuation(shopId: string) {
    const items = await db
      .select({
        quantity: inventory.quantity,
        cost: products.cost,
        price: products.price,
        category: products.category,
      })
      .from(inventory)
      .innerJoin(
        products,
        and(
          eq(products.productId, inventory.productId),
          eq(products.shopId, shopId),
          eq(products.isActive, true),
          eq(products.productType, "product"),
        ),
      )
      .where(eq(inventory.shopId, shopId));

    return items;
  }
}
