import { db } from "../../../config/database";
import {
  restaurantOrders,
  restaurantOrderItems,
  restaurantTables,
} from "../../../db/schema/table-management";
import { products } from "../../../db/schema/products";
import { eq, and, inArray, ne } from "drizzle-orm";

const VALID_TRANSITIONS: Record<string, string> = {
  preparing: "ready",
  ready: "served",
};

export class KitchenService {
  async getQueue(shopId: string) {
    const items = await db
      .select()
      .from(restaurantOrderItems)
      .where(
        and(
          eq(restaurantOrderItems.shopId, shopId),
          eq(restaurantOrderItems.isActive, true),
          inArray(restaurantOrderItems.kitchenStatus, ["preparing", "ready"]),
        ),
      );

    if (items.length === 0) return [];

    const orderIds = [...new Set(items.map((i) => i.orderId))];
    const productIds = [...new Set(items.map((i) => i.productId))];

    const orders = await db
      .select()
      .from(restaurantOrders)
      .where(inArray(restaurantOrders.orderId, orderIds));
    const tableIds = [...new Set(orders.map((o) => o.tableId))];
    const tables = await db
      .select()
      .from(restaurantTables)
      .where(inArray(restaurantTables.tableId, tableIds));
    const productRows = await db
      .select()
      .from(products)
      .where(inArray(products.productId, productIds));

    const tableById = new Map(tables.map((t) => [t.tableId, t]));
    const productById = new Map(productRows.map((p) => [p.productId, p]));
    const orderById = new Map(orders.map((o) => [o.orderId, o]));

    const grouped = new Map<string, any[]>();
    for (const item of items) {
      const list = grouped.get(item.orderId) ?? [];
      list.push({
        orderItemId: item.orderItemId,
        productName: productById.get(item.productId)?.name ?? "Unknown item",
        quantity: item.quantity,
        specialRequests: item.specialRequests,
        kitchenStatus: item.kitchenStatus,
        addedAt: item.addedAt,
      });
      grouped.set(item.orderId, list);
    }

    return Array.from(grouped.entries())
      .map(([orderId, orderItems]) => {
        const order = orderById.get(orderId);
        if (!order) return null;
        const table = tableById.get(order.tableId);
        return {
          orderId,
          tableNumber: table?.tableNumber ?? null,
          openedAt: order.openedAt,
          items: orderItems,
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
      .sort(
        (a, b) =>
          new Date(a.openedAt).getTime() - new Date(b.openedAt).getTime(),
      );
  }

  async updateItemStatus(
    shopId: string,
    orderItemId: string,
    newStatus: string,
  ) {
    const item = await db
      .select()
      .from(restaurantOrderItems)
      .where(
        and(
          eq(restaurantOrderItems.orderItemId, orderItemId),
          eq(restaurantOrderItems.shopId, shopId),
          eq(restaurantOrderItems.isActive, true),
        ),
      )
      .limit(1);

    if (!item[0]) throw new Error("Order item not found!");

    const currentStatus = item[0].kitchenStatus;
    const expectedNext = VALID_TRANSITIONS[currentStatus];

    if (expectedNext !== newStatus) {
      throw new Error(
        `Cannot move item from '${currentStatus}' to '${newStatus}'. Must go through: preparing → ready → served.`,
      );
    }

    const result = await db
      .update(restaurantOrderItems)
      .set({ kitchenStatus: newStatus })
      .where(eq(restaurantOrderItems.orderItemId, orderItemId))
      .returning();

    if (newStatus === "served") {
      const remaining = await db
        .select()
        .from(restaurantOrderItems)
        .where(
          and(
            eq(restaurantOrderItems.orderId, item[0].orderId),
            eq(restaurantOrderItems.isActive, true),
            ne(restaurantOrderItems.kitchenStatus, "served"),
          ),
        );

      if (remaining.length === 0) {
        await db
          .update(restaurantOrders)
          .set({ status: "served" })
          .where(eq(restaurantOrders.orderId, item[0].orderId));
      }
    }

    return result[0];
  }
}

export const kitchenService = new KitchenService();
