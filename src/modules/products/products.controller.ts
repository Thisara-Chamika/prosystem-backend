import { Request, Response } from 'express';
import { ProductsService } from './products.service';

const productsService = new ProductsService();

export class ProductsController {

  // Create product
  async createProduct(req: Request, res: Response): Promise<void> {
    try {
      const shopId = req.user!.shopId!;
      const userId = req.user!.userId;

      const product = await productsService.createProduct(req.body, shopId, userId);

      res.status(201).json({
        success: true,
        message: 'Product created successfully!',
        data: product,
      });

    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Get all products
  async getProducts(req: Request, res: Response): Promise<void> {
    try {
      const shopId = req.user!.shopId!;
      const filters = {
        category: req.query.category as string,
        search: req.query.search as string,
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 10,
         sort: req.query.sort as string ?? 'createdAt',        
  order: (req.query.order as 'asc' | 'desc') ?? 'desc',
      };

      const products = await productsService.getProducts(shopId, filters);

      res.status(200).json({
        success: true,
        data: products,
        pagination: {
          page: filters.page,
          limit: filters.limit,
        },
      });

    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Get single product
  async getProductById(req: Request, res: Response): Promise<void> {
    try {
      const shopId = req.user!.shopId!;
      const { productId } = req.params;

      const product = await productsService.getProductById(productId, shopId);

      res.status(200).json({
        success: true,
        data: product,
      });

    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Get product with inventory
  async getProductWithInventory(req: Request, res: Response): Promise<void> {
    try {
      const shopId = req.user!.shopId!;
      const { productId } = req.params;

      const product = await productsService.getProductWithInventory(productId, shopId);

      res.status(200).json({
        success: true,
        data: product,
      });

    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Update product
  async updateProduct(req: Request, res: Response): Promise<void> {
    try {
      const shopId = req.user!.shopId!;
      const userId = req.user!.userId;
      const { productId } = req.params;

      const product = await productsService.updateProduct(productId, shopId, req.body, userId);

      res.status(200).json({
        success: true,
        message: 'Product updated successfully!',
        data: product,
      });

    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Delete product
  async deleteProduct(req: Request, res: Response): Promise<void> {
    try {
      const shopId = req.user!.shopId!;
      const userId = req.user!.userId;
      const { productId } = req.params;

      await productsService.deleteProduct(productId, shopId, userId);

      res.status(200).json({
        success: true,
        message: 'Product deleted successfully!',
      });

    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Update inventory
  async updateInventory(req: Request, res: Response): Promise<void> {
    try {
      const shopId = req.user!.shopId!;
      const userId = req.user!.userId;
      const { productId } = req.params;
      const { quantity } = req.body;

      const result = await productsService.updateInventory(productId, shopId, quantity, userId);

      res.status(200).json({
        success: true,
        message: 'Inventory updated successfully!',
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