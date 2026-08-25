import { Router } from "express";
import { AdminController } from "./admin.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { requireSuperAdmin } from "../../middlewares/requireSuperAdmin.middleware";
import { setRlsContext } from "../../middlewares/rls.middleware";

const router = Router();
const adminController = new AdminController();

router.use(authenticate);
router.use(requireSuperAdmin);
router.use(setRlsContext);

router.get("/metrics", adminController.getMetrics.bind(adminController));
router.get("/shops", adminController.getShops.bind(adminController));
router.put(
  "/shops/:shopId/status",
  adminController.updateShopStatus.bind(adminController),
);
router.get(
  "/support-tickets",
  adminController.getSupportTickets.bind(adminController),
);
router.get(
  "/support-tickets/:ticketId",
  adminController.getSupportTicketById.bind(adminController),
);
router.post(
  "/support-tickets/:ticketId/messages",
  adminController.addAdminMessage.bind(adminController),
);
router.put(
  "/support-tickets/:ticketId/status",
  adminController.updateTicketStatus.bind(adminController),
);

export default router;