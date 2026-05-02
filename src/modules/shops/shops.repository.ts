import { db } from '../../config/database';
import { shops } from '../../db/schema/shops';
import { eq } from 'drizzle-orm';

export class ShopsRepository {

  // Get shop by ID
  async getShopById(shopId: string) {
    const result = await db
      .select()
      .from(shops)
      .where(eq(shops.shopId, shopId))
      .limit(1);

    return result[0] ?? null;
  }

  // Update business type
  async updateBusinessType(shopId: string, businessType: string) {
    const result = await db
      .update(shops)
      .set({
        activePlugins: [businessType],
        updatedAt: new Date(),
      })
      .where(eq(shops.shopId, shopId))
      .returning();

    return result[0] ?? null;
  }

  // Update plugin (add or remove)
  async updatePlugin(shopId: string, plugin: string, action: 'add' | 'remove') {
    // Get current shop
    const shop = await this.getShopById(shopId);
    if (!shop) return null;

    const currentPlugins = (shop.activePlugins as string[]) ?? [];

    let updatedPlugins: string[];

    if (action === 'add') {
      // Add plugin if not already exists
      if (currentPlugins.includes(plugin)) {
        return shop; // Already exists — return as is
      }
      updatedPlugins = [...currentPlugins, plugin];
    } else {
      // Remove plugin — but never remove business template!
      updatedPlugins = currentPlugins.filter(p => p !== plugin);
    }

    const result = await db
      .update(shops)
      .set({
        activePlugins: updatedPlugins,
        updatedAt: new Date(),
      })
      .where(eq(shops.shopId, shopId))
      .returning();

    return result[0] ?? null;
  }

  // Update configuration
  async updateConfiguration(shopId: string, config: Record<string, any>) {
    // Get current config first
    const shop = await this.getShopById(shopId);
    if (!shop) return null;

    const currentConfig = (shop.configuration as Record<string, any>) ?? {};

    // Merge new config with existing
    const updatedConfig = {
      ...currentConfig,
      ...config,
    };

    const result = await db
      .update(shops)
      .set({
        configuration: updatedConfig,
        updatedAt: new Date(),
      })
      .where(eq(shops.shopId, shopId))
      .returning();

    return result[0] ?? null;
  }

  // Update shop settings
  async updateSettings(shopId: string, settings: Record<string, any>) {
    const result = await db
      .update(shops)
      .set({
        ...settings,
        updatedAt: new Date(),
      })
      .where(eq(shops.shopId, shopId))
      .returning();

    return result[0] ?? null;
  }
}