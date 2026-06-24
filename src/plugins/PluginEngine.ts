import { db } from '../config/database';
import { pluginConfigurations } from '../db/schema/plugin-configurations';
import { shops } from '../db/schema/shops';
import { eq, and } from 'drizzle-orm';
import { InstalledPlugin, HookContext, PluginManifest } from './types';
import { findPlugin, AVAILABLE_PLUGINS } from './PluginRegistry';

export class PluginEngine {

  // In-memory cache per shop
  // Map<shopId, InstalledPlugin[]>
  private loadedPlugins: Map<string, InstalledPlugin[]> = new Map();

  // ── LOAD PLUGINS FOR SHOP ─────────────────────────
  async loadPluginsForShop(shopId: string): Promise<InstalledPlugin[]> {
    // Check memory cache first
    if (this.loadedPlugins.has(shopId)) {
      return this.loadedPlugins.get(shopId)!;
    }

    // Load from database
    const configs = await db
      .select()
      .from(pluginConfigurations)
      .where(
        and(
          eq(pluginConfigurations.shopId, shopId),
          eq(pluginConfigurations.isActive, true)
        )
      );

    // Build InstalledPlugin objects
    const installed: InstalledPlugin[] = [];

    for (const config of configs) {
      const plugin = findPlugin(config.pluginId);
      if (!plugin) continue;

      installed.push({
        pluginId: config.pluginId,
        manifest: plugin.manifest,
        isActive: config.isActive ?? false,
        configuration: (config.configuration as Record<string, any>) ?? {},
        installedAt: config.installedAt,
      });
    }

    // Cache in memory
    this.loadedPlugins.set(shopId, installed);

    return installed;
  }

  // ── INSTALL PLUGIN ────────────────────────────────
  async installPlugin(shopId: string, pluginId: string): Promise<void> {
    // 1. Check plugin exists in registry
    const plugin = findPlugin(pluginId);
    if (!plugin) {
      throw new Error(`Plugin '${pluginId}' not found in registry!`);
    }

    // 2. Check not already installed
    const existing = await db
      .select()
      .from(pluginConfigurations)
      .where(
        and(
          eq(pluginConfigurations.shopId, shopId),
          eq(pluginConfigurations.pluginId, pluginId)
        )
      )
      .limit(1);

    if (existing[0]?.isActive) {
      throw new Error('Plugin already installed!');
    }

    // 3. If exists but inactive → reactivate
    if (existing[0] && !existing[0].isActive) {
      await db
        .update(pluginConfigurations)
        .set({
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(pluginConfigurations.configId, existing[0].configId));
    } else {
      // 4. Save to plugin_configurations table
      await db
        .insert(pluginConfigurations)
        .values({
          shopId,
          pluginId,
          configuration: {},
          isActive: true,
        });
    }

    // 5. Update shops.active_plugins array
    const shop = await db
      .select()
      .from(shops)
      .where(eq(shops.shopId, shopId))
      .limit(1);

    if (shop[0]) {
      const currentPlugins = (shop[0].activePlugins as string[]) ?? [];
      if (!currentPlugins.includes(pluginId)) {
        await db
          .update(shops)
          .set({
            activePlugins: [...currentPlugins, pluginId],
            updatedAt: new Date(),
          })
          .where(eq(shops.shopId, shopId));
      }
    }

    // 6. Run onInstall hook
    await this.runHook('onInstall', {
      shopId,
      userId: 'system',
      role: 'system',
      data: { pluginId },
    });

    // 7. Clear memory cache for this shop
    this.loadedPlugins.delete(shopId);

    console.log(`✅ Plugin '${pluginId}' installed for shop: ${shopId}`);
  }

  // ── UNINSTALL PLUGIN ──────────────────────────────
  async uninstallPlugin(shopId: string, pluginId: string): Promise<void> {
    // 1. Check plugin is installed
    const existing = await db
      .select()
      .from(pluginConfigurations)
      .where(
        and(
          eq(pluginConfigurations.shopId, shopId),
          eq(pluginConfigurations.pluginId, pluginId),
          eq(pluginConfigurations.isActive, true)
        )
      )
      .limit(1);

    if (!existing[0]) {
      throw new Error('Plugin not installed!');
    }

    // 2. Run onUninstall hook
    try {
      await this.runHook('onUninstall', {
        shopId,
        userId: 'system',
        role: 'system',
        data: { pluginId },
      });
    } catch (error) {
      console.error('onUninstall hook error:', error);
    }

    // 3. Set is_active = false (never delete data!)
    await db
      .update(pluginConfigurations)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(pluginConfigurations.shopId, shopId),
          eq(pluginConfigurations.pluginId, pluginId)
        )
      );

    // 4. Remove from shops.active_plugins array
    const shop = await db
      .select()
      .from(shops)
      .where(eq(shops.shopId, shopId))
      .limit(1);

    if (shop[0]) {
      const currentPlugins = (shop[0].activePlugins as string[]) ?? [];
      await db
        .update(shops)
        .set({
          activePlugins: currentPlugins.filter(p => p !== pluginId),
          updatedAt: new Date(),
        })
        .where(eq(shops.shopId, shopId));
    }

    // 5. Clear memory cache
    this.loadedPlugins.delete(shopId);

    console.log(`✅ Plugin '${pluginId}' uninstalled for shop: ${shopId}`);
  }

  // ── RUN HOOK ──────────────────────────────────────
  async runHook(hookName: string, context: HookContext): Promise<void> {
    // Get active plugins for this shop
    const plugins = context.shopId === 'system'
      ? []
      : await this.loadPluginsForShop(context.shopId);

    if (plugins.length === 0) return;

    for (const plugin of plugins) {
      // Check if plugin has this hook
      const hookHandler = plugin.manifest.hooks[hookName as keyof typeof plugin.manifest.hooks];
      if (!hookHandler) continue;

      try {
        // Load hook implementation
        const hookModule = await this.loadHookModule(plugin.pluginId);
        if (!hookModule || !hookModule[hookHandler]) continue;

        // Run the hook
        await hookModule[hookHandler](context);

      } catch (error) {
        // beforeCheckout errors MUST stop transaction!
        if (hookName === 'beforeCheckout') {
          throw error;
        }

        // afterSale errors are logged but don't fail transaction!
        console.error(
          `Hook '${hookName}' error in plugin '${plugin.pluginId}':`,
          error
        );
      }
    }
  }

  // ── CHECK IF PLUGIN IS ACTIVE ─────────────────────
  isPluginActive(shopId: string, pluginId: string): boolean {
    const plugins = this.loadedPlugins.get(shopId) ?? [];
    return plugins.some(p => p.pluginId === pluginId && p.isActive);
  }

  // ── GET PLUGIN CONFIG ─────────────────────────────
  async getPluginConfig(shopId: string, pluginId: string): Promise<any> {
    const config = await db
      .select()
      .from(pluginConfigurations)
      .where(
        and(
          eq(pluginConfigurations.shopId, shopId),
          eq(pluginConfigurations.pluginId, pluginId)
        )
      )
      .limit(1);

    return config[0]?.configuration ?? {};
  }

  // ── UPDATE PLUGIN CONFIG ──────────────────────────
  async updatePluginConfig(
    shopId: string,
    pluginId: string,
    config: any
  ): Promise<void> {
    await db
      .update(pluginConfigurations)
      .set({
        configuration: config,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(pluginConfigurations.shopId, shopId),
          eq(pluginConfigurations.pluginId, pluginId)
        )
      );

    // Clear memory cache
    this.loadedPlugins.delete(shopId);
  }

  // ── LOAD HOOK MODULE ──────────────────────────────
  private async loadHookModule(pluginId: string): Promise<any> {
    try {
      const module = await import(`./plugins/${pluginId}/hooks/index`);
      return module;
    } catch (error) {
      console.warn(`No hooks found for plugin '${pluginId}'`);
      return null;
    }
  }
}

// ── SINGLETON INSTANCE ────────────────────────────
export const pluginEngine = new PluginEngine();