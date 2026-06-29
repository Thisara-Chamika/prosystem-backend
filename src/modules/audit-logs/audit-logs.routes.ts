import { Router } from 'express';
import { AuditLogsController } from './audit-logs.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';

const router = Router();
const auditLogsController = new AuditLogsController();

router.use(authenticate);
router.use(authorize('shop_owner'));

// GET /api/audit-logs/summary ← must be before /:id routes!
router.get(
  '/summary',
  auditLogsController.getSummary.bind(auditLogsController)
);

// GET /api/audit-logs
router.get(
  '/',
  auditLogsController.getAuditLogs.bind(auditLogsController)
);

export default router;