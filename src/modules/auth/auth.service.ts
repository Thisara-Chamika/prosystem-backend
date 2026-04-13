import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthRepository } from './auth.repository';
import { RegisterInput, LoginInput, AuthResponse, JwtPayload } from './auth.types';

const authRepository = new AuthRepository();
const SALT_ROUNDS = 10;

export class AuthService {

  // ── REGISTER ──
  async register(input: RegisterInput): Promise<AuthResponse> {

    // 1. Check if email already exists
    const existingUser = await authRepository.findUserByEmail(input.email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    // 2. Hash the password
    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    // 3. Create shop and owner together
    const { shop, user } = await authRepository.createShopWithOwner(
      {
        name: input.shopName,
        slug: input.shopSlug,
        currency: input.currency ?? 'USD',
        timezone: input.timezone ?? 'UTC',
      },
      {
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        passwordHash,
        phone: input.phone,
        role: 'shop_owner',
      }
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
      throw new Error('Invalid email or password');
    }

    // 2. Compare password with hash
    const isPasswordValid = await bcrypt.compare(
      input.password,
      user.passwordHash
    );
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // 3. Generate JWT token
    const token = this.generateToken({
      userId: user.userId,
      shopId: user.shopId,
      role: user.role,
      email: user.email,
    });

    // 4. Return response
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
      throw new Error('User not found');
    }
    return user;
  }

  // ── GENERATE JWT TOKEN ──
  private generateToken(payload: JwtPayload): string {
    return jwt.sign(
      payload,
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN ?? '7d' } as jwt.SignOptions
    );
  }

  // ── VERIFY JWT TOKEN ──
  verifyToken(token: string): JwtPayload {
    return jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
  }
}