import { db } from '../../config/database';
import { products } from '../../db/schema/products';
import { inventory } from '../../db/schema/inventory';
import { eq, and, ilike, or, asc, desc, count } from 'drizzle-orm';
import { NewProduct } from '../../db/schema/products';
import { ProductFilters } from './products.types';

export class ProductsRepository {

  // Create product
  async createProduct(productData: NewProduct, initialStock: number = 0, userId: string) {
    // Create product
    const newProduct = await db
      .insert(products)
      .values({
        ...productData,
        createdBy: userId,
        updatedBy: userId,
      })
      .returning();

    // Services always get quantity=0 regardless of initialStock
    const actualStock = productData.productType === 'service'
      ? 0
      : initialStock;

    // Always create inventory record (even for services!)
    await db
      .insert(inventory)
      .values({
        shopId: productData.shopId,
        productId: newProduct[0].productId,
        quantity: actualStock,  
        updatedBy: userId,
      });

    return newProduct[0];
  }

  // Get all products with filters
  async getProducts(shopId: string, filters: ProductFilters) {
  const limit = filters.limit ?? 10;
  const offset = ((filters.page ?? 1) - 1) * limit;

  const conditions = [eq(products.shopId, shopId)];

  if (filters.isActive !== undefined) {
    conditions.push(eq(products.isActive, filters.isActive));
  }

  if (filters.category) {
    conditions.push(eq(products.category, filters.category));
  }

  if (filters.search) {
    conditions.push(
      or(
        ilike(products.name, `%${filters.search}%`),
        ilike(products.sku, `%${filters.search}%`)
      )!
    );
  }

  if (filters.productType) {
  conditions.push(eq(products.productType, filters.productType));
}

  const columnMap: Record<string, any> = {
    createdAt: products.createdAt,
    updatedAt: products.updatedAt,
    name: products.name,
    price: products.price,
    sku: products.sku,
  };

  const sortColumn = filters.sort ?? 'createdAt';
  const sortOrder = filters.order ?? 'desc';
  const column = columnMap[sortColumn] ?? products.createdAt;
  const orderBy = sortOrder === 'asc' ? asc(column) : desc(column);

  // ── COUNT query ───────────────────────────────
  const countResult = await db
    .select({ count: count() })
    .from(products)
    .where(and(...conditions));

  const total = Number(countResult[0]?.count ?? 0);
  // ─────────────────────────────────────────────

  const data = await db
    .select()
    .from(products)
    .where(and(...conditions))
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);

  return { data, total };
}

  // Get single product
  async getProductById(productId: string, shopId: string) {
    const result = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.productId, productId),
          eq(products.shopId, shopId)
        )
      )
      .limit(1);

    return result[0] ?? null;
  }

  // Get product by SKU
  async getProductBySku(sku: string, shopId: string) {
    const result = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.sku, sku),
          eq(products.shopId, shopId)
        )
      )
      .limit(1);

    return result[0] ?? null;
  }

  // Update product
  async updateProduct(productId: string, shopId: string, data: Partial<NewProduct>, userId: string) {
    // Auto update trackInventory when productType changes
    if (data.productType === 'service') {
      data.trackInventory = false;  
    } else if (data.productType === 'product') {
      data.trackInventory = true;   
    }

    const result = await db
      .update(products)
      .set({
        ...data,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(products.productId, productId),
          eq(products.shopId, shopId)
        )
      )
      .returning();

    return result[0] ?? null;
  }

  // Delete product (soft delete)
  async deleteProduct(productId: string, shopId: string, userId: string) {
    const result = await db
      .update(products)
      .set({
        isActive: false,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(products.productId, productId),
          eq(products.shopId, shopId)
        )
      )
      .returning();

    return result[0] ?? null;
  }

  // Get inventory for product
  async getProductInventory(productId: string, shopId: string) {
    const result = await db
      .select()
      .from(inventory)
      .where(
        and(
          eq(inventory.productId, productId),
          eq(inventory.shopId, shopId)
        )
      )
      .limit(1);

    return result[0] ?? null;
  }

  // Get all products WITH inventory (for ?include=inventory)
async getProductsWithInventory(shopId: string, filters: ProductFilters) {
  const limit = filters.limit ?? 10;
  const offset = ((filters.page ?? 1) - 1) * limit;

  const conditions = [eq(products.shopId, shopId)];

  if (filters.isActive !== undefined) {
    conditions.push(eq(products.isActive, filters.isActive));
  }

  if (filters.category) {
    conditions.push(eq(products.category, filters.category));
  }

  if (filters.search) {
    conditions.push(
      or(
        ilike(products.name, `%${filters.search}%`),
        ilike(products.sku, `%${filters.search}%`)
      )!
    );
  }

  const columnMap: Record<string, any> = {
    createdAt: products.createdAt,
    updatedAt: products.updatedAt,
    name: products.name,
    price: products.price,
    sku: products.sku,
  };

  const sortColumn = filters.sort ?? 'createdAt';
  const sortOrder = filters.order ?? 'desc';
  const column = columnMap[sortColumn] ?? products.createdAt;
  const orderBy = sortOrder === 'asc' ? asc(column) : desc(column);

  // COUNT with same conditions
  const countResult = await db
    .select({ count: count() })
    .from(products)
    .where(and(...conditions));

  const total = Number(countResult[0]?.count ?? 0);

  // Join products with inventory
  const result = await db
    .select({
      productId: products.productId,
      shopId: products.shopId,
      sku: products.sku,
      barcode: products.barcode,
      name: products.name,
      description: products.description,
      category: products.category,
      price: products.price,
      cost: products.cost,
      taxRate: products.taxRate,
      trackInventory: products.trackInventory,
      isActive: products.isActive,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
      createdBy: products.createdBy,
      updatedBy: products.updatedBy,
      inventoryId: inventory.inventoryId,
      quantity: inventory.quantity,
      reserved: inventory.reserved,
      reorderPoint: inventory.reorderPoint,
      reorderQuantity: inventory.reorderQuantity,
    })
    .from(products)
    .leftJoin(
      inventory,
      and(
        eq(inventory.productId, products.productId),
        eq(inventory.shopId, products.shopId)
      )
    )
    .where(and(...conditions))
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);

  // Shape response
  const data = result.map(row => ({
    productId: row.productId,
    shopId: row.shopId,
    sku: row.sku,
    barcode: row.barcode,
    name: row.name,
    description: row.description,
    category: row.category,
    price: row.price,
    cost: row.cost,
    taxRate: row.taxRate,
    trackInventory: row.trackInventory,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
    inventory: row.inventoryId ? {
      inventoryId: row.inventoryId,
      quantity: row.quantity,
      reserved: row.reserved,
      available: (row.quantity ?? 0) - (row.reserved ?? 0),
      reorderPoint: row.reorderPoint,
      reorderQuantity: row.reorderQuantity,
    } : null,
  }));

  return { data, total };
}

  // Update inventory
  async updateInventory(productId: string, shopId: string, quantity: number, userId: string) {
    const result = await db
      .update(inventory)
      .set({
        quantity,
        updatedBy: userId,
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
}