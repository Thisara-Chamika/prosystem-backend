import { Router } from 'express';
import { paymentsController } from './payments.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

// POST /api/payments/create-intent
router.post(
  '/create-intent',
  authorize('shop_owner', 'shop_manager', 'cashier'),
  paymentsController.createIntent.bind(paymentsController)
);

export default router;