import { Router } from 'express';
import { InventoryController } from './inventory.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';

const router = Router();
const inventoryController = new InventoryController();

router.use(authenticate);
router.use(authorize('shop_owner', 'shop_manager'));

// ── IMPORTANT: specific routes BEFORE param routes! ──

// GET /api/inventory/low-stock ← must be before /:productId!
router.get(
  '/low-stock',
  inventoryController.getLowStock.bind(inventoryController)
);

// GET /api/inventory
router.get(
  '/',
  inventoryController.getInventory.bind(inventoryController)
);

// PUT /api/inventory/:productId/reorder
router.put(
  '/:productId/reorder',
  inventoryController.updateReorderSettings.bind(inventoryController)
);

export default router;