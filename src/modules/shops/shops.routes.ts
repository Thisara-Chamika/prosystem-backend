import { Router } from 'express';
import { ShopsController } from './shops.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';

const router = Router();
const shopsController = new ShopsController();

// All routes require authentication
router.use(authenticate);

// ── GET routes ────────────────────────────────────
// Get current shop details
router.get(
  '/me',
  shopsController.getMyShop.bind(shopsController)
);

// Get available plugins for shop's business type
router.get(
  '/available-plugins',
  shopsController.getAvailablePlugins.bind(shopsController)
);

// Get shop settings
router.get(
  '/settings',
  shopsController.getSettings.bind(shopsController)
);

// ── PUT routes ────────────────────────────────────
// Update business type (shop_owner only)
router.put(
  '/business-type',
  authorize('shop_owner'),
  shopsController.updateBusinessType.bind(shopsController)
);

// Update plugins (shop_owner only)
router.put(
  '/plugins',
  authorize('shop_owner'),
  shopsController.updatePlugin.bind(shopsController)
);

// Update configuration (shop_owner only)
router.put(
  '/configuration',
  authorize('shop_owner'),
  shopsController.updateConfiguration.bind(shopsController)
);

// Update settings (shop_owner only)
router.put(
  '/settings',
  authorize('shop_owner'),
  shopsController.updateSettings.bind(shopsController)
);

// Complete onboarding (shop_owner only)
router.post(
  '/complete-onboarding',
  authorize('shop_owner'),
  shopsController.completeOnboarding.bind(shopsController)
);

export default router;