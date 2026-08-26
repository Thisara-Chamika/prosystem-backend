import { db } from '../../config/database';
import { supportTickets, supportTicketMessages } from '../../db/schema/support-tickets';
import { eq, and, asc, desc, inArray } from 'drizzle-orm';
import { users } from '../../db/schema/users';

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

    const shopSenderIds = [...new Set(messages.filter((m) => m.senderType === 'shop').map((m) => m.senderId))];

    const senderRows = shopSenderIds.length > 0
      ? await db
          .select({ userId: users.userId, firstName: users.firstName, lastName: users.lastName })
          .from(users)
          .where(inArray(users.userId, shopSenderIds))
      : [];

    const nameById = new Map(senderRows.map((u) => [u.userId, `${u.firstName} ${u.lastName}`]));

    const enrichedMessages = messages.map((m) => ({
      ...m,
      senderName: m.senderType === 'admin' ? 'ProSystem Support' : nameById.get(m.senderId) ?? 'Unknown',
    }));

    return { ...ticket[0], messages: enrichedMessages };
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