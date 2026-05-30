import { db } from '../../config/database';
import { categories } from '../../db/schema/categories';
import { products } from '../../db/schema/products';
import { eq, and } from 'drizzle-orm';
import { NewCategory } from '../../db/schema/categories';
import { DEFAULT_CATEGORIES } from '../../enums/categories.enum';

export class CategoriesRepository {

  // Get all active categories for shop
  async getCategories(shopId: string) {
    return await db
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.shopId, shopId),
          eq(categories.isActive, true)
        )
      )
      .orderBy(categories.sortOrder);
  }

  // Get single category
  async getCategoryById(categoryId: string, shopId: string) {
    const result = await db
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.categoryId, categoryId),
          eq(categories.shopId, shopId)
        )
      )
      .limit(1);

    return result[0] ?? null;
  }

  // Create category
  async createCategory(data: NewCategory) {
    const result = await db
      .insert(categories)
      .values(data)
      .returning();

    return result[0];
  }

  // Update category
  async updateCategory(
    categoryId: string,
    shopId: string,
    data: Partial<NewCategory>
  ) {
    const result = await db
      .update(categories)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(categories.categoryId, categoryId),
          eq(categories.shopId, shopId)
        )
      )
      .returning();

    return result[0] ?? null;
  }

  // Soft delete category
  async deleteCategory(categoryId: string, shopId: string) {
    const result = await db
      .update(categories)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(categories.categoryId, categoryId),
          eq(categories.shopId, shopId)
        )
      )
      .returning();

    return result[0] ?? null;
  }

  // Check if products exist with this category name
  async getProductCountByCategory(shopId: string, categoryName: string) {
    const result = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.shopId, shopId),
          eq(products.category, categoryName),
          eq(products.isActive, true)
        )
      );

    return result.length;
  }

  // Reorder categories
  async reorderCategories(
    shopId: string,
    items: { categoryId: string; sortOrder: number }[]
  ) {
    for (const item of items) {
      await db
        .update(categories)
        .set({
          sortOrder: item.sortOrder,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(categories.categoryId, item.categoryId),
            eq(categories.shopId, shopId)
          )
        );
    }
  }

  // ── SEED FUNCTIONS ────────────────────────────────

  // Delete ALL categories for shop (when business type changes)
  async deleteAllCategories(shopId: string) {
    await db
      .delete(categories)
      .where(eq(categories.shopId, shopId));
  }

  // Seed default categories for business type
  async seedDefaultCategories(shopId: string, businessType: string) {
    const defaults = DEFAULT_CATEGORIES[businessType]
      ?? DEFAULT_CATEGORIES['general'];

    for (let i = 0; i < defaults.length; i++) {
      await db
        .insert(categories)
        .values({
          shopId,
          name: defaults[i],
          sortOrder: i + 1,
          isActive: true,
        })
        .onConflictDoNothing();
    }
  }

  // Count categories for shop
  async getCategoryCount(shopId: string) {
    const result = await db
      .select()
      .from(categories)
      .where(eq(categories.shopId, shopId));

    return result.length;
  }
}