import { Request, Response } from "express";
import { kitchenService } from "../services/KitchenService";

export class KitchenController {
  async getQueue(req: Request, res: Response): Promise<void> {
    try {
      const shopId = req.user!.shopId!;
      const queue = await kitchenService.getQueue(shopId);
      res.status(200).json({ success: true, data: queue });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async updateItemStatus(req: Request, res: Response): Promise<void> {
    try {
      const { orderItemId } = req.params;
      const shopId = req.user!.shopId!;
      const { status } = req.body;
      const item = await kitchenService.updateItemStatus(
        shopId,
        orderItemId,
        status,
      );
      res
        .status(200)
        .json({ success: true, message: "Status updated!", data: item });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

export const kitchenController = new KitchenController();
