import { db } from "../../../config/database";
import {
  restaurantTables,
  restaurantOrders,
  restaurantOrderItems,
} from "../../../db/schema/table-management";
import { products } from "../../../db/schema/products";
import { inventory } from "../../../db/schema/inventory";
import { eq, and, ne, sql, inArray } from "drizzle-orm";
import { PosService } from "../../../modules/pos/pos.service";

const posService = new PosService();

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

    if (items.length === 0) return { ...order[0], items: [] };

    const productIds = [...new Set(items.map((i) => i.productId))];
    const productRows = await db
      .select()
      .from(products)
      .where(inArray(products.productId, productIds));
    const productById = new Map(productRows.map((p) => [p.productId, p]));

    const enrichedItems = items.map((item) => ({
      ...item,
      productName: productById.get(item.productId)?.name ?? "Unknown item",
    }));

    return { ...order[0], items: enrichedItems };
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
        .where(
          and(
            eq(inventory.productId, data.productId),
            eq(inventory.shopId, shopId),
          ),
        );
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
        .set({
          reserved: sql`GREATEST(${inventory.reserved} - ${item[0].quantity}, 0)`,
        })
        .where(
          and(
            eq(inventory.productId, item[0].productId),
            eq(inventory.shopId, shopId),
          ),
        );
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

  async checkoutOrder(
    shopId: string,
    orderId: string,
    userId: string,
    role: string,
    data: {
      paymentMethod: "cash" | "card" | "online" | "mixed";
      stripePaymentIntentId?: string;
      discount?: number;
      splitCount?: number;
    },
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
      throw new Error("This order has already been checked out!");

    const items = await db
      .select()
      .from(restaurantOrderItems)
      .where(
        and(
          eq(restaurantOrderItems.orderId, orderId),
          eq(restaurantOrderItems.isActive, true),
        ),
      );

    if (items.length === 0)
      throw new Error("Cannot checkout an order with no items!");

    const productIds = [...new Set(items.map((i) => i.productId))];
    const productRows = await db
      .select()
      .from(products)
      .where(inArray(products.productId, productIds));
    const productById = new Map(productRows.map((p) => [p.productId, p]));

    // Reuse the real POS transaction logic — no duplicate checkout code
    const result = await posService.createTransaction(
      {
        customerId: order[0].customerId ?? undefined,
        items: Array.from(
          items.reduce((map, i) => {
            map.set(i.productId, (map.get(i.productId) ?? 0) + i.quantity);
            return map;
          }, new Map<string, number>()),
        ).map(([productId, quantity]) => ({ productId, quantity })),
        paymentMethod: data.paymentMethod,
        discount: data.discount,
        stripePaymentIntentId: data.stripePaymentIntentId,
        notes: `Table order ${orderId}`,
      },
      shopId,
      userId,
      role,
    );

    // Release the stock we reserved earlier — real POS checkout never touches `reserved`
    for (const item of items) {
      if (productById.get(item.productId)?.trackInventory) {
        await db
          .update(inventory)
          .set({
            reserved: sql`GREATEST(${inventory.reserved} - ${item.quantity}, 0)`,
          })
          .where(
            and(
              eq(inventory.productId, item.productId),
              eq(inventory.shopId, shopId),
            ),
          );
      }
    }

    await db
      .update(restaurantOrders)
      .set({
        status: "closed",
        transactionId: result.transaction.transactionId,
        closedAt: new Date(),
      })
      .where(eq(restaurantOrders.orderId, orderId));

    await db
      .update(restaurantTables)
      .set({ status: "needs_cleaning", updatedAt: new Date() })
      .where(eq(restaurantTables.tableId, order[0].tableId));

    const response: any = {
      transaction: result.transaction,
      items: result.items,
    };

    if (data.splitCount && data.splitCount > 1) {
      response.splitCount = data.splitCount;
      response.amountPerPerson = (
        parseFloat(result.transaction.total) / data.splitCount
      ).toFixed(2);
    }

    return response;
  }
}

export const orderService = new OrderService();
