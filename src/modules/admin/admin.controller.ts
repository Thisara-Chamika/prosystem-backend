import { Request, Response } from "express";
import { AdminService } from "./admin.service";

const adminService = new AdminService();

export class AdminController {
  // Get metrics for the admin dashboard
  async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      const data = await adminService.getMetrics();
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Get shops with optional search and pagination
  async getShops(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        search: req.query.search as string,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 20,
      };
      const result = await adminService.getShops(filters);
      res.status(200).json({
        success: true,
        data: result.data,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total: result.total,
        },
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Update shop status (activate/deactivate)
  async updateShopStatus(req: Request, res: Response): Promise<void> {
    try {
      const { shopId } = req.params;
      const { isActive } = req.body;
      const adminUserId = req.user!.userId;

      if (typeof isActive !== "boolean") {
        res
          .status(400)
          .json({ success: false, message: "isActive must be true or false!" });
        return;
      }

      const shop = await adminService.updateShopStatus(
        shopId,
        isActive,
        adminUserId,
      );
      res.status(200).json({
        success: true,
        message: "Shop status updated successfully!",
        data: shop,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Get support tickets with optional status filter
  async getSupportTickets(req: Request, res: Response): Promise<void> {
    try {
      const status = req.query.status as string | undefined;
      const tickets = await adminService.getSupportTickets(status);
      res.status(200).json({ success: true, data: tickets });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Get a specific support ticket by its ID
  async getSupportTicketById(req: Request, res: Response): Promise<void> {
    try {
      const { ticketId } = req.params;
      const ticket = await adminService.getSupportTicketById(ticketId);
      res.status(200).json({ success: true, data: ticket });
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message });
    }
  }

  // Add a message to a support ticket as an admin
  async addAdminMessage(req: Request, res: Response): Promise<void> {
    try {
      const { ticketId } = req.params;
      const { message } = req.body;
      const adminUserId = req.user!.userId;
      const result = await adminService.addAdminMessage(
        ticketId,
        adminUserId,
        message,
      );
      res
        .status(201)
        .json({
          success: true,
          message: "Reply added successfully!",
          data: result,
        });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Update the status of a support ticket
  async updateTicketStatus(req: Request, res: Response): Promise<void> {
    try {
      const { ticketId } = req.params;
      const { status } = req.body;
      const ticket = await adminService.updateTicketStatus(ticketId, status);
      res
        .status(200)
        .json({
          success: true,
          message: "Ticket status updated!",
          data: ticket,
        });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}