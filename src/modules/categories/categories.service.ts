import { CategoriesRepository } from './categories.repository';

const categoriesRepository = new CategoriesRepository();

export class CategoriesService {

  // Get all categories
  async getCategories(shopId: string) {
    return await categoriesRepository.getCategories(shopId);
  }

  // Create category
  async createCategory(shopId: string, input: {
    name: string;
    description?: string;
    sortOrder?: number;
  }) {
    return await categoriesRepository.createCategory({
      shopId,
      name: input.name,
      description: input.description,
      sortOrder: input.sortOrder ?? 0,
      isActive: true,
    });
  }

  // Update category
  async updateCategory(
    categoryId: string,
    shopId: string,
    input: {
      name?: string;
      description?: string;
      sortOrder?: number;
    }
  ) {
    const existing = await categoriesRepository
      .getCategoryById(categoryId, shopId);

    if (!existing) {
      throw new Error('Category not found!');
    }

    return await categoriesRepository.updateCategory(
      categoryId,
      shopId,
      input
    );
  }

  // Delete category
  async deleteCategory(categoryId: string, shopId: string) {
    // Check category exists
    const existing = await categoriesRepository
      .getCategoryById(categoryId, shopId);

    if (!existing) {
      throw new Error('Category not found!');
    }

    // Check if products are using this category
    const productCount = await categoriesRepository
      .getProductCountByCategory(shopId, existing.name);

    if (productCount > 0) {
      throw new Error(
        `Cannot delete category — ${productCount} product${productCount > 1 ? 's are' : ' is'} using it!`
      );
    }

    return await categoriesRepository.deleteCategory(categoryId, shopId);
  }

  // Reorder categories
  async reorderCategories(
    shopId: string,
    items: { categoryId: string; sortOrder: number }[]
  ) {
    if (!items || items.length === 0) {
      throw new Error('No categories provided to reorder!');
    }

    await categoriesRepository.reorderCategories(shopId, items);
    return await categoriesRepository.getCategories(shopId);
  }

  // Seed categories when business type changes
  async seedCategoriesForBusinessType(
    shopId: string,
    businessType: string
  ) {
    // Delete ALL existing categories first (Option B!)
    await categoriesRepository.deleteAllCategories(shopId);

    // Seed fresh categories for new business type
    await categoriesRepository.seedDefaultCategories(shopId, businessType);

    return await categoriesRepository.getCategories(shopId);
  }

  // Seed if shop has no categories yet
  async seedIfEmpty(shopId: string, businessType: string) {
    const count = await categoriesRepository.getCategoryCount(shopId);

    if (count === 0) {
      await categoriesRepository.seedDefaultCategories(
        shopId,
        businessType
      );
    }
  }
}