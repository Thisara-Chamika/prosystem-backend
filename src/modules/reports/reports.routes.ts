import { Router } from 'express';
import { ReportsController } from './reports.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';

const router = Router();
const reportsController = new ReportsController();

// All routes require authentication + owner/manager only
router.use(authenticate);
router.use(authorize('shop_owner', 'shop_manager'));

// GET /api/reports/summary
router.get(
  '/summary',
  reportsController.getSummary.bind(reportsController)
);

// GET /api/reports/daily-sales
router.get(
  '/daily-sales',
  reportsController.getDailySales.bind(reportsController)
);

// GET /api/reports/top-products
router.get(
  '/top-products',
  reportsController.getTopProducts.bind(reportsController)
);

// GET /api/reports/payment-methods
router.get(
  '/payment-methods',
  reportsController.getPaymentMethods.bind(reportsController)
);

// GET /api/reports/cashier-summary
router.get(
  '/cashier-summary',
  reportsController.getCashierSummary.bind(reportsController)
);

export default router;