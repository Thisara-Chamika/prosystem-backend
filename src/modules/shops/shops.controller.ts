import { Request, Response } from 'express';
import { ShopsService } from './shops.service';

const shopsService = new ShopsService();

export class ShopsController {

  // GET /api/shops/me
  async getMyShop(req: Request, res: Response): Promise<void> {
    try {
      const shopId = req.user!.shopId!;
      const shop = await shopsService.getMyShop(shopId);

      res.status(200).json({
        success: true,
        data: shop,
      });

    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  // PUT /api/shops/business-type
  async updateBusinessType(req: Request, res: Response): Promise<void> {
    try {
      const shopId = req.user!.shopId!;
      const shop = await shopsService.updateBusinessType(shopId, req.body);

      res.status(200).json({
        success: true,
        message: 'Business type updated successfully!',
        data: shop,
      });

    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // GET /api/shops/available-plugins
  async getAvailablePlugins(req: Request, res: Response): Promise<void> {
    try {
      const shopId = req.user!.shopId!;
      const result = await shopsService.getAvailablePlugins(shopId);

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

  // PUT /api/shops/plugins
  async updatePlugin(req: Request, res: Response): Promise<void> {
    try {
      const shopId = req.user!.shopId!;
      const shop = await shopsService.updatePlugin(shopId, req.body);

      res.status(200).json({
        success: true,
        message: `Plugin ${req.body.action === 'add' ? 'activated' : 'deactivated'} successfully!`,
        data: shop,
      });

    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // PUT /api/shops/configuration
  async updateConfiguration(req: Request, res: Response): Promise<void> {
    try {
      const shopId = req.user!.shopId!;
      const shop = await shopsService.updateConfiguration(shopId, req.body);

      res.status(200).json({
        success: true,
        message: 'Configuration updated successfully!',
        data: shop,
      });

    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // GET /api/shops/settings
  async getSettings(req: Request, res: Response): Promise<void> {
    try {
      const shopId = req.user!.shopId!;
      const shop = await shopsService.getSettings(shopId);

      res.status(200).json({
        success: true,
        data: shop,
      });

    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  // PUT /api/shops/settings
  async updateSettings(req: Request, res: Response): Promise<void> {
    try {
      const shopId = req.user!.shopId!;
      const shop = await shopsService.updateSettings(shopId, req.body);

      res.status(200).json({
        success: true,
        message: 'Settings updated successfully!',
        data: shop,
      });

    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}