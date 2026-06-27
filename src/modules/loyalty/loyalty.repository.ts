import { db } from '../../config/database';
import { loyaltySettings } from '../../db/schema/loyalty-settings';
import { loyaltyTransactions } from '../../db/schema/loyalty-transactions';
import { customers } from '../../db/schema/customers';
import { transactions } from '../../db/schema/transactions';
import { eq, and, desc } from 'drizzle-orm';

export class LoyaltyRepository {

  // ── SETTINGS ──────────────────────────────────────

  // Get loyalty settings for shop
  async getSettings(shopId: string) {
    const result = await db
      .select()
      .from(loyaltySettings)
      .where(eq(loyaltySettings.shopId, shopId))
      .limit(1);

    return result[0] ?? null;
  }

  // Upsert loyalty settings
  async upsertSettings(shopId: string, input: {
    isEnabled?: boolean;
    pointsPer100?: number;
    pointsToRedeem?: number;
    redeemValue?: number;
    silverThreshold?: number;
    goldThreshold?: number;
  }) {
    const result = await db
      .insert(loyaltySettings)
      .values({
        shopId,
        isEnabled: input.isEnabled ?? true,
        pointsPer100: input.pointsPer100
          ? String(input.pointsPer100) : '1',
        pointsToRedeem: input.pointsToRedeem ?? 100,
        redeemValue: input.redeemValue
          ? String(input.redeemValue) : '50',
        silverThreshold: input.silverThreshold ?? 501,
        goldThreshold: input.goldThreshold ?? 2001,
      })
      .onConflictDoUpdate({
        target: loyaltySettings.shopId,
        set: {
          isEnabled: input.isEnabled ?? true,
          pointsPer100: input.pointsPer100
            ? String(input.pointsPer100) : '1',
          pointsToRedeem: input.pointsToRedeem ?? 100,
          redeemValue: input.redeemValue
            ? String(input.redeemValue) : '50',
          silverThreshold: input.silverThreshold ?? 501,
          goldThreshold: input.goldThreshold ?? 2001,
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  }

  // ── CUSTOMER ──────────────────────────────────────

  // Get customer by ID
  async getCustomerById(customerId: string, shopId: string) {
    const result = await db
      .select()
      .from(customers)
      .where(
        and(
          eq(customers.customerId, customerId),
          eq(customers.shopId, shopId)
        )
      )
      .limit(1);

    return result[0] ?? null;
  }

  // Update customer loyalty stats
  async updateCustomerLoyalty(
    customerId: string,
    data: {
      pointsBalance: number;
      totalPointsEarned: number;
      loyaltyTier: string;
      totalSpent?: number;
      incrementVisit?: boolean;
    }
  ) {
    const updateData: any = {
      pointsBalance: data.pointsBalance,
      totalPointsEarned: data.totalPointsEarned,
      loyaltyTier: data.loyaltyTier,
      updatedAt: new Date(),
    };

    if (data.totalSpent !== undefined) {
      updateData.totalSpent = String(data.totalSpent);
    }

    if (data.incrementVisit) {
      const customer = await db
        .select()
        .from(customers)
        .where(eq(customers.customerId, customerId))
        .limit(1);

      if (customer[0]) {
        updateData.totalVisits = customer[0].totalVisits + 1;
        updateData.lastVisit = new Date();
      }
    }

    await db
      .update(customers)
      .set(updateData)
      .where(eq(customers.customerId, customerId));
  }

  // ── LOYALTY TRANSACTIONS ──────────────────────────

  // Create loyalty transaction record
  async createLoyaltyTransaction(data: {
    shopId: string;
    customerId: string;
    transactionId?: string;
    type: 'earn' | 'redeem';
    points: number;
    balanceBefore: number;
    balanceAfter: number;
    description: string;
  }) {
    const result = await db
      .insert(loyaltyTransactions)
      .values(data)
      .returning();

    return result[0];
  }

  // Get loyalty history for customer
  async getLoyaltyHistory(customerId: string, shopId: string) {
    return await db
      .select()
      .from(loyaltyTransactions)
      .where(
        and(
          eq(loyaltyTransactions.customerId, customerId),
          eq(loyaltyTransactions.shopId, shopId)
        )
      )
      .orderBy(desc(loyaltyTransactions.createdAt))
      .limit(20);
  }

  // Get customer profile with recent transactions
  async getCustomerProfile(customerId: string, shopId: string) {
    // Get customer
    const customer = await this.getCustomerById(customerId, shopId);
    if (!customer) return null;

    // Get recent transactions
    const recentTxns = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.customerId, customerId),
          eq(transactions.shopId, shopId)
        )
      )
      .orderBy(desc(transactions.createdAt))
      .limit(5);

    // Get loyalty history
    const loyaltyHistory = await this.getLoyaltyHistory(
      customerId,
      shopId
    );

    return {
      ...customer,
      recentTransactions: recentTxns,
      loyaltyHistory,
    };
  }
}