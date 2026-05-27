import { Router } from 'express';
import { ReturnsController } from './returns.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';

const router = Router({ mergeParams: true });
const returnsController = new ReturnsController();

// All routes require authentication
router.use(authenticate);

// POST /api/transactions/:transactionId/return
router.post(
  '/',
  authorize('shop_owner', 'shop_manager', 'cashier'),
  returnsController.createReturn.bind(returnsController)
);

export default router;