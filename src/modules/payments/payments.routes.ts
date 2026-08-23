import { Router } from 'express';
import { paymentsController } from './payments.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { setRlsContext } from '../../middlewares/rls.middleware';

const router = Router();

// Middleware to authenticate and set RLS context for all payment routes
router.use(authenticate);
router.use(setRlsContext);

// POST /api/payments/create-intent
router.post(
  '/create-intent',
  authorize('shop_owner', 'shop_manager', 'cashier'),
  paymentsController.createIntent.bind(paymentsController)
);

export default router;