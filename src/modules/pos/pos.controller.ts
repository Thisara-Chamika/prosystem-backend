import { Request, Response } from 'express';
import { PosService } from './pos.service';

const posService = new PosService();

export class PosController {

  // Create transaction
  async createTransaction(req: Request, res: Response): Promise<void> {
    try {
      const shopId = req.user!.shopId!;
      const userId = req.user!.userId;

      const result = await posService.createTransaction(
        req.body,
        shopId,
        userId
      );

      res.status(201).json({
        success: true,
        message: 'Transaction created successfully!',
        data: result,
      });

    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Get all transactions
  async getTransactions(req: Request, res: Response): Promise<void> {
    try {
      const shopId = req.user!.shopId!;
      const filters = {
        status: req.query.status as string,
        paymentMethod: req.query.paymentMethod as string,
        customerId: req.query.customerId as string,
        fromDate: req.query.fromDate as string,
        toDate: req.query.toDate as string,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 10,
      };

      const transactions = await posService.getTransactions(shopId, filters);

      res.status(200).json({
        success: true,
        data: transactions,
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

  // Get single transaction
  async getTransactionById(req: Request, res: Response): Promise<void> {
    try {
      const shopId = req.user!.shopId!;
      const { transactionId } = req.params;

      const transaction = await posService.getTransactionById(
        transactionId,
        shopId
      );

      res.status(200).json({
        success: true,
        data: transaction,
      });

    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Cancel transaction
  async cancelTransaction(req: Request, res: Response): Promise<void> {
    try {
      const shopId = req.user!.shopId!;
      const userId = req.user!.userId;
      const { transactionId } = req.params;

      const result = await posService.cancelTransaction(
        transactionId,
        shopId,
        userId
      );

      res.status(200).json({
        success: true,
        message: 'Transaction cancelled successfully!',
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