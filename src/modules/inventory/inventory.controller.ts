import { Request, Response } from 'express';
import { InventoryService } from './inventory.service';

const inventoryService = new InventoryService();

export class InventoryController {

  // GET /api/inventory
  async getInventory(req: Request, res: Response): Promise<void> {
    try {
      const shopId = req.user!.shopId!;
      const filters = {
        search: req.query.search as string,
        category: req.query.category as string,
        status: req.query.status as string,
        productType: req.query.productType as string,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 10,
      };

      const result = await inventoryService.getInventory(shopId, filters);

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / filters.limit),
        },
      });

    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // GET /api/inventory/low-stock
  async getLowStock(req: Request, res: Response): Promise<void> {
    try {
      const shopId = req.user!.shopId!;
      const limit = req.query.limit ? Number(req.query.limit) : 10;

      const result = await inventoryService.getLowStock(shopId, limit);

      res.status(200).json({
        success: true,
        data: result,
      });

    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // PUT /api/inventory/:productId/reorder
  async updateReorderSettings(req: Request, res: Response): Promise<void> {
    try {
      const shopId = req.user!.shopId!;
      const { productId } = req.params;

      const result = await inventoryService.updateReorderSettings(
        productId,
        shopId,
        req.body
      );

      res.status(200).json({
        success: true,
        message: 'Reorder settings updated successfully!',
        data: result,
      });

    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}