import { InventoryRepository } from './inventory.repository';

const inventoryRepository = new InventoryRepository();

export class InventoryService {

  // Get all inventory
  async getInventory(shopId: string, filters: {
    search?: string;
    category?: string;
    status?: string;
    productType?: string;
    page?: number;
    limit?: number;
  }) {
    return await inventoryRepository.getInventory(shopId, filters);
  }

  // Get low stock items
  async getLowStock(shopId: string, limit: number = 10) {
    // Validate limit
    if (limit > 50) limit = 50;

    return await inventoryRepository.getLowStock(shopId, limit);
  }

  // Update reorder settings
  async updateReorderSettings(
    productId: string,
    shopId: string,
    input: {
      reorderPoint: number;
      reorderQuantity: number;
    }
  ) {
    // Validate inputs
    if (input.reorderPoint < 0) {
      throw new Error('Reorder point cannot be negative!');
    }

    if (input.reorderQuantity < 0) {
      throw new Error('Reorder quantity cannot be negative!');
    }

    const result = await inventoryRepository.updateReorderSettings(
      productId,
      shopId,
      input.reorderPoint,
      input.reorderQuantity
    );

    if (!result) {
      throw new Error('Inventory record not found!');
    }

    return result;
  }
}