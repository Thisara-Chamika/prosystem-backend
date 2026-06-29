import { Request, Response } from 'express';
import { LoyaltyService } from './loyalty.service';

const loyaltyService = new LoyaltyService();

export class LoyaltyController {

  // GET /api/loyalty/settings
  async getSettings(req: Request, res: Response): Promise<void> {
    try {
      const shopId = req.user!.shopId!;
      const settings = await loyaltyService.getSettings(shopId);

      res.status(200).json({
        success: true,
        data: settings,
      });

    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // PUT /api/loyalty/settings
  async updateSettings(req: Request, res: Response): Promise<void> {
    try {
      const shopId = req.user!.shopId!;
      const settings = await loyaltyService.updateSettings(
        shopId,
        req.body
      );

      res.status(200).json({
        success: true,
        message: 'Loyalty settings updated successfully!',
        data: settings,
      });

    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // POST /api/loyalty/redeem
  async redeemPoints(req: Request, res: Response): Promise<void> {
    try {
      const shopId = req.user!.shopId!;
      const { customerId, pointsToRedeem } = req.body;

      if (!customerId || !pointsToRedeem) {
        res.status(400).json({
          success: false,
          message: 'customerId and pointsToRedeem are required!',
        });
        return;
      }

      const result = await loyaltyService.redeemPoints(
        customerId,
        shopId,
        Number(pointsToRedeem)
      );

      res.status(200).json({
        success: true,
        message: 'Points redeemed successfully!',
        data: result,
      });

    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // GET /api/customers/:customerId/profile
  async getCustomerProfile(req: Request, res: Response): Promise<void> {
    try {
      const shopId = req.user!.shopId!;
      const { customerId } = req.params;

      const profile = await loyaltyService.getCustomerProfile(
        customerId,
        shopId
      );

      res.status(200).json({
        success: true,
        data: profile,
      });

    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  // GET /api/customers/:customerId/loyalty
  async getCustomerLoyalty(req: Request, res: Response): Promise<void> {
    try {
      const shopId = req.user!.shopId!;
      const { customerId } = req.params;

      const loyalty = await loyaltyService.getCustomerLoyalty(
        customerId,
        shopId
      );

      res.status(200).json({
        success: true,
        data: loyalty,
      });

    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }
}