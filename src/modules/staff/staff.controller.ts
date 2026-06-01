import { Request, Response } from 'express';
import { StaffService } from './staff.service';

const staffService = new StaffService();

export class StaffController {

  // GET /api/staff
  async getStaff(req: Request, res: Response): Promise<void> {
    try {
      const shopId = req.user!.shopId!;
      const filters = {
        role: req.query.role as string,
        isActive: req.query.isActive === 'true' ? true
          : req.query.isActive === 'false' ? false
          : undefined,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 10,
      };

      const result = await staffService.getStaff(shopId, filters);

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
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // GET /api/staff/:staffId
  async getStaffById(req: Request, res: Response): Promise<void> {
    try {
      const shopId = req.user!.shopId!;
      const { staffId } = req.params;

      const staff = await staffService.getStaffById(staffId, shopId);

      res.status(200).json({
        success: true,
        data: staff,
      });

    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  // POST /api/staff
  async createStaff(req: Request, res: Response): Promise<void> {
    try {
      const shopId = req.user!.shopId!;
      const createdBy = req.user!.userId;

      const staff = await staffService.createStaff(req.body, shopId, createdBy);

      res.status(201).json({
        success: true,
        message: 'Staff member created successfully!',
        data: staff,
      });

    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // PUT /api/staff/:staffId
  async updateStaff(req: Request, res: Response): Promise<void> {
    try {
      const shopId = req.user!.shopId!;
      const updatedBy = req.user!.userId;
      const { staffId } = req.params;

      const staff = await staffService.updateStaff(
        staffId,
        shopId,
        req.body,
        updatedBy
      );

      res.status(200).json({
        success: true,
        message: 'Staff member updated successfully!',
        data: staff,
      });

    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // DELETE /api/staff/:staffId
  async deleteStaff(req: Request, res: Response): Promise<void> {
    try {
      const shopId = req.user!.shopId!;
      const requestingUserId = req.user!.userId;
      const { staffId } = req.params;

      await staffService.deleteStaff(staffId, shopId, requestingUserId);

      res.status(200).json({
        success: true,
        message: 'Staff member deactivated successfully!',
      });

    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}