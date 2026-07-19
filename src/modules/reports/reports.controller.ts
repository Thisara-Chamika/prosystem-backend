import { Request, Response } from "express";
import { ReportsService } from "./reports.service";
import PDFDocument from 'pdfkit';
import { ShopsRepository } from '../shops/shops.repository';

const shopsRepository = new ShopsRepository();
const reportsService = new ReportsService();

export class ReportsController {
  // GET /api/reports/summary
  async getSummary(req: Request, res: Response): Promise<void> {
    try {
      const shopId = req.user!.shopId!;
      const { fromDate, toDate } = req.query as Record<string, string>;

      const data = await reportsService.getSummary(shopId, fromDate, toDate);

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

      const data = await reportsService.getDailySales(shopId, fromDate, toDate);

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
        shopId,
        fromDate,
        toDate,
        limit ? Number(limit) : 10,
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
        shopId,
        fromDate,
        toDate,
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
        shopId,
        fromDate,
        toDate,
      );

      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // GET /api/reports/revenue-trends
  async getRevenueTrends(req: Request, res: Response): Promise<void> {
    try {
      const shopId = req.user!.shopId!;
      const period =
        (req.query.period as "week" | "month" | "quarter") ?? "month";

      const data = await reportsService.getRevenueTrends(shopId, period);

      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // GET /api/reports/customer-analytics
  async getCustomerAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const shopId = req.user!.shopId!;
      const { fromDate, toDate } = req.query as Record<string, string>;

      const data = await reportsService.getCustomerAnalytics(
        shopId,
        fromDate,
        toDate,
      );

      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // GET /api/reports/inventory-valuation
  async getInventoryValuation(req: Request, res: Response): Promise<void> {
    try {
      const shopId = req.user!.shopId!;
      const data = await reportsService.getInventoryValuation(shopId);

      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // GET /api/reports/returns-analysis
  async getReturnsAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const shopId = req.user!.shopId!;
      const { fromDate, toDate } = req.query as Record<string, string>;

      const data = await reportsService.getReturnsAnalysis(
        shopId,
        fromDate,
        toDate,
      );

      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // GET /api/reports/export
  async exportReport(req: Request, res: Response): Promise<void> {
  try {
    const shopId = req.user!.shopId!;
    const type = req.query.type as string;
    const format = req.query.format as 'csv' | 'pdf';
    const { fromDate, toDate } = req.query as Record<string, string>;

    if (!type || !format) {
      res.status(400).json({
        success: false,
        message: 'type and format query params are required!',
      });
      return;
    }

    let data: any;
    let reportTitle: string;

    switch (type) {
      case 'revenue-trends':
        data = await reportsService.getRevenueTrends(
          shopId,
          (req.query.period as 'week' | 'month' | 'quarter') ?? 'month'
        );
        reportTitle = 'Revenue Trends';
        break;
      case 'customer-analytics':
        data = await reportsService.getCustomerAnalytics(shopId, fromDate, toDate);
        reportTitle = 'Customer Analytics';
        break;
      case 'inventory-valuation':
        data = await reportsService.getInventoryValuation(shopId);
        reportTitle = 'Inventory Valuation';
        break;
      case 'returns-analysis':
        data = await reportsService.getReturnsAnalysis(shopId, fromDate, toDate);
        reportTitle = 'Returns & Refunds Analysis';
        break;
      default:
        res.status(400).json({
          success: false,
          message: `Unknown report type: ${type}`,
        });
        return;
    }

    const dateStamp = new Date().toISOString().split('T')[0];
    const filename = `${type}-${dateStamp}.${format}`;

    if (format === 'csv') {
      const csv = reportsService.exportToCsv(type, data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(csv);
      return;
    }

    if (format === 'pdf') {
      const shop = await shopsRepository.getShopById(shopId);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      const doc = new PDFDocument({ margin: 50 });
      doc.pipe(res);

      // Header — shop branding
      doc.fontSize(18).text(shop?.name ?? 'ProSystem', { align: 'left' });
      doc.fontSize(14).fillColor('#555').text(reportTitle);
      doc.fontSize(10).fillColor('#888').text(`Generated: ${new Date().toLocaleString()}`);
      doc.moveDown(1.5);
      doc.fillColor('#000');

      // Body — flatten the data simply, section by section
      const renderValue = (key: string, value: any, indent = 0) => {
        const prefix = '  '.repeat(indent);
        if (Array.isArray(value)) {
          doc.fontSize(12).text(`${prefix}${key}:`, { underline: true });
          for (const item of value) {
            if (typeof item === 'object') {
              const line = Object.entries(item).map(([k, v]) => `${k}: ${v}`).join('  |  ');
              doc.fontSize(9).text(`${prefix}  - ${line}`);
            } else {
              doc.fontSize(9).text(`${prefix}  - ${item}`);
            }
          }
          doc.moveDown(0.5);
        } else if (typeof value === 'object' && value !== null) {
          doc.fontSize(12).text(`${prefix}${key}:`, { underline: true });
          for (const [k, v] of Object.entries(value)) {
            renderValue(k, v, indent + 1);
          }
          doc.moveDown(0.3);
        } else {
          doc.fontSize(10).text(`${prefix}${key}: ${value}`);
        }
      };

      for (const [key, value] of Object.entries(data)) {
        renderValue(key, value);
      }

      doc.end();
      return;
    }

    res.status(400).json({
      success: false,
      message: 'format must be csv or pdf!',
    });

  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
}
}
