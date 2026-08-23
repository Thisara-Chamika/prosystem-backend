import { Router } from 'express';
import { InventoryController } from './inventory.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { setRlsContext } from '../../middlewares/rls.middleware';

const router = Router();
const inventoryController = new InventoryController();

// Middleware to authenticate and set RLS context for all inventory routes
router.use(authenticate);
router.use(setRlsContext);

// GET /api/inventory/low-stock
router.get(
  '/low-stock',
  authorize('shop_owner', 'shop_manager'),  
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
  authorize('shop_owner', 'shop_manager'),
  inventoryController.updateReorderSettings.bind(inventoryController)
);

export default router;