import { Router } from 'express';
import { variantController } from './controllers/VariantController';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { requirePlugin } from '../../middlewares/plugin.middleware';

const router = Router();

// All routes need auth + fashion plugin active!
router.use(authenticate);
router.use(requirePlugin('fashion-shop'));

// ── GET routes ────────────────────────────────────
// Get available variants ← must be before /:productId/variants!
router.get(
  '/products/:productId/variants/available',
  variantController.getAvailableVariants.bind(variantController)
);

// Get all variants
router.get(
  '/products/:productId/variants',
  variantController.getVariants.bind(variantController)
);

// ── POST routes ───────────────────────────────────
// Create variant
router.post(
  '/products/:productId/variants',
  authorize('shop_owner', 'shop_manager'),
  variantController.createVariant.bind(variantController)
);

// ── PUT routes ────────────────────────────────────
// Update variant
router.put(
  '/variants/:variantId',
  authorize('shop_owner', 'shop_manager'),
  variantController.updateVariant.bind(variantController)
);

// ── DELETE routes ─────────────────────────────────
// Delete variant
router.delete(
  '/variants/:variantId',
  authorize('shop_owner'),
  variantController.deleteVariant.bind(variantController)
);

export default router;