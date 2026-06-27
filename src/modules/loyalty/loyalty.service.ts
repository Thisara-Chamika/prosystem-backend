import { LoyaltyRepository } from './loyalty.repository';

const loyaltyRepository = new LoyaltyRepository();

// Default settings if none configured
const DEFAULT_SETTINGS = {
  isEnabled: true,
  pointsPer100: 1,
  pointsToRedeem: 100,
  redeemValue: 50,
  silverThreshold: 501,
  goldThreshold: 2001,
};

export class LoyaltyService {

  // ── SETTINGS ──────────────────────────────────────

  async getSettings(shopId: string) {
    const settings = await loyaltyRepository.getSettings(shopId);

    // Return defaults if not configured yet
    if (!settings) {
      return {
        ...DEFAULT_SETTINGS,
        shopId,
        isNew: true,
      };
    }

    return {
      settingId: settings.settingId,
      shopId: settings.shopId,
      isEnabled: settings.isEnabled,
      pointsPer100: parseFloat(settings.pointsPer100 ?? '1'),
      pointsToRedeem: settings.pointsToRedeem ?? 100,
      redeemValue: parseFloat(settings.redeemValue ?? '50'),
      silverThreshold: settings.silverThreshold ?? 501,
      goldThreshold: settings.goldThreshold ?? 2001,
    };
  }

  async updateSettings(shopId: string, input: {
    isEnabled?: boolean;
    pointsPer100?: number;
    pointsToRedeem?: number;
    redeemValue?: number;
    silverThreshold?: number;
    goldThreshold?: number;
  }) {
    // Validate thresholds
    if (input.silverThreshold && input.goldThreshold) {
      if (input.silverThreshold >= input.goldThreshold) {
        throw new Error(
          'Gold threshold must be higher than silver threshold!'
        );
      }
    }

    return await loyaltyRepository.upsertSettings(shopId, input);
  }

  // ── TIER CALCULATION ──────────────────────────────

  calculateTier(
    totalPointsEarned: number,
    settings: typeof DEFAULT_SETTINGS
  ): 'bronze' | 'silver' | 'gold' {
    if (totalPointsEarned >= settings.goldThreshold) return 'gold';
    if (totalPointsEarned >= settings.silverThreshold) return 'silver';
    return 'bronze';
  }

  // ── POINTS CALCULATION ────────────────────────────

  calculatePointsEarned(
    amount: number,
    settings: typeof DEFAULT_SETTINGS
  ): number {
    if (!settings.isEnabled) return 0;
    return Math.floor(amount / 100 * settings.pointsPer100);
  }

  // ── EARN POINTS ───────────────────────────────────

  async earnPoints(
    customerId: string,
    shopId: string,
    transactionId: string,
    purchaseAmount: number
  ): Promise<void> {
    const settings = await this.getSettings(shopId);
    if (!settings.isEnabled) return;

    const points = this.calculatePointsEarned(purchaseAmount, settings);
    if (points === 0) return;

    const customer = await loyaltyRepository
      .getCustomerById(customerId, shopId);
    if (!customer) return;

    const balanceBefore = customer.pointsBalance;
    const balanceAfter = balanceBefore + points;
    const totalPointsEarned = customer.totalPointsEarned + points;
    const newTier = this.calculateTier(totalPointsEarned, settings);
    const currentSpent = parseFloat(
      customer.totalSpent?.toString() ?? '0'
    );

    // Update customer
    await loyaltyRepository.updateCustomerLoyalty(customerId, {
      pointsBalance: balanceAfter,
      totalPointsEarned,
      loyaltyTier: newTier,
      totalSpent: currentSpent + purchaseAmount,
      incrementVisit: true,
    });

    // Record loyalty transaction
    await loyaltyRepository.createLoyaltyTransaction({
      shopId,
      customerId,
      transactionId,
      type: 'earn',
      points,
      balanceBefore,
      balanceAfter,
      description: `Purchase ${transactionId}`,
    });
  }

  // ── REDEEM POINTS ─────────────────────────────────

  async redeemPoints(
    customerId: string,
    shopId: string,
    pointsToRedeem: number
  ): Promise<{ discountAmount: number; newBalance: number }> {
    const settings = await this.getSettings(shopId);

    if (!settings.isEnabled) {
      throw new Error('Loyalty program is not enabled!');
    }

    const customer = await loyaltyRepository
      .getCustomerById(customerId, shopId);
    if (!customer) {
      throw new Error('Customer not found!');
    }

    // Validate points balance
    if (customer.pointsBalance < pointsToRedeem) {
      throw new Error(
        `Insufficient points balance! Available: ${customer.pointsBalance}`
      );
    }

    // Validate multiples
    if (pointsToRedeem % settings.pointsToRedeem !== 0) {
      throw new Error(
        `Points must be redeemed in multiples of ${settings.pointsToRedeem}!`
      );
    }

    // Calculate discount
    const discountAmount = (pointsToRedeem / settings.pointsToRedeem)
      * settings.redeemValue;

    const balanceBefore = customer.pointsBalance;
    const balanceAfter = balanceBefore - pointsToRedeem;

    // Update customer balance
    await loyaltyRepository.updateCustomerLoyalty(customerId, {
      pointsBalance: balanceAfter,
      totalPointsEarned: customer.totalPointsEarned,
      loyaltyTier: customer.loyaltyTier,
    });

    // Record loyalty transaction
    await loyaltyRepository.createLoyaltyTransaction({
      shopId,
      customerId,
      type: 'redeem',
      points: -pointsToRedeem,
      balanceBefore,
      balanceAfter,
      description: `Redeemed ${pointsToRedeem} points for discount`,
    });

    return {
      discountAmount,
      newBalance: balanceAfter,
    };
  }

  // ── CUSTOMER PROFILE ──────────────────────────────

  async getCustomerProfile(customerId: string, shopId: string) {
    const profile = await loyaltyRepository
      .getCustomerProfile(customerId, shopId);

    if (!profile) {
      throw new Error('Customer not found!');
    }

    return profile;
  }

  // ── CUSTOMER LOYALTY SUMMARY ──────────────────────

  async getCustomerLoyalty(customerId: string, shopId: string) {
    const customer = await loyaltyRepository
      .getCustomerById(customerId, shopId);

    if (!customer) {
      throw new Error('Customer not found!');
    }

    const history = await loyaltyRepository
      .getLoyaltyHistory(customerId, shopId);

    const settings = await this.getSettings(shopId);

    return {
      customerId: customer.customerId,
      firstName: customer.firstName,
      lastName: customer.lastName,
      pointsBalance: customer.pointsBalance,
      totalPointsEarned: customer.totalPointsEarned,
      loyaltyTier: customer.loyaltyTier,
      totalSpent: customer.totalSpent,
      totalVisits: customer.totalVisits,
      lastVisit: customer.lastVisit,
      nextTier: this.getNextTierInfo(
        customer.totalPointsEarned,
        settings
      ),
      history,
    };
  }

  // Helper — get next tier info
  private getNextTierInfo(
    totalPointsEarned: number,
    settings: typeof DEFAULT_SETTINGS
  ) {
    if (totalPointsEarned >= settings.goldThreshold) {
      return { tier: 'gold', pointsNeeded: 0, message: 'Maximum tier reached!' };
    }
    if (totalPointsEarned >= settings.silverThreshold) {
      const needed = settings.goldThreshold - totalPointsEarned;
      return { tier: 'gold', pointsNeeded: needed,
        message: `${needed} more points to Gold!` };
    }
    const needed = settings.silverThreshold - totalPointsEarned;
    return { tier: 'silver', pointsNeeded: needed,
      message: `${needed} more points to Silver!` };
  }
}

export const loyaltyService = new LoyaltyService();