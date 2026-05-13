import { db } from '../config/database';
import { auditLogs } from '../db/schema/audit-logs';
import { AuditActionType } from '../enums/audit-actions.enum';

export const createAuditLog = async (params: {
  shopId: string | null;
  userId: string | null;
  action: AuditActionType;
  entityType?: string;
  entityId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
}) => {
  try {
    await db.insert(auditLogs).values({
      shopId: params.shopId,
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      details: params.details ?? {},
      ipAddress: params.ipAddress,
    });
  } catch (error) {
    // Never let audit log failure break the main flow!
    console.error('Audit log failed:', error);
  }
};