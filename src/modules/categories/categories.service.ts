import { CategoriesRepository } from './categories.repository';
import { createAuditLog } from '../../utils/audit.utils';
import { AuditAction } from '../../enums/audit-actions.enum';

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
  }, userId: string) { 

    // Create first!
    const category = await categoriesRepository.createCategory({
      shopId,
      name: input.name,
      description: input.description,
      sortOrder: input.sortOrder ?? 0,
      isActive: true,
    });

    // Audit Log
    await createAuditLog({
      shopId,
      userId,
      action: AuditAction.CATEGORY_CREATED,
      entityType: 'category',
      entityId: category.categoryId,
      details: {
        name: input.name,
      },
    });

    return category;
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
  async deleteCategory(
    categoryId: string,
    shopId: string,
    userId: string  
  ) {
    const existing = await categoriesRepository
      .getCategoryById(categoryId, shopId);

    if (!existing) {
      throw new Error('Category not found!');
    }

    const productCount = await categoriesRepository
      .getProductCountByCategory(shopId, existing.name);

    if (productCount > 0) {
      throw new Error(
        `Cannot delete category — ${productCount} product${productCount > 1 ? 's are' : ' is'} using it!`
      );
    }

    // Delete first!
    const result = await categoriesRepository
      .deleteCategory(categoryId, shopId);

    // Audit log
    await createAuditLog({
      shopId,
      userId,
      action: AuditAction.CATEGORY_DELETED,
      entityType: 'category',
      entityId: categoryId,
      details: {
        name: existing.name,
      },
    });

    return result;
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
    await categoriesRepository.deleteAllCategories(shopId);
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