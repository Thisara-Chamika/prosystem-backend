import { Router } from 'express';
import { ReturnsController } from './returns.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { setRlsContext } from '../../middlewares/rls.middleware';

const router = Router({ mergeParams: true });
const returnsController = new ReturnsController();

// Middleware to authenticate and set RLS context for all return routes
router.use(authenticate);
router.use(setRlsContext);

// POST /api/transactions/:transactionId/return
router.post(
  '/',
  authorize('shop_owner', 'shop_manager', 'cashier'),
  returnsController.createReturn.bind(returnsController)
);

export default router;