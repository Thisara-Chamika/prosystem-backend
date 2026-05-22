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

// ── Profile routes ────────────────────────────────
// Update own profile (all roles)
router.put(
  '/profile',
  authenticate,
  authController.updateProfile.bind(authController)
);

// Change own password (all roles)
router.put(
  '/password',
  authenticate,
  authController.changePassword.bind(authController)
);

// Set/update manager PIN (owner + manager only)
// Already exists as POST /set-manager-pin
// Add PUT alias for consistency:
router.put(
  '/manager-pin',
  authenticate,
  authorize('shop_owner', 'shop_manager'),
  authController.setManagerPin.bind(authController)
);

export default router;