import { ReportsRepository } from './reports.repository';

const reportsRepository = new ReportsRepository();

export class ReportsService {

  // ── Helper: parse date range ──────────────────────
  private getDateRange(fromDate?: string, toDate?: string) {
    const from = fromDate
      ? new Date(fromDate + 'T00:00:00.000Z')
      : new Date(new Date().setUTCHours(0, 0, 0, 0));

    const to = toDate
      ? new Date(toDate + 'T23:59:59.999Z')
      : new Date(new Date().setUTCHours(23, 59, 59, 999));

    return { from, to };
  }

  // ── Helper: calculate % change ────────────────────
  private calcChange(current: number, previous: number): number {
    if (previous === 0) return 0;
    return parseFloat(
      (((current - previous) / previous) * 100).toFixed(2)
    );
  }

  // ── SUMMARY ───────────────────────────────────────
  async getSummary(shopId: string, fromDate?: string, toDate?: string) {
    const { from, to } = this.getDateRange(fromDate, toDate);

    const { current, previous } = await reportsRepository
      .getSummary(shopId, from, to);

    // Calculate current period totals
    const todayRevenue = current.reduce(
      (sum, t) => sum + parseFloat(t.total), 0
    );
    const todayTransactions = current.length;
    const averageTicket = todayTransactions > 0
      ? todayRevenue / todayTransactions : 0;
    const totalTax = current.reduce(
      (sum, t) => sum + parseFloat(t.tax), 0
    );
    const totalDiscount = current.reduce(
      (sum, t) => sum + parseFloat(t.discount), 0
    );

    // Calculate previous period totals
    const prevRevenue = previous.reduce(
      (sum, t) => sum + parseFloat(t.total), 0
    );
    const prevTransactions = previous.length;

    return {
      todayRevenue: parseFloat(todayRevenue.toFixed(2)),
      todayTransactions,
      averageTicket: parseFloat(averageTicket.toFixed(2)),
      totalTax: parseFloat(totalTax.toFixed(2)),
      totalDiscount: parseFloat(totalDiscount.toFixed(2)),
      revenueChange: this.calcChange(todayRevenue, prevRevenue),
      transactionChange: this.calcChange(todayTransactions, prevTransactions),
    };
  }

  // ── DAILY SALES ───────────────────────────────────
  async getDailySales(shopId: string, fromDate?: string, toDate?: string) {
    const { from, to } = this.getDateRange(fromDate, toDate);

    const txns = await reportsRepository.getDailySales(shopId, from, to);

    // Group by date
    const dailyMap: Record<string, { revenue: number; transactions: number }> = {};

    for (const txn of txns) {
      const date = txn.createdAt.toISOString().split('T')[0];

      if (!dailyMap[date]) {
        dailyMap[date] = { revenue: 0, transactions: 0 };
      }

      dailyMap[date].revenue += parseFloat(txn.total);
      dailyMap[date].transactions += 1;
    }

    // Convert to array sorted by date
    return Object.entries(dailyMap)
      .map(([date, data]) => ({
        date,
        revenue: parseFloat(data.revenue.toFixed(2)),
        transactions: data.transactions,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  // ── TOP PRODUCTS ──────────────────────────────────
  async getTopProducts(
    shopId: string,
    fromDate?: string,
    toDate?: string,
    limit: number = 10
  ) {
    const { from, to } = this.getDateRange(fromDate, toDate);

    const products = await reportsRepository
      .getTopProducts(shopId, from, to, limit);

    return products.map(p => ({
      ...p,
      revenue: parseFloat(p.revenue.toFixed(2)),
    }));
  }

  // ── PAYMENT METHODS ───────────────────────────────
  async getPaymentMethods(
    shopId: string,
    fromDate?: string,
    toDate?: string
  ) {
    const { from, to } = this.getDateRange(fromDate, toDate);

    const txns = await reportsRepository
      .getPaymentMethods(shopId, from, to);

    // Group by payment method
    const methodMap: Record<string, { count: number; total: number }> = {};

    for (const txn of txns) {
      const method = txn.paymentMethod;
      if (!methodMap[method]) {
        methodMap[method] = { count: 0, total: 0 };
      }
      methodMap[method].count += 1;
      methodMap[method].total += parseFloat(txn.total);
    }

    return Object.entries(methodMap).map(([method, data]) => ({
      method,
      count: data.count,
      total: parseFloat(data.total.toFixed(2)),
    }));
  }

  // ── CASHIER SUMMARY ───────────────────────────────
  async getCashierSummary(
    shopId: string,
    fromDate?: string,
    toDate?: string
  ) {
    const { from, to } = this.getDateRange(fromDate, toDate);

    const { txns, allReturns, cashiers } =
      await reportsRepository.getCashierSummary(shopId, from, to);

    // Build cashier map
    const cashierMap: Record<string, {
      cashierId: string;
      cashierName: string;
      totalTransactions: number;
      totalRevenue: number;
      totalReturns: number;
    }> = {};

    // Initialize all cashiers
    for (const cashier of cashiers) {
      cashierMap[cashier.userId] = {
        cashierId: cashier.userId,
        cashierName: `${cashier.firstName} ${cashier.lastName}`,
        totalTransactions: 0,
        totalRevenue: 0,
        totalReturns: 0,
      };
    }

    // Aggregate transactions
    for (const txn of txns) {
      if (!cashierMap[txn.cashierId]) continue;
      cashierMap[txn.cashierId].totalTransactions += 1;
      cashierMap[txn.cashierId].totalRevenue += parseFloat(txn.total);
    }

    // Aggregate returns
    for (const ret of allReturns) {
      if (!cashierMap[ret.returnedBy]) continue;
      cashierMap[ret.returnedBy].totalReturns += 1;
    }

    // Build final result
    return Object.values(cashierMap)
      .filter(c => c.totalTransactions > 0)
      .map(c => ({
        ...c,
        totalRevenue: parseFloat(c.totalRevenue.toFixed(2)),
        averageTicket: c.totalTransactions > 0
          ? parseFloat(
              (c.totalRevenue / c.totalTransactions).toFixed(2)
            )
          : 0,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
  }
}