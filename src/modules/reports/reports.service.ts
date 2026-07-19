import { ReportsRepository } from "./reports.repository";

const reportsRepository = new ReportsRepository();

export class ReportsService {
  // ── Helper: parse date range ──────────────────────
  private getDateRange(fromDate?: string, toDate?: string) {
    const from = fromDate
      ? new Date(fromDate + "T00:00:00.000Z")
      : new Date(new Date().setUTCHours(0, 0, 0, 0));

    const to = toDate
      ? new Date(toDate + "T23:59:59.999Z")
      : new Date(new Date().setUTCHours(23, 59, 59, 999));

    return { from, to };
  }

  // ── Helper: calculate % change ────────────────────
  private calcChange(current: number, previous: number): number {
    if (previous === 0) return 0;
    return parseFloat((((current - previous) / previous) * 100).toFixed(2));
  }

  // ── Helper: inclusive day count between two dates ──
  // Normalizes both dates to midnight UTC first, then
  // diffs in whole days — avoids fractional-time bugs
  // when 'end' carries a 23:59:59.999 timestamp.
  private daysElapsedInclusive(start: Date, end: Date): number {
    const startMidnight = Date.UTC(
      start.getUTCFullYear(),
      start.getUTCMonth(),
      start.getUTCDate(),
    );
    const endMidnight = Date.UTC(
      end.getUTCFullYear(),
      end.getUTCMonth(),
      end.getUTCDate(),
    );
    const diffDays = Math.round(
      (endMidnight - startMidnight) / (1000 * 60 * 60 * 24),
    );
    return diffDays + 1; // inclusive of both start and end day
  }

  // ── SUMMARY ───────────────────────────────────────
  async getSummary(shopId: string, fromDate?: string, toDate?: string) {
    const { from, to } = this.getDateRange(fromDate, toDate);

    const { current, previous } = await reportsRepository.getSummary(
      shopId,
      from,
      to,
    );

    const todayRevenue = current.reduce(
      (sum, t) => sum + parseFloat(t.total),
      0,
    );
    const todayTransactions = current.length;
    const averageTicket =
      todayTransactions > 0 ? todayRevenue / todayTransactions : 0;
    const totalTax = current.reduce((sum, t) => sum + parseFloat(t.tax), 0);
    const totalDiscount = current.reduce(
      (sum, t) => sum + parseFloat(t.discount),
      0,
    );

    const prevRevenue = previous.reduce(
      (sum, t) => sum + parseFloat(t.total),
      0,
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

    const dailyMap: Record<string, { revenue: number; transactions: number }> =
      {};

    for (const txn of txns) {
      const date = txn.createdAt.toISOString().split("T")[0];

      if (!dailyMap[date]) {
        dailyMap[date] = { revenue: 0, transactions: 0 };
      }

      dailyMap[date].revenue += parseFloat(txn.total);
      dailyMap[date].transactions += 1;
    }

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
    limit: number = 10,
  ) {
    const { from, to } = this.getDateRange(fromDate, toDate);

    const products = await reportsRepository.getTopProducts(
      shopId,
      from,
      to,
      limit,
    );

    return products.map((p) => ({
      ...p,
      revenue: parseFloat(p.revenue.toFixed(2)),
    }));
  }

  // ── PAYMENT METHODS ───────────────────────────────
  async getPaymentMethods(shopId: string, fromDate?: string, toDate?: string) {
    const { from, to } = this.getDateRange(fromDate, toDate);

    const txns = await reportsRepository.getPaymentMethods(shopId, from, to);

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
  async getCashierSummary(shopId: string, fromDate?: string, toDate?: string) {
    const { from, to } = this.getDateRange(fromDate, toDate);

    const { txns, allReturns, cashiers } =
      await reportsRepository.getCashierSummary(shopId, from, to);

    const cashierMap: Record<
      string,
      {
        cashierId: string;
        cashierName: string;
        totalTransactions: number;
        totalRevenue: number;
        totalReturns: number;
      }
    > = {};

    for (const cashier of cashiers) {
      cashierMap[cashier.userId] = {
        cashierId: cashier.userId,
        cashierName: `${cashier.firstName} ${cashier.lastName}`,
        totalTransactions: 0,
        totalRevenue: 0,
        totalReturns: 0,
      };
    }

    for (const txn of txns) {
      if (!cashierMap[txn.cashierId]) continue;
      cashierMap[txn.cashierId].totalTransactions += 1;
      cashierMap[txn.cashierId].totalRevenue += parseFloat(txn.total);
    }

    for (const ret of allReturns) {
      if (!cashierMap[ret.returnedBy]) continue;
      cashierMap[ret.returnedBy].totalReturns += 1;
    }

    return Object.values(cashierMap)
      .filter((c) => c.totalTransactions > 0)
      .map((c) => ({
        ...c,
        totalRevenue: parseFloat(c.totalRevenue.toFixed(2)),
        averageTicket:
          c.totalTransactions > 0
            ? parseFloat((c.totalRevenue / c.totalTransactions).toFixed(2))
            : 0,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
  }

  // ── REVENUE TRENDS ────────────────────────────────
  async getRevenueTrends(
    shopId: string,
    period: "week" | "month" | "quarter" = "month",
  ) {
    const now = new Date();
    const currentTo = new Date(now);
    currentTo.setUTCHours(23, 59, 59, 999);

    let elapsedDays: number;
    let periodLabel: string;
    let groupByWeek = false;

    if (period === "week") {
      elapsedDays = 7;
      periodLabel = "This Week";
    } else if (period === "quarter") {
      const quarterStartMonth = Math.floor(now.getUTCMonth() / 3) * 3;
      const quarterStart = new Date(
        Date.UTC(now.getUTCFullYear(), quarterStartMonth, 1),
      );
      elapsedDays = this.daysElapsedInclusive(quarterStart, now); // ← fixed
      groupByWeek = true;
      periodLabel = `Q${Math.floor(now.getUTCMonth() / 3) + 1} ${now.getUTCFullYear()}`;
    } else {
      // month
      const monthStart = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
      );
      elapsedDays = this.daysElapsedInclusive(monthStart, now); // ← fixed
      periodLabel = now.toLocaleString("en-US", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      });
    }

    const currentFrom = new Date(currentTo);
    currentFrom.setUTCDate(currentFrom.getUTCDate() - (elapsedDays - 1));
    currentFrom.setUTCHours(0, 0, 0, 0);

    const previousTo = new Date(currentFrom);
    previousTo.setUTCDate(previousTo.getUTCDate() - 1);
    previousTo.setUTCHours(23, 59, 59, 999);

    const previousFrom = new Date(previousTo);
    previousFrom.setUTCDate(previousFrom.getUTCDate() - (elapsedDays - 1));
    previousFrom.setUTCHours(0, 0, 0, 0);

    const previousLabel = previousFrom.toLocaleString("en-US", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });

    const { current, previous } = await reportsRepository.getRevenueTrends(
      shopId,
      currentFrom,
      currentTo,
      previousFrom,
      previousTo,
    );

    const currentRevenue = current.reduce(
      (sum, t) => sum + parseFloat(t.total),
      0,
    );
    const previousRevenue = previous.reduce(
      (sum, t) => sum + parseFloat(t.total),
      0,
    );

    const growthPercent = this.calcChange(currentRevenue, previousRevenue);

    const trendMap: Record<string, number> = {};

    for (const txn of current) {
      let key: string;
      if (groupByWeek) {
        const txnDate = new Date(txn.createdAt);
        const weekStart = new Date(txnDate);
        weekStart.setUTCDate(txnDate.getUTCDate() - txnDate.getUTCDay());
        key = weekStart.toISOString().split("T")[0];
      } else {
        key = txn.createdAt.toISOString().split("T")[0];
      }
      trendMap[key] = (trendMap[key] ?? 0) + parseFloat(txn.total);
    }

    const trend = Object.entries(trendMap)
      .map(([date, revenue]) => ({
        date,
        revenue: parseFloat(revenue.toFixed(2)),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      period,
      current: {
        label: periodLabel,
        revenue: parseFloat(currentRevenue.toFixed(2)),
        transactions: current.length,
      },
      previous: {
        label: previousLabel,
        revenue: parseFloat(previousRevenue.toFixed(2)),
        transactions: previous.length,
      },
      growthPercent,
      trend,
    };
  }

  // ── CUSTOMER ANALYTICS ────────────────────────────
  async getCustomerAnalytics(
    shopId: string,
    fromDate?: string,
    toDate?: string,
  ) {
    const { from, to } = this.getDateRange(fromDate, toDate);

    const { newCustomersInPeriod, periodTransactions, allCustomers } =
      await reportsRepository.getCustomerAnalytics(shopId, from, to);

    // newCustomers — created within the period
    const newCustomers = newCustomersInPeriod.length;

    // returningCustomers — made a purchase in this period
    // AND were created BEFORE fromDate (existing customers, not brand new)
    const customersWhoTransacted = new Set(
      periodTransactions
        .filter((t) => t.customerId !== null)
        .map((t) => t.customerId as string),
    );

    const customerMap = new Map(allCustomers.map((c) => [c.customerId, c]));

    let returningCustomers = 0;
    for (const customerId of customersWhoTransacted) {
      const customer = customerMap.get(customerId);
      if (customer && customer.createdAt < from) {
        returningCustomers++;
      }
    }

    const totalActiveCustomers = customersWhoTransacted.size;

    // topCustomers — top 10 by totalSpent, ALL TIME (not period-scoped,
    // per spec — this reads the running totalSpent field maintained
    // by the loyalty/CRM module, not a period-filtered sum)
    const topCustomers = [...allCustomers]
      .filter((c) => parseFloat(c.totalSpent?.toString() ?? "0") > 0)
      .sort(
        (a, b) =>
          parseFloat(b.totalSpent?.toString() ?? "0") -
          parseFloat(a.totalSpent?.toString() ?? "0"),
      )
      .slice(0, 10)
      .map((c) => ({
        customerId: c.customerId,
        name: `${c.firstName} ${c.lastName}`,
        totalSpent: parseFloat(c.totalSpent?.toString() ?? "0"),
        totalVisits: c.totalVisits ?? 0,
        loyaltyTier: c.loyaltyTier,
      }));

    // atRiskCustomers — lastVisit > 30 days ago AND totalSpent > 0
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);

    const atRiskCustomers = allCustomers
      .filter((c) => {
        const spent = parseFloat(c.totalSpent?.toString() ?? "0");
        return spent > 0 && c.lastVisit && c.lastVisit < thirtyDaysAgo;
      })
      .map((c) => {
        const daysSinceVisit = Math.floor(
          (Date.now() - c.lastVisit!.getTime()) / (1000 * 60 * 60 * 24),
        );
        return {
          customerId: c.customerId,
          name: `${c.firstName} ${c.lastName}`,
          lastVisit: c.lastVisit,
          daysSinceVisit,
          totalSpent: parseFloat(c.totalSpent?.toString() ?? "0"),
        };
      })
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    return {
      newCustomers,
      returningCustomers,
      totalActiveCustomers,
      topCustomers,
      atRiskCustomers,
    };
  }

  // ── INVENTORY VALUATION ───────────────────────────
  async getInventoryValuation(shopId: string) {
    const items = await reportsRepository.getInventoryValuation(shopId);

    let totalValueAtCost = 0;
    let totalValueAtRetail = 0;
    let totalUnitsInStock = 0;

    const categoryMap: Record<
      string,
      {
        valueAtCost: number;
        valueAtRetail: number;
        units: number;
      }
    > = {};

    for (const item of items) {
      const quantity = item.quantity;
      const price = parseFloat(item.price);
      const cost = item.cost ? parseFloat(item.cost) : null;
      const category = item.category ?? "Uncategorized";

      const retailValue = quantity * price;
      totalValueAtRetail += retailValue;
      totalUnitsInStock += quantity;

      // Handle NULL cost — exclude from cost calc, still count in retail
      const costValue = cost !== null ? quantity * cost : 0;
      if (cost !== null) {
        totalValueAtCost += costValue;
      }

      if (!categoryMap[category]) {
        categoryMap[category] = { valueAtCost: 0, valueAtRetail: 0, units: 0 };
      }
      categoryMap[category].valueAtRetail += retailValue;
      categoryMap[category].units += quantity;
      if (cost !== null) {
        categoryMap[category].valueAtCost += costValue;
      }
    }

    const potentialProfit = totalValueAtRetail - totalValueAtCost;
    const potentialMarginPercent =
      totalValueAtRetail > 0
        ? parseFloat(((potentialProfit / totalValueAtRetail) * 100).toFixed(2))
        : 0;

    const byCategory = Object.entries(categoryMap).map(([category, data]) => ({
      category,
      valueAtCost: parseFloat(data.valueAtCost.toFixed(2)),
      valueAtRetail: parseFloat(data.valueAtRetail.toFixed(2)),
      units: data.units,
    }));

    return {
      totalValueAtCost: parseFloat(totalValueAtCost.toFixed(2)),
      totalValueAtRetail: parseFloat(totalValueAtRetail.toFixed(2)),
      potentialProfit: parseFloat(potentialProfit.toFixed(2)),
      potentialMarginPercent,
      totalUnitsInStock,
      byCategory,
    };
  }

  // ── RETURNS ANALYSIS ───────────────────────────────
  async getReturnsAnalysis(shopId: string, fromDate?: string, toDate?: string) {
    const { from, to } = this.getDateRange(fromDate, toDate);

    const {
      returnsInPeriod,
      itemsWithReasons,
      eligibleTransactions,
      productNames,
    } = await reportsRepository.getReturnsAnalysis(shopId, from, to);

    const totalReturns = returnsInPeriod.length;
    const totalRefundAmount = returnsInPeriod.reduce(
      (sum, r) => sum + parseFloat(r.totalRefund),
      0,
    );

    // returnRate — against completed + refunded + partial_refund transactions
    // (the bug fix agreed earlier: excluding only cancelled, not filtering
    // down to completed-only, which would wrongly exclude every transaction
    // that actually had a return processed against it)
    const totalTransactions = eligibleTransactions.length;
    const returnRate =
      totalTransactions > 0
        ? parseFloat(((totalReturns / totalTransactions) * 100).toFixed(2))
        : 0;

    // reasonBreakdown — item-level, per the agreed decision
    const reasonMap: Record<string, number> = {};
    for (const item of itemsWithReasons) {
      const reason = item.reason ?? "Not specified";
      reasonMap[reason] = (reasonMap[reason] ?? 0) + 1;
    }
    const reasonBreakdown = Object.entries(reasonMap)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count);

    // mostReturnedProducts — group return items by product
    const productMap: Record<
      string,
      { returnCount: number; returnValue: number }
    > = {};
    for (const item of itemsWithReasons) {
      if (!productMap[item.productId]) {
        productMap[item.productId] = { returnCount: 0, returnValue: 0 };
      }
      productMap[item.productId].returnCount += item.quantity;
      productMap[item.productId].returnValue += parseFloat(item.total);
    }

    const nameMap = new Map(productNames.map((p) => [p.productId, p.name]));

    const mostReturnedProducts = Object.entries(productMap)
      .map(([productId, data]) => ({
        productId,
        productName: nameMap.get(productId) ?? "Unknown Product",
        returnCount: data.returnCount,
        returnValue: parseFloat(data.returnValue.toFixed(2)),
      }))
      .sort((a, b) => b.returnCount - a.returnCount)
      .slice(0, 10);

    return {
      totalReturns,
      totalRefundAmount: parseFloat(totalRefundAmount.toFixed(2)),
      returnRate,
      reasonBreakdown,
      mostReturnedProducts,
    };
  }
}
