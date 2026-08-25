import { Request, Response } from 'express';
import { SupportTicketsService } from './support-tickets.service';

const supportTicketsService = new SupportTicketsService();

export class SupportTicketsController {

  async createTicket(req: Request, res: Response): Promise<void> {
    try {
      const shopId = req.user!.shopId!;
      const raisedBy = req.user!.userId;
      const { subject, message } = req.body;
      const result = await supportTicketsService.createTicket(shopId, raisedBy, subject, message);
      res.status(201).json({ success: true, message: 'Ticket created successfully!', data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getTickets(req: Request, res: Response): Promise<void> {
    try {
      const shopId = req.user!.shopId!;
      const tickets = await supportTicketsService.getTickets(shopId);
      res.status(200).json({ success: true, data: tickets });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getTicketById(req: Request, res: Response): Promise<void> {
    try {
      const shopId = req.user!.shopId!;
      const { ticketId } = req.params;
      const ticket = await supportTicketsService.getTicketById(shopId, ticketId);
      res.status(200).json({ success: true, data: ticket });
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message });
    }
  }

  async addMessage(req: Request, res: Response): Promise<void> {
    try {
      const shopId = req.user!.shopId!;
      const senderId = req.user!.userId;
      const { ticketId } = req.params;
      const { message } = req.body;
      const result = await supportTicketsService.addMessage(shopId, ticketId, senderId, message);
      res.status(201).json({ success: true, message: 'Reply added successfully!', data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}