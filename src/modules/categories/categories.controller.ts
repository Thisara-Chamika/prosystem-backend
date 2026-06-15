import { Request, Response } from 'express';
import { CategoriesService } from './categories.service';

const categoriesService = new CategoriesService();

export class CategoriesController {

  // GET /api/categories
  async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const shopId = req.user!.shopId!;
      const data = await categoriesService.getCategories(shopId);

      res.status(200).json({
        success: true,
        data,
      });

    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // POST /api/categories
  async createCategory(req: Request, res: Response): Promise<void> {
    try {
      const shopId = req.user!.shopId!;
      const data = await categoriesService.createCategory(
        shopId,
        req.body
      );

      res.status(201).json({
        success: true,
        message: 'Category created successfully!',
        data,
      });

    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // PUT /api/categories/:categoryId
  async updateCategory(req: Request, res: Response): Promise<void> {
    try {
      const shopId = req.user!.shopId!;
      const { categoryId } = req.params;

      const data = await categoriesService.updateCategory(
        categoryId,
        shopId,
        req.body
      );

      res.status(200).json({
        success: true,
        message: 'Category updated successfully!',
        data,
      });

    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // DELETE /api/categories/:categoryId
  async deleteCategory(req: Request, res: Response): Promise<void> {
    try {
      const shopId = req.user!.shopId!;
      const { categoryId } = req.params;

      await categoriesService.deleteCategory(categoryId, shopId);

      res.status(200).json({
        success: true,
        message: 'Category deleted successfully!',
      });

    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // PUT /api/categories/reorder
  async reorderCategories(req: Request, res: Response): Promise<void> {
    try {
      const shopId = req.user!.shopId!;
      const { categories } = req.body;

      const data = await categoriesService.reorderCategories(
        shopId,
        categories
      );

      res.status(200).json({
        success: true,
        message: 'Categories reordered successfully!',
        data,
      });

    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}