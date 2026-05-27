import { Request, Response } from 'express';
import { DashboardService } from './dashboard.service';

const dashboardService = new DashboardService();

export class DashboardController {

  // GET /api/dashboard/cashier-summary
  async getCashierSummary(req: Request, res: Response): Promise<void> {
    try {
      const cashierId = req.user!.userId;  // ← from JWT!
      const shopId = req.user!.shopId!;

      const summary = await dashboardService.getCashierSummary(
        cashierId,
        shopId
      );

      res.status(200).json({
        success: true,
        data: summary,
      });

    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}