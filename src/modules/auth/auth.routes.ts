import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';

const router = Router();
const authController = new AuthController();

// ── PUBLIC ROUTES (no token needed) ──
router.post('/register', authController.register.bind(authController));
router.post('/login', authController.login.bind(authController));

// ── PROTECTED ROUTES (token required) ──
router.get('/me', authenticate, authController.getMe.bind(authController));

// ── Manager PIN routes ────────────────────────────
// Set manager PIN (owner + manager only)
router.post(
  '/set-manager-pin',
  authenticate,
  authorize('shop_owner', 'shop_manager'),
  authController.setManagerPin.bind(authController)
);

// Verify manager PIN (any logged in user)
router.post(
  '/verify-manager-pin',
  authenticate,
  authController.verifyManagerPin.bind(authController)
);

// Get shop managers for dropdown (any logged in user)
router.get(
  '/managers',
  authenticate,
  authController.getShopManagers.bind(authController)
);

export default router;