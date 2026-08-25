import { Router } from 'express';
import { DashboardController } from './dashboard.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { setRlsContext } from '../../middlewares/rls.middleware';

const router = Router();
const dashboardController = new DashboardController();

// Middleware to authenticate and set RLS context for all dashboard routes
router.use(authenticate);
router.use(setRlsContext);

// GET /api/dashboard/cashier-summary
// Accessible by ALL roles — reads from JWT token!
router.get(
  '/cashier-summary',
  dashboardController.getCashierSummary.bind(dashboardController)
);

export default router;