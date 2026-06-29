import { AuditLogsRepository } from './audit-logs.repository';

const auditLogsRepository = new AuditLogsRepository();

export class AuditLogsService {

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
    return await auditLogsRepository.getAuditLogs(shopId, filters);
  }

  // Get summary
  async getSummary(shopId: string) {
    return await auditLogsRepository.getSummary(shopId);
  }
}