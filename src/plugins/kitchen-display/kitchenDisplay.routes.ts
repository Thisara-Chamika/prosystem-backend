import { Router } from "express";
import { kitchenController } from "./controllers/KitchenController";
import { authenticate } from "../../middlewares/auth.middleware";
import { requirePlugin } from "../../middlewares/plugin.middleware";
import { setRlsContext } from "../../middlewares/rls.middleware";

const router = Router();

// Middleware to authenticate, set RLS context, and require the kitchen-display plugin for all kitchen display routes
router.use(authenticate);
router.use(setRlsContext);
router.use(requirePlugin("kitchen-display"));

router.get("/queue", kitchenController.getQueue.bind(kitchenController));
router.patch(
  "/items/:orderItemId/status",
  kitchenController.updateItemStatus.bind(kitchenController),
);

export default router;
