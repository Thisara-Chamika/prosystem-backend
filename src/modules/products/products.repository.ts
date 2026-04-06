import { db } from '../../config/database';
import { products } from '../../db/schema/products';
import { inventory } from '../../db/schema/inventory';
import { eq, and, ilike, or } from 'drizzle-orm';
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

    // Create inventory record
    await db
      .insert(inventory)
      .values({
        shopId: productData.shopId,
        productId: newProduct[0].productId,
        quantity: initialStock,
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

    const result = await db
      .select()
      .from(products)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset);

    return result;
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