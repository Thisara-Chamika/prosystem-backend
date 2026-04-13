export interface RegisterInput {
  // Shop details
  shopName: string;
  shopSlug: string;
  currency?: string;
  timezone?: string;

  // Owner details
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface JwtPayload {
  userId: string;
  shopId: string | null;
  role: string;
  email: string;
}

export interface AuthResponse {
  user: {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    shopId: string | null;
  };
  token: string;
}