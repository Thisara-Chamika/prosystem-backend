import { db } from '../../config/database';
import { supportTickets, supportTicketMessages } from '../../db/schema/support-tickets';
import { eq, and, asc, desc } from 'drizzle-orm';

export class SupportTicketsRepository {

  async createTicket(shopId: string, raisedBy: string, subject: string, message: string) {
    const newTicket = await db
      .insert(supportTickets)
      .values({ shopId, raisedBy, subject })
      .returning();

    const newMessage = await db
      .insert(supportTicketMessages)
      .values({
        ticketId: newTicket[0].ticketId,
        shopId,
        senderId: raisedBy,
        senderType: 'shop',
        message,
      })
      .returning();

    return { ticket: newTicket[0], message: newMessage[0] };
  }

  async getTickets(shopId: string) {
    return await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.shopId, shopId))
      .orderBy(desc(supportTickets.createdAt));
  }

  async getTicketById(shopId: string, ticketId: string) {
    const ticket = await db
      .select()
      .from(supportTickets)
      .where(and(eq(supportTickets.ticketId, ticketId), eq(supportTickets.shopId, shopId)))
      .limit(1);

    if (!ticket[0]) return null;

    const messages = await db
      .select()
      .from(supportTicketMessages)
      .where(eq(supportTicketMessages.ticketId, ticketId))
      .orderBy(asc(supportTicketMessages.createdAt));

    return { ...ticket[0], messages };
  }

  async addMessage(shopId: string, ticketId: string, senderId: string, message: string) {
    const ticket = await db
      .select()
      .from(supportTickets)
      .where(and(eq(supportTickets.ticketId, ticketId), eq(supportTickets.shopId, shopId)))
      .limit(1);

    if (!ticket[0]) return null;

    const newMessage = await db
      .insert(supportTicketMessages)
      .values({ ticketId, shopId, senderId, senderType: 'shop', message })
      .returning();

    await db
      .update(supportTickets)
      .set({ updatedAt: new Date() })
      .where(eq(supportTickets.ticketId, ticketId));

    return newMessage[0];
  }
}