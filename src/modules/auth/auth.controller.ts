import { Request, Response } from 'express';
import { AuthService } from './auth.service';

const authService = new AuthService();

export class AuthController {

  // ── REGISTER ──────────────────────────────────────
  async register(req: Request, res: Response): Promise<void> {
    try {
      const result = await authService.register(req.body);

      res.status(201).json({
        success: true,
        message: 'Shop registered successfully!',
        data: result,
      });

    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // ── LOGIN ─────────────────────────────────────────
  async login(req: Request, res: Response): Promise<void> {
    try {
      const result = await authService.login(req.body);

      res.status(200).json({
        success: true,
        message: 'Login successful!',
        data: result,
      });

    } catch (error: any) {
      res.status(401).json({
        success: false,
        message: error.message,
      });
    }
  }

  // ── GET ME ────────────────────────────────────────
  async getMe(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.userId;
      const user = await authService.getMe(userId);

      res.status(200).json({
        success: true,
        data: user,
      });

    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  // POST /api/auth/set-manager-pin
async setManagerPin(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { pin } = req.body;

    const result = await authService.setManagerPin(userId, pin);

    res.status(200).json({
      success: true,
      message: result.message,
    });

  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

// POST /api/auth/verify-manager-pin
async verifyManagerPin(req: Request, res: Response): Promise<void> {
  try {
    const shopId = req.user!.shopId!;
    const { pin } = req.body;

    const manager = await authService.verifyManagerPin(shopId, pin);

    res.status(200).json({
      success: true,
      message: 'PIN verified successfully!',
      data: manager,
    });

  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

// GET /api/auth/managers
async getShopManagers(req: Request, res: Response): Promise<void> {
  try {
    const shopId = req.user!.shopId!;

    const managers = await authService.getShopManagers(shopId);

    res.status(200).json({
      success: true,
      data: managers,
    });

  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

// PUT /api/auth/profile
async updateProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { firstName, lastName, phone } = req.body;

    const updated = await authService.updateProfile(userId, {
      firstName,
      lastName,
      phone,
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      data: updated,
    });

  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

// PUT /api/auth/password
async changePassword(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;

    const result = await authService.changePassword(userId, req.body);

    res.status(200).json({
      success: true,
      message: result.message,
    });

  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}
}