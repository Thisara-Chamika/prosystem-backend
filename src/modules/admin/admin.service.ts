import { AdminRepository } from "./admin.repository";
import { createAuditLog } from "../../utils/audit.utils";
import { AuditAction } from "../../enums/audit-actions.enum";

const adminRepository = new AdminRepository();
const VALID_TICKET_STATUSES = ["open", "in_progress", "resolved", "closed"];
export class AdminService {
// Get metrics for the admin dashboard
  async getMetrics() {
    return await adminRepository.getMetrics();
  }

  // Get a paginated list of shops with optional search filters
  async getShops(filters: { search?: string; page?: number; limit?: number }) {
    return await adminRepository.getShops(filters);
  }

  // Update the status of a shop (activate/deactivate)
  async updateShopStatus(
    shopId: string,
    isActive: boolean,
    adminUserId: string,
  ) {
    const shop = await adminRepository.updateShopStatus(shopId, isActive);

    if (!shop) {
      throw new Error("Shop not found!");
    }

    // Create an audit log for the shop status update
    await createAuditLog({
      shopId: shop.shopId,
      userId: adminUserId,
      action: isActive
        ? AuditAction.SHOP_REACTIVATED_BY_ADMIN
        : AuditAction.SHOP_DEACTIVATED_BY_ADMIN,
      entityType: "shop",
      entityId: shop.shopId,
      details: { isActive },
    });

    return shop;
  }

  // Get support tickets with optional status filter
  async getSupportTickets(status?: string) {
    return await adminRepository.getSupportTickets(status);
  }

  // Get a specific support ticket by its ID
  async getSupportTicketById(ticketId: string) {
    const ticket = await adminRepository.getSupportTicketById(ticketId);
    if (!ticket) throw new Error("Ticket not found!");
    return ticket;
  }

// Add a message to a support ticket as an admin
  async addAdminMessage(
    ticketId: string,
    adminUserId: string,
    message: string,
  ) {
    if (!message) throw new Error("Message is required!");
    const result = await adminRepository.addAdminMessage(
      ticketId,
      adminUserId,
      message,
    );
    if (!result) throw new Error("Ticket not found!");
    return result;
  }

  // Update the status of a support ticket
  async updateTicketStatus(ticketId: string, status: string) {
    if (!VALID_TICKET_STATUSES.includes(status)) {
      throw new Error(
        `Invalid status '${status}'. Must be one of: ${VALID_TICKET_STATUSES.join(", ")}`,
      );
    }
    const result = await adminRepository.updateTicketStatus(ticketId, status);
    if (!result) throw new Error("Ticket not found!");
    return result;
  }
}