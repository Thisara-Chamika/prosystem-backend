import { db } from '../../config/database';
import { returns, returnItems } from '../../db/schema/returns';
import { transactions } from '../../db/schema/transactions';
import { transactionItems } from '../../db/schema/transactions';
import { inventory } from '../../db/schema/inventory';
import { eq, and } from 'drizzle-orm';
import { NewReturn, NewReturnItem } from '../../db/schema/returns';

export class ReturnsRepository {

  // Get transaction with items
  async getTransactionWithItems(transactionId: string, shopId: string) {
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

  // Get already returned quantities for a transaction
  async getReturnedQuantities(transactionId: string) {
    const existingReturns = await db
      .select()
      .from(returns)
      .where(eq(returns.transactionId, transactionId));

    if (existingReturns.length === 0) return {};

    const returnIds = existingReturns.map(r => r.returnId);

    // Get all return items for this transaction
    const allReturnItems: Record<string, number> = {};

    for (const returnId of returnIds) {
      const items = await db
        .select()
        .from(returnItems)
        .where(eq(returnItems.returnId, returnId));

      for (const item of items) {
        const key = item.transactionItemId;
        allReturnItems[key] = (allReturnItems[key] ?? 0) + item.quantity;
      }
    }

    return allReturnItems;
  }

  // Restore inventory
  async restoreInventory(
    productId: string,
    shopId: string,
    quantity: number
  ) {
    const current = await db
      .select()
      .from(inventory)
      .where(
        and(
          eq(inventory.productId, productId),
          eq(inventory.shopId, shopId)
        )
      )
      .limit(1);

    if (current[0]) {
      await db
        .update(inventory)
        .set({
          quantity: current[0].quantity + quantity,
          updatedAt: new Date(),
        })
        .where(eq(inventory.inventoryId, current[0].inventoryId));
    }
  }

  // Create return record
  async createReturn(
    returnData: NewReturn,
    items: NewReturnItem[]
  ) {
    // Create return record
    const newReturn = await db
      .insert(returns)
      .values(returnData)
      .returning();

    // Create return items
    const newReturnItems = await db
      .insert(returnItems)
      .values(items.map(item => ({
        ...item,
        returnId: newReturn[0].returnId,
      })))
      .returning();

    return {
      return: newReturn[0],
      items: newReturnItems,
    };
  }

  // Update transaction status
  async updateTransactionStatus(
    transactionId: string,
    status: string
  ) {
    await db
      .update(transactions)
      .set({
        status: status as any,
        updatedAt: new Date(),
      })
      .where(eq(transactions.transactionId, transactionId));
  }
}