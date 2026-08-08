import { Router } from 'express';
import { tableController } from './controllers/TableController';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { requirePlugin } from '../../middlewares/plugin.middleware';

const router = Router();

router.use(authenticate);
router.use(requirePlugin('table-management'));

router.get('/tables', tableController.getTables.bind(tableController));

router.post(
  '/tables',
  authorize('shop_owner', 'shop_manager'),
  tableController.createTable.bind(tableController)
);

router.put(
  '/tables/:tableId',
  authorize('shop_owner', 'shop_manager', 'cashier'),
  tableController.updateTable.bind(tableController)
);

router.delete(
  '/tables/:tableId',
  authorize('shop_owner'),
  tableController.deleteTable.bind(tableController)
);

export default router;