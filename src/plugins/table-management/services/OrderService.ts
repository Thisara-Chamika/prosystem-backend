import { db } from "../../../config/database";
import {
  restaurantTables,
  restaurantOrders,
  restaurantOrderItems,
} from "../../../db/schema/table-management";
import { products } from "../../../db/schema/products";
import { inventory } from "../../../db/schema/inventory";
import { eq, and, ne, sql } from "drizzle-orm";

export class OrderService {
  async openOrder(
    shopId: string,
    tableId: string,
    serverId: string,
    data: { customerId?: string },
  ) {
    const table = await db
      .select()
      .from(restaurantTables)
      .where(
        and(
          eq(restaurantTables.tableId, tableId),
          eq(restaurantTables.shopId, shopId),
        ),
      )
      .limit(1);

    if (!table[0].isActive) throw new Error("This table has been removed!");

    const existingOrder = await db
      .select()
      .from(restaurantOrders)
      .where(
        and(
          eq(restaurantOrders.tableId, tableId),
          eq(restaurantOrders.shopId, shopId),
          ne(restaurantOrders.status, "closed"),
        ),
      )
      .limit(1);

    if (existingOrder[0])
      throw new Error("This table already has an open order!");

    const result = await db
      .insert(restaurantOrders)
      .values({
        shopId,
        tableId,
        serverId,
        customerId: data.customerId,
      })
      .returning();

    await db
      .update(restaurantTables)
      .set({ status: "occupied", updatedAt: new Date() })
      .where(eq(restaurantTables.tableId, tableId));

    return result[0];
  }

  async getActiveOrder(shopId: string, tableId: string) {
    const order = await db
      .select()
      .from(restaurantOrders)
      .where(
        and(
          eq(restaurantOrders.tableId, tableId),
          eq(restaurantOrders.shopId, shopId),
          ne(restaurantOrders.status, "closed"),
        ),
      )
      .limit(1);

    if (!order[0]) throw new Error("No active order for this table!");

    const items = await db
      .select()
      .from(restaurantOrderItems)
      .where(
        and(
          eq(restaurantOrderItems.orderId, order[0].orderId),
          eq(restaurantOrderItems.isActive, true),
        ),
      );

    return { ...order[0], items };
  }

  async addItem(
    shopId: string,
    orderId: string,
    data: { productId: string; quantity: number; specialRequests?: string },
  ) {
    const order = await db
      .select()
      .from(restaurantOrders)
      .where(
        and(
          eq(restaurantOrders.orderId, orderId),
          eq(restaurantOrders.shopId, shopId),
        ),
      )
      .limit(1);

    if (!order[0]) throw new Error("Order not found!");
    if (order[0].status === "closed")
      throw new Error("This order is already closed!");

    const product = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.productId, data.productId),
          eq(products.shopId, shopId),
        ),
      )
      .limit(1);

    if (!product[0]) throw new Error("Product not found!");

    // Only check stock for items that actually track inventory (drinks, bottled items)
    if (product[0].trackInventory) {
      const stock = await db
        .select()
        .from(inventory)
        .where(
          and(
            eq(inventory.productId, data.productId),
            eq(inventory.shopId, shopId),
          ),
        )
        .limit(1);

      const available = (stock[0]?.quantity ?? 0) - (stock[0]?.reserved ?? 0);
      if (available < data.quantity) {
        throw new Error(
          `Insufficient stock for ${product[0].name}! Available: ${available}`,
        );
      }
    }

    const result = await db
      .insert(restaurantOrderItems)
      .values({
        shopId,
        orderId,
        productId: data.productId,
        quantity: data.quantity,
        unitPrice: product[0].price,
        specialRequests: data.specialRequests,
      })
      .returning();

      if (product[0].trackInventory) {
      await db
        .update(inventory)
        .set({ reserved: sql`${inventory.reserved} + ${data.quantity}` })
        .where(and(eq(inventory.productId, data.productId), eq(inventory.shopId, shopId)));
    }

    return result[0];
  }

  async removeItem(shopId: string, orderId: string, orderItemId: string) {
    const item = await db
      .select()
      .from(restaurantOrderItems)
      .where(
        and(
          eq(restaurantOrderItems.orderItemId, orderItemId),
          eq(restaurantOrderItems.orderId, orderId),
          eq(restaurantOrderItems.shopId, shopId),
          eq(restaurantOrderItems.isActive, true),
        ),
      )
      .limit(1);

    if (!item[0]) throw new Error("Order item not found!");

    if (item[0].kitchenStatus !== "pending") {
      throw new Error(
        "Cannot remove an item that has already been sent to the kitchen!",
      );
    }

    await db
      .update(restaurantOrderItems)
      .set({ isActive: false })
      .where(eq(restaurantOrderItems.orderItemId, orderItemId));

      const product = await db
      .select()
      .from(products)
      .where(eq(products.productId, item[0].productId))
      .limit(1);

    if (product[0]?.trackInventory) {
      await db
        .update(inventory)
        .set({ reserved: sql`GREATEST(${inventory.reserved} - ${item[0].quantity}, 0)` })
        .where(and(eq(inventory.productId, item[0].productId), eq(inventory.shopId, shopId)));
    }
  }

  async sendToKitchen(shopId: string, orderId: string) {
    const order = await db
      .select()
      .from(restaurantOrders)
      .where(
        and(
          eq(restaurantOrders.orderId, orderId),
          eq(restaurantOrders.shopId, shopId),
        ),
      )
      .limit(1);

    if (!order[0]) throw new Error("Order not found!");

    const pendingItems = await db
      .select()
      .from(restaurantOrderItems)
      .where(
        and(
          eq(restaurantOrderItems.orderId, orderId),
          eq(restaurantOrderItems.kitchenStatus, "pending"),
          eq(restaurantOrderItems.isActive, true),
        ),
      );

    if (pendingItems.length === 0)
      throw new Error("No pending items to send to kitchen!");

    for (const item of pendingItems) {
      await db
        .update(restaurantOrderItems)
        .set({ kitchenStatus: "preparing" })
        .where(eq(restaurantOrderItems.orderItemId, item.orderItemId));
    }

    if (order[0].status === "open") {
      await db
        .update(restaurantOrders)
        .set({ status: "sent_to_kitchen" })
        .where(eq(restaurantOrders.orderId, orderId));
    }

    return { itemsSent: pendingItems.length };
  }
}

export const orderService = new OrderService();
