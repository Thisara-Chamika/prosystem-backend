import { Router } from "express";
import { ReportsController } from "./reports.controller";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import { setRlsContext } from "../../middlewares/rls.middleware";

const router = Router();
const reportsController = new ReportsController();

// Middleware to authenticate, set RLS context, and authorize for all report routes
router.use(authenticate);
router.use(setRlsContext);
router.use(authorize("shop_owner", "shop_manager"));

// GET /api/reports/summary
router.get("/summary", reportsController.getSummary.bind(reportsController));

// GET /api/reports/daily-sales
router.get(
  "/daily-sales",
  reportsController.getDailySales.bind(reportsController),
);

// GET /api/reports/top-products
router.get(
  "/top-products",
  reportsController.getTopProducts.bind(reportsController),
);

// GET /api/reports/payment-methods
router.get(
  "/payment-methods",
  reportsController.getPaymentMethods.bind(reportsController),
);

// GET /api/reports/cashier-summary
router.get(
  "/cashier-summary",
  reportsController.getCashierSummary.bind(reportsController),
);

// GET /api/reports/revenue-trends
router.get(
  "/revenue-trends",
  reportsController.getRevenueTrends.bind(reportsController),
);

// GET /api/reports/customer-analytics
router.get(
  "/customer-analytics",
  reportsController.getCustomerAnalytics.bind(reportsController),
);

// GET /api/reports/inventory-valuation
router.get(
  '/inventory-valuation',
  reportsController.getInventoryValuation.bind(reportsController)
);

// GET /api/reports/returns-analysis
router.get(
  '/returns-analysis',
  reportsController.getReturnsAnalysis.bind(reportsController)
);

// GET /api/reports/export
router.get(
  '/export',
  reportsController.exportReport.bind(reportsController)
);

export default router;
