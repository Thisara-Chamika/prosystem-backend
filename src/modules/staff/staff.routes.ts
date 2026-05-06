import { Router } from 'express';
import { StaffController } from './staff.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';

const router = Router();
const staffController = new StaffController();

// All routes require authentication
router.use(authenticate);

// ── GET routes ────────────────────────────────────
// Get all staff (owner + manager can view)
router.get(
  '/',
  authorize('shop_owner', 'shop_manager'),
  staffController.getStaff.bind(staffController)
);

// Get single staff member
router.get(
  '/:staffId',
  authorize('shop_owner', 'shop_manager'),
  staffController.getStaffById.bind(staffController)
);

// ── POST routes ───────────────────────────────────
// Create staff (owner only)
router.post(
  '/',
  authorize('shop_owner'),
  staffController.createStaff.bind(staffController)
);

// ── PUT routes ────────────────────────────────────
// Update staff (owner only)
router.put(
  '/:staffId',
  authorize('shop_owner'),
  staffController.updateStaff.bind(staffController)
);

// ── DELETE routes ─────────────────────────────────
// Deactivate staff (owner only)
router.delete(
  '/:staffId',
  authorize('shop_owner'),
  staffController.deleteStaff.bind(staffController)
);

export default router;