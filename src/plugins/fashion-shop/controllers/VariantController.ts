import { Request, Response } from 'express';
import { variantService } from '../services/VariantService';

export class VariantController {

  // GET /api/plugins/fashion/products/:productId/variants
  async getVariants(req: Request, res: Response): Promise<void> {
    try {
      const { productId } = req.params;
      const shopId = req.user!.shopId!;

      const variants = await variantService.getVariantsByProduct(
        productId,
        shopId
      );

      res.status(200).json({
        success: true,
        data: variants,
      });

    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // GET /api/plugins/fashion/products/:productId/variants/available
  async getAvailableVariants(req: Request, res: Response): Promise<void> {
    try {
      const { productId } = req.params;
      const shopId = req.user!.shopId!;

      const variants = await variantService.getAvailableVariants(
        productId,
        shopId
      );

      res.status(200).json({
        success: true,
        data: variants,
      });

    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // POST /api/plugins/fashion/products/:productId/variants
  async createVariant(req: Request, res: Response): Promise<void> {
    try {
      const { productId } = req.params;
      const shopId = req.user!.shopId!;

      const variant = await variantService.createVariant({
        productId,
        shopId,
        ...req.body,
      });

      res.status(201).json({
        success: true,
        message: 'Variant created successfully!',
        data: variant,
      });

    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // PUT /api/plugins/fashion/variants/:variantId
  async updateVariant(req: Request, res: Response): Promise<void> {
    try {
      const { variantId } = req.params;
      const shopId = req.user!.shopId!;

      const variant = await variantService.updateVariant(
        variantId,
        shopId,
        req.body
      );

      res.status(200).json({
        success: true,
        message: 'Variant updated successfully!',
        data: variant,
      });

    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // DELETE /api/plugins/fashion/variants/:variantId
  async deleteVariant(req: Request, res: Response): Promise<void> {
    try {
      const { variantId } = req.params;
      const shopId = req.user!.shopId!;

      await variantService.deleteVariant(variantId, shopId);

      res.status(200).json({
        success: true,
        message: 'Variant deleted successfully!',
      });

    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}

export const variantController = new VariantController();