import { Request, Response } from 'express';
import { ReturnsService } from './returns.service';

const returnsService = new ReturnsService();

export class ReturnsController {

  // POST /api/transactions/:transactionId/return
  async createReturn(req: Request, res: Response): Promise<void> {
    try {
      const shopId = req.user!.shopId!;
      const userId = req.user!.userId;
      const userRole = req.user!.role;
      const { transactionId } = req.params;

      const result = await returnsService.createReturn(
        transactionId,
        shopId,
        userId,
        userRole,
        req.body
      );

      res.status(201).json({
        success: true,
        message: 'Return processed successfully!',
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