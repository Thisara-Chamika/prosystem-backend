import { db } from '../../config/database';
import { users } from '../../db/schema/users';
import { eq, and } from 'drizzle-orm';
import { NewUser } from '../../db/schema/users';
import { StaffFilters } from './staff.types';

export class StaffRepository {

  // Get all staff for shop
  async getStaff(shopId: string, filters: StaffFilters) {
    const limit = filters.limit ?? 10;
    const offset = ((filters.page ?? 1) - 1) * limit;

    const conditions = [
      eq(users.shopId, shopId),
    ];

    if (filters.role) {
      conditions.push(eq(users.role, filters.role as any));
    }

    if (filters.isActive !== undefined) {
      conditions.push(eq(users.isActive, filters.isActive));
    }

    const result = await db
      .select({
        userId: users.userId,
        shopId: users.shopId,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        role: users.role,
        phone: users.phone,
        isActive: users.isActive,
        lastLogin: users.lastLogin,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset);

    return result;
  }

  // Get single staff member
  async getStaffById(userId: string, shopId: string) {
    const result = await db
      .select({
        userId: users.userId,
        shopId: users.shopId,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        role: users.role,
        phone: users.phone,
        isActive: users.isActive,
        lastLogin: users.lastLogin,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(
        and(
          eq(users.userId, userId),
          eq(users.shopId, shopId)
        )
      )
      .limit(1);

    return result[0] ?? null;
  }

  // Find user by email
  async findByEmail(email: string) {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return result[0] ?? null;
  }

  // Create staff member
  async createStaff(data: NewUser) {
    const result = await db
      .insert(users)
      .values(data)
      .returning({
        userId: users.userId,
        shopId: users.shopId,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        role: users.role,
        phone: users.phone,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });

    return result[0];
  }

  // Update staff member
  async updateStaff(userId: string, shopId: string, data: Partial<NewUser>) {
    const result = await db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(users.userId, userId),
          eq(users.shopId, shopId)
        )
      )
      .returning({
        userId: users.userId,
        shopId: users.shopId,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        role: users.role,
        phone: users.phone,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });

    return result[0] ?? null;
  }

  // Soft delete staff member
  async deleteStaff(userId: string, shopId: string) {
    const result = await db
      .update(users)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(users.userId, userId),
          eq(users.shopId, shopId)
        )
      )
      .returning({
        userId: users.userId,
        isActive: users.isActive,
      });

    return result[0] ?? null;
  }
}