import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { AuthRepository } from "./auth.repository";
import {
  RegisterInput,
  LoginInput,
  AuthResponse,
  JwtPayload,
} from "./auth.types";
import { createAuditLog } from '../../utils/audit.utils';
import { AuditAction } from '../../enums/audit-actions.enum';

const authRepository = new AuthRepository();
const SALT_ROUNDS = 10;

export class AuthService {
  // ── REGISTER ──
  async register(input: RegisterInput): Promise<AuthResponse> {
    // 1. Check if email already exists
    const existingUser = await authRepository.findUserByEmail(input.email);
    if (existingUser) {
      throw new Error("Email already registered");
    }

    // 2. Hash the password
    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    // 3. Create shop and owner together
    const { shop, user } = await authRepository.createShopWithOwner(
      {
        name: input.shopName,
        slug: input.shopSlug,
        currency: input.currency ?? "USD",
        timezone: input.timezone ?? "UTC",
      },
      {
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        passwordHash,
        phone: input.phone,
        role: "shop_owner",
      },
    );

    // 4. Generate JWT token
    const token = this.generateToken({
      userId: user.userId,
      shopId: shop.shopId,
      role: user.role,
      email: user.email,
    });

    // 5. Return response
    return {
      user: {
        userId: user.userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        shopId: user.shopId,
      },
      token,
    };
  }

  // ── LOGIN ──
  async login(input: LoginInput): Promise<AuthResponse> {
    // 1. Find user by email
    const user = await authRepository.findUserByEmail(input.email);
    if (!user) {
      throw new Error("Invalid email or password");
    }

    // 2. Compare password with hash
    const isPasswordValid = await bcrypt.compare(
      input.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }
    // 3. Update lastLogin
    await authRepository.updateLastLogin(user.userId);

    // Audit log
    await createAuditLog({
      shopId: user.shopId ?? null,
      userId: user.userId,
      action: AuditAction.LOGIN_SUCCESS,
      entityType: "user",
      entityId: user.userId,
      details: {
        email: user.email,
        role: user.role,
      },
    });

    // 4. Generate JWT token
    const token = this.generateToken({
      userId: user.userId,
      shopId: user.shopId,
      role: user.role,
      email: user.email,
    });

    // 5. Return response
    return {
      user: {
        userId: user.userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        shopId: user.shopId,
      },
      token,
    };
  }

  // ── GET CURRENT USER ──
  async getMe(userId: string) {
    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  }

  // Set manager PIN
  async setManagerPin(userId: string, pin: string) {
    // Validate PIN is 4 digits
    if (!/^\d{4}$/.test(pin)) {
      throw new Error("PIN must be exactly 4 digits!");
    }

    // Hash the PIN
    const pinHash = await bcrypt.hash(pin, SALT_ROUNDS);

    await authRepository.setManagerPin(userId, pinHash);

    return { message: "Manager PIN set successfully!" };
  }

  // Verify manager PIN
  async verifyManagerPin(shopId: string, pin: string) {
    // Get all managers for this shop
    const managers = await authRepository.getShopManagers(shopId);

    if (managers.length === 0) {
      throw new Error("No managers found for this shop!");
    }

    // Check PIN against each manager
    for (const manager of managers) {
      if (!manager.managerPin) continue;

      const isValid = await bcrypt.compare(pin, manager.managerPin);
      if (isValid) {
        return {
          userId: manager.userId,
          firstName: manager.firstName,
          lastName: manager.lastName,
          email: manager.email,
          role: manager.role,
        };
      }
    }

    throw new Error("Invalid PIN!");
  }

  // Get shop managers (for dropdown fallback)
  async getShopManagers(shopId: string) {
    const managers = await authRepository.getShopManagers(shopId);

    // Never return PIN hash!
    return managers.map((m) => ({
      userId: m.userId,
      firstName: m.firstName,
      lastName: m.lastName,
      email: m.email,
      role: m.role,
      hasPin: !!m.managerPin, // just tell frontend if PIN exists
    }));
  }

  // ── GENERATE JWT TOKEN ──
  private generateToken(payload: JwtPayload): string {
    return jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
    } as jwt.SignOptions);
  }

  // ── VERIFY JWT TOKEN ──
  verifyToken(token: string): JwtPayload {
    return jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
  }

  // Update profile
  async updateProfile(
    userId: string,
    input: {
      firstName?: string;
      lastName?: string;
      phone?: string;
    },
  ) {
    // Only update provided fields
    const updateData: any = {};
    if (input.firstName) updateData.firstName = input.firstName;
    if (input.lastName) updateData.lastName = input.lastName;
    if (input.phone !== undefined) updateData.phone = input.phone;

    if (Object.keys(updateData).length === 0) {
      throw new Error("No fields provided to update!");
    }

    const updated = await authRepository.updateProfile(userId, updateData);
    if (!updated) {
      throw new Error("User not found!");
    }

    return updated;
  }

  // Change password
  async changePassword(
    userId: string,
    input: {
      currentPassword: string;
      newPassword: string;
    },
  ) {
    // 1. Validate new password length
    if (input.newPassword.length < 8) {
      throw new Error("New password must be at least 8 characters!");
    }

    // 2. Get user with password hash
    const user = await authRepository.getUserWithPassword(userId);
    if (!user) {
      throw new Error("User not found!");
    }

    // 3. Verify current password
    const isValid = await bcrypt.compare(
      input.currentPassword,
      user.passwordHash,
    );
    if (!isValid) {
      throw new Error("Current password is incorrect!");
    }

    // 4. Hash new password
    const newHash = await bcrypt.hash(input.newPassword, SALT_ROUNDS);

    // 5. Save new password
    await authRepository.updatePassword(userId, newHash);

    return { message: "Password changed successfully!" };
  }
}
