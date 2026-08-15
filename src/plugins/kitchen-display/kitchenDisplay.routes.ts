import { Router } from "express";
import { kitchenController } from "./controllers/KitchenController";
import { authenticate } from "../../middlewares/auth.middleware";
import { requirePlugin } from "../../middlewares/plugin.middleware";

const router = Router();

router.use(authenticate);
router.use(requirePlugin("kitchen-display"));

router.get("/queue", kitchenController.getQueue.bind(kitchenController));
router.patch(
  "/items/:orderItemId/status",
  kitchenController.updateItemStatus.bind(kitchenController),
);

export default router;
