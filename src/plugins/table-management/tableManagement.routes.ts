import { Router } from "express";
import { tableController } from "./controllers/TableController";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import { requirePlugin } from "../../middlewares/plugin.middleware";
import { orderController } from "./controllers/OrderController";

const router = Router();

router.use(authenticate);
router.use(requirePlugin("table-management"));

// Table routes
router.get("/tables", tableController.getTables.bind(tableController));

router.post(
  "/tables",
  authorize("shop_owner", "shop_manager"),
  tableController.createTable.bind(tableController),
);

router.put(
  "/tables/:tableId",
  authorize("shop_owner", "shop_manager", "cashier"),
  tableController.updateTable.bind(tableController),
);

router.delete(
  "/tables/:tableId",
  authorize("shop_owner"),
  tableController.deleteTable.bind(tableController),
);

// Order routes
router.post(
  "/tables/:tableId/order",
  authorize("shop_owner", "shop_manager", "cashier"),
  orderController.openOrder.bind(orderController),
);

router.get(
  "/tables/:tableId/order",
  orderController.getActiveOrder.bind(orderController),
);

router.post(
  "/orders/:orderId/items",
  authorize("shop_owner", "shop_manager", "cashier"),
  orderController.addItem.bind(orderController),
);

router.delete(
  "/orders/:orderId/items/:orderItemId",
  authorize("shop_owner", "shop_manager", "cashier"),
  orderController.removeItem.bind(orderController),
);

router.patch(
  "/orders/:orderId/send-to-kitchen",
  authorize("shop_owner", "shop_manager", "cashier"),
  orderController.sendToKitchen.bind(orderController),
);

router.post(
  '/orders/:orderId/checkout',
  authorize('shop_owner', 'shop_manager', 'cashier'),
  orderController.checkout.bind(orderController)
);

export default router;
