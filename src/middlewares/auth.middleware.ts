import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../modules/auth/auth.service';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        shopId: string | null;
        role: string;
        email: string;
      };
    }
  }
}

const authService = new AuthService();

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // 1. Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'No token provided',
      });
      return;
    }

    // 2. Extract token
    const token = authHeader.split(' ')[1];

    // 3. Verify token
    const payload = authService.verifyToken(token);

    // 4. Attach user to request
    req.user = payload;

    // 5. Move to next middleware/controller
    next();

  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

// ── ROLE BASED AUTHORIZATION ──
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Not authorized to access this resource',
      });
      return;
    }

    next();
  };
};