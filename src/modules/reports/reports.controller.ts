import { Request, Response } from 'express';
import { ReportsService } from './reports.service';

const reportsService = new ReportsService();

export class ReportsController {

  // GET /api/reports/summary
  async getSummary(req: Request, res: Response): Promise<void> {
    try {
      const shopId = req.user!.shopId!;
      const { fromDate, toDate } = req.query as Record<string, string>;

      const data = await reportsService.getSummary(
        shopId, fromDate, toDate
      );

      res.status(200).json({ success: true, data });

    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // GET /api/reports/daily-sales
  async getDailySales(req: Request, res: Response): Promise<void> {
    try {
      const shopId = req.user!.shopId!;
      const { fromDate, toDate } = req.query as Record<string, string>;

      const data = await reportsService.getDailySales(
        shopId, fromDate, toDate
      );

      res.status(200).json({ success: true, data });

    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // GET /api/reports/top-products
  async getTopProducts(req: Request, res: Response): Promise<void> {
    try {
      const shopId = req.user!.shopId!;
      const { fromDate, toDate, limit } = req.query as Record<string, string>;

      const data = await reportsService.getTopProducts(
        shopId, fromDate, toDate,
        limit ? Number(limit) : 10
      );

      res.status(200).json({ success: true, data });

    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // GET /api/reports/payment-methods
  async getPaymentMethods(req: Request, res: Response): Promise<void> {
    try {
      const shopId = req.user!.shopId!;
      const { fromDate, toDate } = req.query as Record<string, string>;

      const data = await reportsService.getPaymentMethods(
        shopId, fromDate, toDate
      );

      res.status(200).json({ success: true, data });

    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // GET /api/reports/cashier-summary
  async getCashierSummary(req: Request, res: Response): Promise<void> {
    try {
      const shopId = req.user!.shopId!;
      const { fromDate, toDate } = req.query as Record<string, string>;

      const data = await reportsService.getCashierSummary(
        shopId, fromDate, toDate
      );

      res.status(200).json({ success: true, data });

    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}