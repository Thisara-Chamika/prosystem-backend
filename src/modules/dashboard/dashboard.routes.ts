import { Router } from 'express';
import { DashboardController } from './dashboard.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();
const dashboardController = new DashboardController();

// All routes require authentication
router.use(authenticate);

// GET /api/dashboard/cashier-summary
// Accessible by ALL roles — reads from JWT token!
router.get(
  '/cashier-summary',
  dashboardController.getCashierSummary.bind(dashboardController)
);

export default router;