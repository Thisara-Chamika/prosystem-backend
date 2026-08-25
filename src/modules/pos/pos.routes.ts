import { Router } from 'express';
import { PosController } from './pos.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/auth.middleware';
import { setRlsContext } from '../../middlewares/rls.middleware';

const router = Router();
const posController = new PosController();

// Middleware to authenticate and set RLS context for all POS routes
router.use(authenticate);
router.use(setRlsContext);

// Get all transactions
router.get(
  '/',
  posController.getTransactions.bind(posController)
);

// GET /api/pos/return-lookup
router.get(
  '/return-lookup',
  authorize('shop_owner', 'shop_manager', 'cashier'),
  posController.returnLookup.bind(posController)
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