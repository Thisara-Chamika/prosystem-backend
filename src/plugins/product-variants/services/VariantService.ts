import { db } from '../../../config/database';
import { productVariants } from '../../../db/schema/product-variants';
import { eq, and, gt } from 'drizzle-orm';

export class VariantService {

  // Get all variants for a product
  async getVariantsByProduct(productId: string, shopId: string) {
    return await db
      .select()
      .from(productVariants)
      .where(
        and(
          eq(productVariants.productId, productId),
          eq(productVariants.shopId, shopId),
          eq(productVariants.isActive, true)
        )
      )
      .orderBy(productVariants.size, productVariants.color);
  }

  // Get only variants with stock > 0
  async getAvailableVariants(productId: string, shopId: string) {
    return await db
      .select()
      .from(productVariants)
      .where(
        and(
          eq(productVariants.productId, productId),
          eq(productVariants.shopId, shopId),
          eq(productVariants.isActive, true),
          gt(productVariants.quantity, 0)
        )
      )
      .orderBy(productVariants.size, productVariants.color);
  }

  // Create a new variant
  async createVariant(data: {
    productId: string;
    shopId: string;
    size: string;
    color: string;
    skuVariant?: string;
    priceAdjustment?: number;
    quantity: number;
  }) {
    // Check variant doesn't already exist
    const existing = await db
      .select()
      .from(productVariants)
      .where(
        and(
          eq(productVariants.productId, data.productId),
          eq(productVariants.shopId, data.shopId),
          eq(productVariants.size, data.size),
          eq(productVariants.color, data.color),
          eq(productVariants.isActive, true)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      throw new Error(
        `Variant ${data.size}/${data.color} already exists for this product!`
      );
    }

    const result = await db
      .insert(productVariants)
      .values({
        shopId: data.shopId,
        productId: data.productId,
        size: data.size,
        color: data.color,
        skuVariant: data.skuVariant,
        priceAdjustment: data.priceAdjustment
          ? String(data.priceAdjustment)
          : '0',
        quantity: data.quantity,
        isActive: true,
      })
      .returning();

    return result[0];
  }

  // Update variant
  async updateVariant(
    variantId: string,
    shopId: string,
    data: {
      size?: string;
      color?: string;
      priceAdjustment?: number;
      quantity?: number;
      skuVariant?: string;
    }
  ) {
    const result = await db
      .update(productVariants)
      .set({
        ...data,
        priceAdjustment: data.priceAdjustment
          ? String(data.priceAdjustment)
          : undefined,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(productVariants.variantId, variantId),
          eq(productVariants.shopId, shopId)
        )
      )
      .returning();

    return result[0] ?? null;
  }

  // Soft delete variant
  async deleteVariant(variantId: string, shopId: string) {
    const result = await db
      .update(productVariants)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(productVariants.variantId, variantId),
          eq(productVariants.shopId, shopId)
        )
      )
      .returning();

    return result[0] ?? null;
  }
}

export const variantService = new VariantService();