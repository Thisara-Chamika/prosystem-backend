import { Request, Response } from "express";
import { AdminService } from "./admin.service";

const adminService = new AdminService();

export class AdminController {
  async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      const data = await adminService.getMetrics();
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}