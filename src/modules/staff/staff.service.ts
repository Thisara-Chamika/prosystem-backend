import bcrypt from "bcrypt";
import { StaffRepository } from "./staff.repository";
import {
  CreateStaffInput,
  UpdateStaffInput,
  StaffFilters,
} from "./staff.types";
import { createAuditLog } from "../../utils/audit.utils";
import { AuditAction } from "../../enums/audit-actions.enum";
import { emailService } from "../../services/EmailService";
import { ShopsRepository } from "../shops/shops.repository";

const shopsRepository = new ShopsRepository();
const staffRepository = new StaffRepository();
const SALT_ROUNDS = 10;

export class StaffService {
  // Get all staff
  async getStaff(shopId: string, filters: StaffFilters) {
    return await staffRepository.getStaff(shopId, filters);
  }

  // Get single staff member
  async getStaffById(userId: string, shopId: string) {
    const staff = await staffRepository.getStaffById(userId, shopId);
    if (!staff) {
      throw new Error("Staff member not found!");
    }
    return staff;
  }

  // Create staff member
  async createStaff(
    input: CreateStaffInput,
    shopId: string,
    createdBy: string,
  ) {
    // 1. Validate role — cannot create shop_owner or super_admin!
    const allowedRoles = ["shop_manager", "cashier"];
    if (!allowedRoles.includes(input.role)) {
      throw new Error(
        `Invalid role! Allowed roles: ${allowedRoles.join(", ")}`,
      );
    }

    // 2. Check email already exists
    const existing = await staffRepository.findByEmail(input.email);
    if (existing) {
      throw new Error("Email already registered!");
    }

    // 3. Hash password
    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    // 4. Create staff member
    const staff = await staffRepository.createStaff({
      shopId,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      passwordHash,
      role: input.role,
      phone: input.phone,
      isActive: true,
    });

    // ── Send staff welcome email (never include password!) ──
    if (staff.email) {
      try {
        const shop = await shopsRepository.getShopById(shopId);
        const prefs = (shop?.configuration as any)?.emailNotifications ?? {};

        if (prefs.staffWelcomeEmail !== false) {
          await emailService
            .sendStaffWelcomeEmail({
              to: staff.email,
              staffName: staff.firstName,
              shopName: shop?.name ?? "Shop",
              role: staff.role,
              loginEmail: staff.email,
            })
            .catch((err) => {
              console.error("Failed to send staff welcome email:", err);
            });
        }
      } catch (error) {
        console.error("Staff welcome email error:", error);
      }
    }

    // 5. Audit log
    await createAuditLog({
      shopId,
      userId: createdBy,
      action: AuditAction.STAFF_CREATED,
      entityType: "user",
      entityId: staff.userId,
      details: {
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        role: input.role,
      },
    });

    return staff;
  }

  // Update staff member
  async updateStaff(
    userId: string,
    shopId: string,
    input: UpdateStaffInput,
    updatedBy: string,
  ) {
    // Check staff exists in this shop
    const existing = await staffRepository.getStaffById(userId, shopId);
    if (!existing) {
      throw new Error("Staff member not found!");
    }

    // Validate role if being changed
    if (input.role) {
      const allowedRoles = ["shop_manager", "cashier"];
      if (!allowedRoles.includes(input.role)) {
        throw new Error(
          `Invalid role! Allowed roles: ${allowedRoles.join(", ")}`,
        );
      }
    }

    // Hash new password if provided
    const updateData: any = { ...input };
    if (input.password) {
      updateData.passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
      delete updateData.password; // remove plain password!
    }

    // Audit log
    await createAuditLog({
      shopId,
      userId: updatedBy,
      action: AuditAction.STAFF_UPDATED,
      entityType: "user",
      entityId: userId,
      details: {
        updatedUser: `${existing.firstName} ${existing.lastName}`,
        changes: {
          role: input.role ?? existing.role,
          firstName: input.firstName ?? existing.firstName,
          lastName: input.lastName ?? existing.lastName,
          isActive: input.isActive,
        },
        updatedBy,
      },
    });

    return await staffRepository.updateStaff(userId, shopId, updateData);
  }

  // Deactivate staff member
  async deleteStaff(userId: string, shopId: string, requestingUserId: string) {
    // Cannot deactivate yourself!
    if (userId === requestingUserId) {
      throw new Error("You cannot deactivate your own account!");
    }

    const existing = await staffRepository.getStaffById(userId, shopId);
    if (!existing) {
      throw new Error("Staff member not found!");
    }

    // Cannot deactivate another shop_owner!
    if (existing.role === "shop_owner") {
      throw new Error("Cannot deactivate a shop owner!");
    }

    const result = await staffRepository.deleteStaff(userId, shopId);

    // Audit log
    await createAuditLog({
      shopId,
      userId: requestingUserId,
      action: AuditAction.STAFF_DEACTIVATED,
      entityType: "user",
      entityId: userId,
      details: {
        deactivatedUser: `${existing.firstName} ${existing.lastName}`,
        role: existing.role,
        email: existing.email,
      },
    });

    return result;
  }
}
