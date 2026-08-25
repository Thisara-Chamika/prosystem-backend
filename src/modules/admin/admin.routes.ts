import { Router } from 'express';
import { AdminController } from './admin.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireSuperAdmin } from '../../middlewares/requireSuperAdmin.middleware';
import { setRlsContext } from '../../middlewares/rls.middleware';

const router = Router();
const adminController = new AdminController();

router.use(authenticate);
router.use(requireSuperAdmin);
router.use(setRlsContext);

router.get('/metrics', adminController.getMetrics.bind(adminController));

export default router;