import { SupportTicketsRepository } from './support-tickets.repository';

const supportTicketsRepository = new SupportTicketsRepository();

export class SupportTicketsService {

  async createTicket(shopId: string, raisedBy: string, subject: string, message: string) {
    if (!subject || !message) {
      throw new Error('Subject and message are required!');
    }
    return await supportTicketsRepository.createTicket(shopId, raisedBy, subject, message);
  }

  async getTickets(shopId: string) {
    return await supportTicketsRepository.getTickets(shopId);
  }

  async getTicketById(shopId: string, ticketId: string) {
    const ticket = await supportTicketsRepository.getTicketById(shopId, ticketId);
    if (!ticket) throw new Error('Ticket not found!');
    return ticket;
  }

  async addMessage(shopId: string, ticketId: string, senderId: string, message: string) {
    if (!message) throw new Error('Message is required!');
    const result = await supportTicketsRepository.addMessage(shopId, ticketId, senderId, message);
    if (!result) throw new Error('Ticket not found!');
    return result;
  }
}