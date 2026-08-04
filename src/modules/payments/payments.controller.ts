import { Request, Response } from 'express';
import { paymentsService } from './payments.service';

export class PaymentsController {

  // POST /api/payments/create-intent
  async createIntent(req: Request, res: Response): Promise<void> {
    try {
      const shopId = req.user!.shopId!;
      const { amount } = req.body;

      const result = await paymentsService.createPaymentIntent(amount, shopId);

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

export const paymentsController = new PaymentsController();