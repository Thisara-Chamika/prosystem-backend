import { DashboardRepository } from './dashboard.repository';

const dashboardRepository = new DashboardRepository();

export class DashboardService {

  async getCashierSummary(cashierId: string, shopId: string) {
    const todayTransactions = await dashboardRepository
      .getCashierSummary(cashierId, shopId);

    // Calculate totals
    const todayCount = todayTransactions.length;

    const todayRevenue = todayTransactions.reduce(
      (sum, t) => sum + parseFloat(t.total),
      0
    );

    const averagePerSale = todayCount > 0
      ? todayRevenue / todayCount
      : 0;

    // Get last 5 only
    const recentTransactions = todayTransactions
      .slice(0, 5)
      .map(t => ({
        transactionId: t.transactionId,
        transactionNumber: t.transactionNumber,
        total: parseFloat(t.total),
        paymentMethod: t.paymentMethod,
        status: t.status,
        createdAt: t.createdAt,
      }));

    return {
      todayTransactions: todayCount,
      todayRevenue: parseFloat(todayRevenue.toFixed(2)),
      averagePerSale: parseFloat(averagePerSale.toFixed(2)),
      recentTransactions,
    };
  }
}