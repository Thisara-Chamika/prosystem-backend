import { Router } from 'express';
import { InventoryController } from './inventory.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';

const router = Router();
const inventoryController = new InventoryController();

router.use(authenticate);

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