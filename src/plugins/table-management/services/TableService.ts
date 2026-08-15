import { db } from '../../../config/database';
import { restaurantTables, restaurantOrders, restaurantOrderItems } from '../../../db/schema/table-management';
import { eq, and, ne, inArray } from 'drizzle-orm';

const VALID_STATUSES = ['available', 'occupied', 'reserved', 'needs_cleaning'];

export class TableService {

  // Get all tables, with a live summary attached to any that have an open order
  async getTables(shopId: string) {
    const tables = await db
      .select()
      .from(restaurantTables)
      .where(and(eq(restaurantTables.shopId, shopId), eq(restaurantTables.isActive, true)))
      .orderBy(restaurantTables.tableNumber);

    const activeOrders = await db
      .select()
      .from(restaurantOrders)
      .where(and(eq(restaurantOrders.shopId, shopId), ne(restaurantOrders.status, 'closed')));

    if (activeOrders.length === 0) {
      return tables;
    }

    const activeOrderIds = activeOrders.map(o => o.orderId);

    const items = await db
      .select()
      .from(restaurantOrderItems)
      .where(inArray(restaurantOrderItems.orderId, activeOrderIds));

    const summaryByOrderId = new Map<string, { itemCount: number; runningTotal: number }>();
    for (const item of items) {
      const existing = summaryByOrderId.get(item.orderId) ?? { itemCount: 0, runningTotal: 0 };
      existing.itemCount += item.quantity;
      existing.runningTotal += parseFloat(item.unitPrice) * item.quantity;
      summaryByOrderId.set(item.orderId, existing);
    }

    const orderByTableId = new Map(activeOrders.map(o => [o.tableId, o]));

    return tables.map(table => {
      const order = orderByTableId.get(table.tableId);
      if (!order) return table;

      const summary = summaryByOrderId.get(order.orderId) ?? { itemCount: 0, runningTotal: 0 };

      return {
        ...table,
        activeOrderId: order.orderId,
        itemCount: summary.itemCount,
        runningTotal: summary.runningTotal.toFixed(2),
        openedAt: order.openedAt,
      };
    });
  }

  async createTable(shopId: string, data: { tableNumber: number; capacity?: number }) {
    const existing = await db
      .select()
      .from(restaurantTables)
      .where(
        and(
          eq(restaurantTables.shopId, shopId),
          eq(restaurantTables.tableNumber, data.tableNumber),
          eq(restaurantTables.isActive, true)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      throw new Error(`Table ${data.tableNumber} already exists for this shop!`);
    }

    const result = await db
      .insert(restaurantTables)
      .values({
        shopId,
        tableNumber: data.tableNumber,
        capacity: data.capacity ?? 4,
      })
      .returning();

    return result[0];
  }

  async updateTable(shopId: string, tableId: string, data: { capacity?: number; status?: string }) {
    if (data.status && !VALID_STATUSES.includes(data.status)) {
      throw new Error(`Invalid table status '${data.status}'. Must be one of: ${VALID_STATUSES.join(', ')}`);
    }

    const result = await db
      .update(restaurantTables)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(restaurantTables.tableId, tableId), eq(restaurantTables.shopId, shopId)))
      .returning();

    if (result.length === 0) {
      throw new Error('Table not found!');
    }

    return result[0];
  }

  // Soft delete — reject if the table currently has an open (not-yet-closed) order
  async deleteTable(shopId: string, tableId: string) {
    const openOrder = await db
      .select()
      .from(restaurantOrders)
      .where(
        and(
          eq(restaurantOrders.tableId, tableId),
          eq(restaurantOrders.shopId, shopId),
          ne(restaurantOrders.status, 'closed')
        )
      )
      .limit(1);

    if (openOrder.length > 0) {
      throw new Error('This table has an open order and cannot be deleted!');
    }

    const result = await db
      .update(restaurantTables)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(restaurantTables.tableId, tableId), eq(restaurantTables.shopId, shopId)))
      .returning();

    if (result.length === 0) {
      throw new Error('Table not found!');
    }

    return result[0];
  }
}

export const tableService = new TableService();