import { db } from '../../config/database';
import { inventory } from '../../db/schema/inventory';
import { products } from '../../db/schema/products';
import { eq, and, ilike, or, count, desc } from 'drizzle-orm';

export class InventoryRepository {

  // Get all inventory with filters
  async getInventory(shopId: string, filters: {
    search?: string;
    category?: string;
    status?: string;
    productType?: string;
    page?: number;
    limit?: number;
  }) {
    const limit = filters.limit ?? 10;
    const offset = ((filters.page ?? 1) - 1) * limit;

    // Join inventory with products
    const allItems = await db
      .select({
        inventoryId: inventory.inventoryId,
        productId: products.productId,
        productName: products.name,
        sku: products.sku,
        category: products.category,
        productType: products.productType,
        price: products.price,
        trackInventory: products.trackInventory,
        quantity: inventory.quantity,
        reserved: inventory.reserved,
        reorderPoint: inventory.reorderPoint,
        reorderQuantity: inventory.reorderQuantity,
        updatedAt: inventory.updatedAt,
        createdAt: products.createdAt,
      })
      .from(inventory)
      .innerJoin(
        products,
        and(
          eq(products.productId, inventory.productId),
          eq(products.shopId, shopId),
          eq(products.isActive, true)
        )
      )
      .where(eq(inventory.shopId, shopId))
      .orderBy(desc(products.createdAt));

    // Filter in JS (simpler than complex SQL conditions)
    let filtered = allItems;

    // Default — only show physical products
    filtered = filtered.filter(item =>
      item.productType === (filters.productType ?? 'product')
    );

    // Search filter
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(item =>
        item.productName.toLowerCase().includes(search) ||
        item.sku.toLowerCase().includes(search)
      );
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(item =>
        item.category === filters.category
      );
    }

    // Status filter
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(item => {
        const status = this.getStockStatus(
          item.quantity,
          item.reorderPoint ?? 0
        );
        return status === filters.status;
      });
    }

    // Total count before pagination
    const total = filtered.length;

    // Paginate
    const paginated = filtered.slice(offset, offset + limit);

    // Shape response
    const data = paginated.map(item => ({
      inventoryId: item.inventoryId,
      productId: item.productId,
      productName: item.productName,
      sku: item.sku,
      category: item.category,
      productType: item.productType,
      price: parseFloat(item.price),
      quantity: item.quantity,
      reserved: item.reserved,
      available: item.quantity - item.reserved,
      reorderPoint: item.reorderPoint,
      reorderQuantity: item.reorderQuantity,
      status: this.getStockStatus(
        item.quantity,
        item.reorderPoint ?? 0
      ),
      updatedAt: item.updatedAt,
    }));

    return { data, total };
  }

  // Get low stock items
  async getLowStock(shopId: string, limit: number = 10) {
    const allItems = await db
      .select({
        inventoryId: inventory.inventoryId,
        productId: products.productId,
        productName: products.name,
        sku: products.sku,
        category: products.category,
        productType: products.productType,
        quantity: inventory.quantity,
        reserved: inventory.reserved,
        reorderPoint: inventory.reorderPoint,
        reorderQuantity: inventory.reorderQuantity,
      })
      .from(inventory)
      .innerJoin(
        products,
        and(
          eq(products.productId, inventory.productId),
          eq(products.shopId, shopId),
          eq(products.isActive, true),
          eq(products.productType, 'product'),    // ← only physical products!
          eq(products.trackInventory, true)        // ← only tracked products!
        )
      )
      .where(eq(inventory.shopId, shopId));

    // Filter low stock and out of stock
    const lowStockItems = allItems.filter(item =>
      item.quantity <= (item.reorderPoint ?? 0) ||
      item.quantity === 0
    );

    // Count by status
    const outOfStockCount = lowStockItems.filter(
      item => item.quantity === 0
    ).length;

    const lowStockCount = lowStockItems.filter(
      item => item.quantity > 0 &&
              item.quantity <= (item.reorderPoint ?? 0)
    ).length;

    // Shape and limit
    const items = lowStockItems
      .slice(0, limit)
      .map(item => ({
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        category: item.category,
        quantity: item.quantity,
        reorderPoint: item.reorderPoint,
        status: this.getStockStatus(
          item.quantity,
          item.reorderPoint ?? 0
        ),
      }));

    return { lowStockCount, outOfStockCount, items };
  }

  // Update reorder settings
  async updateReorderSettings(
    productId: string,
    shopId: string,
    reorderPoint: number,
    reorderQuantity: number
  ) {
    const result = await db
      .update(inventory)
      .set({
        reorderPoint,
        reorderQuantity,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(inventory.productId, productId),
          eq(inventory.shopId, shopId)
        )
      )
      .returning();

    return result[0] ?? null;
  }

  // Stock status helper
  private getStockStatus(
    quantity: number,
    reorderPoint: number
  ): string {
    if (quantity === 0) return 'out_of_stock';
    if (quantity <= reorderPoint) return 'low';
    return 'in_stock';
  }

  // Get low stock items for email alert
async getLowStockItemsForAlert(shopId: string) {
  const allItems = await db
    .select({
      productName: products.name,
      quantity: inventory.quantity,
      reorderPoint: inventory.reorderPoint,
    })
    .from(inventory)
    .innerJoin(
      products,
      and(
        eq(products.productId, inventory.productId),
        eq(products.shopId, shopId),
        eq(products.isActive, true),
        eq(products.productType, 'product'),
        eq(products.trackInventory, true)
      )
    )
    .where(eq(inventory.shopId, shopId));

  return allItems.filter(item =>
    item.quantity <= (item.reorderPoint ?? 0)
  );
}
}