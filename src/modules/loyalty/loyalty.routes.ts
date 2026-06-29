import { Router } from 'express';
import { LoyaltyController } from './loyalty.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';

const router = Router();
const loyaltyController = new LoyaltyController();

router.use(authenticate);

// ── Settings ──────────────────────────────────────
// GET /api/loyalty/settings
router.get(
  '/settings',
  authorize('shop_owner', 'shop_manager'),
  loyaltyController.getSettings.bind(loyaltyController)
);

// PUT /api/loyalty/settings
router.put(
  '/settings',
  authorize('shop_owner'),
  loyaltyController.updateSettings.bind(loyaltyController)
);

// ── Redeem ────────────────────────────────────────
// POST /api/loyalty/redeem
router.post(
  '/redeem',
  loyaltyController.redeemPoints.bind(loyaltyController)
);

export default router;