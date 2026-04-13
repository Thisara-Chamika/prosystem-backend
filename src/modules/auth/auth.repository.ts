import { db } from '../../config/database';
import { shops } from '../../db/schema/shops';
import { users } from '../../db/schema/users';
import { eq } from 'drizzle-orm';
import { NewShop } from '../../db/schema/shops';
import { NewUser } from '../../db/schema/users';

export class AuthRepository {

  // Find user by email
  async findUserByEmail(email: string) {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return result[0] ?? null;
  }

  // Find user by ID
  async findUserById(userId: string) {
  const result = await db
    .select({
      userId: users.userId,
      shopId: users.shopId,
      email: users.email,
      role: users.role,
      firstName: users.firstName,
      lastName: users.lastName,
      phone: users.phone,
      isActive: users.isActive,
      lastLogin: users.lastLogin,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.userId, userId))
    .limit(1);

  return result[0] ?? null;
  }

  // Create shop and owner together
  async createShopWithOwner(shopData: NewShop, userData: NewUser) {
    // Create shop first
    const newShop = await db
      .insert(shops)
      .values(shopData)
      .returning();

    // Then create owner with shopId
    const newUser = await db
      .insert(users)
      .values({
        ...userData,
        shopId: newShop[0].shopId,
        role: 'shop_owner'
      })
      .returning();

    return {
      shop: newShop[0],
      user: newUser[0]
    };
  }
}