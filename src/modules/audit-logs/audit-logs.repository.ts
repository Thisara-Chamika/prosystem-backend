import { db } from '../../config/database';
import { auditLogs } from '../../db/schema/audit-logs';
import { users } from '../../db/schema/users';
import { eq, and, gte, lte, desc, count } from 'drizzle-orm';

export class AuditLogsRepository {

  // Get audit logs with filters
  async getAuditLogs(shopId: string, filters: {
    action?: string;
    userId?: string;
    entityType?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
  }) {
    const limit = filters.limit ?? 20;
    const offset = ((filters.page ?? 1) - 1) * limit;

    // Get all logs for shop
    const allLogs = await db
      .select({
        logId: auditLogs.logId,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        details: auditLogs.details,
        createdAt: auditLogs.createdAt,
        userId: auditLogs.userId,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.userId))
      .where(eq(auditLogs.shopId, shopId))
      .orderBy(desc(auditLogs.createdAt));

    // Filter in JS
    let filtered = allLogs;

    if (filters.action) {
      filtered = filtered.filter(l => l.action === filters.action);
    }

    if (filters.userId) {
      filtered = filtered.filter(l => l.userId === filters.userId);
    }

    if (filters.entityType) {
      filtered = filtered.filter(l => l.entityType === filters.entityType);
    }

    if (filters.fromDate) {
      const from = new Date(filters.fromDate + 'T00:00:00.000Z');
      filtered = filtered.filter(l => l.createdAt >= from);
    }

    if (filters.toDate) {
      const to = new Date(filters.toDate + 'T23:59:59.999Z');
      filtered = filtered.filter(l => l.createdAt <= to);
    }

    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);

    // Shape response
    const data = paginated.map(log => ({
      logId: log.logId,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      details: log.details,
      createdAt: log.createdAt,
      user: log.userId ? {
        userId: log.userId,
        firstName: log.firstName,
        lastName: log.lastName,
        role: log.role,
      } : null,
    }));

    return { data, total };
  }

  // Get summary
  async getSummary(shopId: string) {
    // Get all logs
    const allLogs = await db
      .select({
        logId: auditLogs.logId,
        action: auditLogs.action,
        userId: auditLogs.userId,
        createdAt: auditLogs.createdAt,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.userId))
      .where(eq(auditLogs.shopId, shopId));

    // Total actions
    const totalActions = allLogs.length;

    // Today's actions
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayActions = allLogs.filter(
      l => l.createdAt >= todayStart
    ).length;

    // Action breakdown
    const actionCounts: Record<string, number> = {};
    for (const log of allLogs) {
      actionCounts[log.action] = (actionCounts[log.action] ?? 0) + 1;
    }

    const actionBreakdown = Object.entries(actionCounts)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count);

    // Most active user
    const userCounts: Record<string, {
      name: string;
      count: number;
    }> = {};

    for (const log of allLogs) {
      if (!log.userId) continue;
      const name = `${log.firstName} ${log.lastName}`;
      if (!userCounts[log.userId]) {
        userCounts[log.userId] = { name, count: 0 };
      }
      userCounts[log.userId].count += 1;
    }

    const mostActiveUser = Object.values(userCounts)
      .sort((a, b) => b.count - a.count)[0] ?? null;

    return {
      totalActions,
      todayActions,
      actionBreakdown,
      mostActiveUser: mostActiveUser ? {
        name: mostActiveUser.name,
        actionCount: mostActiveUser.count,
      } : null,
    };
  }
}