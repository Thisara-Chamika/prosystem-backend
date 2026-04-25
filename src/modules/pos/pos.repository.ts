import { db } from '../../config/database';
import { transactions, transactionItems } from '../../db/schema/transactions';
import { inventory } from '../../db/schema/inventory';
import { products } from '../../db/schema/products';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { NewTransaction, NewTransactionItem } from '../../db/schema/transactions';
import { TransactionFilters } from './pos.types';

export class PosRepository {

  // Generate transaction number
  async generateTransactionNumber(shopId: string): Promise<string> {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = date.getTime().toString().slice(-6);
    return `TXN-${dateStr}-${timeStr}`;
  }

  // Get product with inventory
  async getProductWithInventory(productId: string, shopId: string) {
    const product = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.productId, productId),
          eq(products.shopId, shopId),
          eq(products.isActive, true)
        )
      )
      .limit(1);

    if (!product[0]) return null;

    const inv = await db
      .select()
      .from(inventory)
      .where(
        and(
          eq(inventory.productId, productId),
          eq(inventory.shopId, shopId)
        )
      )
      .limit(1);

    return {
      ...product[0],
      inventory: inv[0] ?? null,
    };
  }

  // Create transaction with items
  async createTransaction(
    transactionData: NewTransaction,
    items: NewTransactionItem[]
  ) {
    // 1. Create transaction
    const newTransaction = await db
      .insert(transactions)
      .values(transactionData)
      .returning();

    // 2. Create transaction items
    const newItems = await db
      .insert(transactionItems)
      .values(items.map(item => ({
        ...item,
        transactionId: newTransaction[0].transactionId,
      })))
      .returning();

    // 3. Update inventory for each item
    for (const item of items) {
      const currentInventory = await db
        .select()
        .from(inventory)
        .where(
          and(
            eq(inventory.productId, item.productId),
            eq(inventory.shopId, transactionData.shopId!)
          )
        )
        .limit(1);

      if (currentInventory[0]) {
        await db
          .update(inventory)
          .set({
            quantity: currentInventory[0].quantity - item.quantity!,
            updatedAt: new Date(),
          })
          .where(eq(inventory.inventoryId, currentInventory[0].inventoryId));
      }
    }

    return {
      transaction: newTransaction[0],
      items: newItems,
    };
  }

  // Get all transactions
  async getTransactions(shopId: string, filters: TransactionFilters) {
    const limit = filters.limit ?? 10;
    const offset = ((filters.page ?? 1) - 1) * limit;

    const conditions = [eq(transactions.shopId, shopId)];

    if (filters.status) {
      conditions.push(eq(transactions.status, filters.status as any));
    }

    if (filters.customerId) {
      conditions.push(eq(transactions.customerId, filters.customerId));
    }

    if (filters.fromDate) {
      conditions.push(gte(transactions.createdAt, new Date(filters.fromDate)));
    }

    if (filters.toDate) {
      conditions.push(lte(transactions.createdAt, new Date(filters.toDate)));
    }

    return await db
      .select()
      .from(transactions)
      .where(and(...conditions))
      .orderBy(desc(transactions.createdAt))
      .limit(limit)
      .offset(offset);
  }

  // Get single transaction with items
  async getTransactionById(transactionId: string, shopId: string) {
    const transaction = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.transactionId, transactionId),
          eq(transactions.shopId, shopId)
        )
      )
      .limit(1);

    if (!transaction[0]) return null;

    const items = await db
      .select()
      .from(transactionItems)
      .where(eq(transactionItems.transactionId, transactionId));

    return {
      ...transaction[0],
      items,
    };
  }

  // Update transaction status
  async updateTransactionStatus(
    transactionId: string,
    shopId: string,
    status: string,
    userId: string
  ) {
    const result = await db
      .update(transactions)
      .set({
        status: status as any,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(transactions.transactionId, transactionId),
          eq(transactions.shopId, shopId)
        )
      )
      .returning();

    return result[0] ?? null;
  }
}