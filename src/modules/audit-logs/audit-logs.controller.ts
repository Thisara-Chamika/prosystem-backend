import { Request, Response } from 'express';
import { AuditLogsService } from './audit-logs.service';

const auditLogsService = new AuditLogsService();

export class AuditLogsController {

  // GET /api/audit-logs
  async getAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const shopId = req.user!.shopId!;
      const filters = {
        action: req.query.action as string,
        userId: req.query.userId as string,
        entityType: req.query.entityType as string,
        fromDate: req.query.fromDate as string,
        toDate: req.query.toDate as string,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 20,
      };

      const result = await auditLogsService.getAuditLogs(shopId, filters);

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

  // GET /api/audit-logs/summary
  async getSummary(req: Request, res: Response): Promise<void> {
    try {
      const shopId = req.user!.shopId!;
      const result = await auditLogsService.getSummary(shopId);

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
}