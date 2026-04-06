import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();
const authController = new AuthController();

// ── PUBLIC ROUTES (no token needed) ──
router.post('/register', authController.register.bind(authController));
router.post('/login', authController.login.bind(authController));

// ── PROTECTED ROUTES (token required) ──
router.get('/me', authenticate, authController.getMe.bind(authController));

export default router;