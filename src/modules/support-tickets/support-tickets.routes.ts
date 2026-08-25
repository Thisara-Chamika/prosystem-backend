import { Router } from "express";
import { SupportTicketsController } from "./support-tickets.controller";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import { setRlsContext } from "../../middlewares/rls.middleware";

const router = Router();
const supportTicketsController = new SupportTicketsController();

router.use(authenticate);
router.use(setRlsContext);

router.post(
  "/",
  authorize("shop_owner", "shop_manager"),
  supportTicketsController.createTicket.bind(supportTicketsController),
);
router.get(
  "/",
  authorize("shop_owner", "shop_manager"),
  supportTicketsController.getTickets.bind(supportTicketsController),
);
router.get(
  "/:ticketId",
  authorize("shop_owner", "shop_manager"),
  supportTicketsController.getTicketById.bind(supportTicketsController),
);
router.post(
  "/:ticketId/messages",
  authorize("shop_owner", "shop_manager"),
  supportTicketsController.addMessage.bind(supportTicketsController),
);

export default router;