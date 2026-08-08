import { Request, Response } from "express";
import { orderService } from "../services/OrderService";

export class OrderController {
  async openOrder(req: Request, res: Response): Promise<void> {
    try {
      const { tableId } = req.params;
      const shopId = req.user!.shopId!;
      const serverId = req.user!.userId!;
      const order = await orderService.openOrder(
        shopId,
        tableId,
        serverId,
        req.body,
      );
      res
        .status(201)
        .json({
          success: true,
          message: "Order opened successfully!",
          data: order,
        });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getActiveOrder(req: Request, res: Response): Promise<void> {
    try {
      const { tableId } = req.params;
      const shopId = req.user!.shopId!;
      const order = await orderService.getActiveOrder(shopId, tableId);
      res.status(200).json({ success: true, data: order });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async addItem(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      const shopId = req.user!.shopId!;
      const item = await orderService.addItem(shopId, orderId, req.body);
      res
        .status(201)
        .json({
          success: true,
          message: "Item added successfully!",
          data: item,
        });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async removeItem(req: Request, res: Response): Promise<void> {
    try {
      const { orderId, orderItemId } = req.params;
      const shopId = req.user!.shopId!;
      await orderService.removeItem(shopId, orderId, orderItemId);
      res
        .status(200)
        .json({ success: true, message: "Item removed successfully!" });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async sendToKitchen(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      const shopId = req.user!.shopId!;
      const result = await orderService.sendToKitchen(shopId, orderId);
      res
        .status(200)
        .json({ success: true, message: "Sent to kitchen!", data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

export const orderController = new OrderController();
