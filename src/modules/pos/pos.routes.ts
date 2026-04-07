import { Router } from 'express';
import { PosController } from './pos.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/auth.middleware';

const router = Router();
const posController = new PosController();

// All routes require authentication
router.use(authenticate);

// Get all transactions
router.get(
  '/',
  authorize('shop_owner', 'shop_manager'),
  posController.getTransactions.bind(posController)
);

// Get single transaction
router.get(
  '/:transactionId',
  posController.getTransactionById.bind(posController)
);

// Create transaction (cashier can create)
router.post(
  '/',
  authorize('shop_owner', 'shop_manager', 'cashier'),
  posController.createTransaction.bind(posController)
);

// Cancel transaction
router.patch(
  '/:transactionId/cancel',
  authorize('shop_owner', 'shop_manager'),
  posController.cancelTransaction.bind(posController)
);

export default router;