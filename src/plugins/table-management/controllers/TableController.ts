import { Request, Response } from 'express';
import { tableService } from '../services/TableService';

export class TableController {

  async getTables(req: Request, res: Response): Promise<void> {
    try {
      const shopId = req.user!.shopId!;
      const tables = await tableService.getTables(shopId);
      res.status(200).json({ success: true, data: tables });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async createTable(req: Request, res: Response): Promise<void> {
    try {
      const shopId = req.user!.shopId!;
      const table = await tableService.createTable(shopId, req.body);
      res.status(201).json({ success: true, message: 'Table created successfully!', data: table });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async updateTable(req: Request, res: Response): Promise<void> {
    try {
      const { tableId } = req.params;
      const shopId = req.user!.shopId!;
      const table = await tableService.updateTable(shopId, tableId, req.body);
      res.status(200).json({ success: true, message: 'Table updated successfully!', data: table });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async deleteTable(req: Request, res: Response): Promise<void> {
    try {
      const { tableId } = req.params;
      const shopId = req.user!.shopId!;
      await tableService.deleteTable(shopId, tableId);
      res.status(200).json({ success: true, message: 'Table deleted successfully!' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

export const tableController = new TableController();