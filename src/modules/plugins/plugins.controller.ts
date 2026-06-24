import { Request, Response } from 'express';
import { pluginEngine } from '../../plugins/PluginEngine';
import { AVAILABLE_PLUGINS } from '../../plugins/PluginRegistry';
import { db } from '../../config/database';
import { pluginConfigurations } from '../../db/schema/plugin-configurations';
import { eq, and } from 'drizzle-orm';

export class PluginsController {

  // GET /api/plugins
  async getPlugins(req: Request, res: Response): Promise<void> {
    try {
      const shopId = req.user!.shopId!;

      // Get all installed plugins for this shop
      const installed = await db
        .select()
        .from(pluginConfigurations)
        .where(eq(pluginConfigurations.shopId, shopId));

      // Build response with install status
      const data = AVAILABLE_PLUGINS.map(plugin => {
        const installedConfig = installed.find(
          i => i.pluginId === plugin.id
        );

        return {
          id: plugin.id,
          name: plugin.name,
          version: plugin.version,
          description: plugin.description,
          category: plugin.category,
          icon: plugin.icon,
          features: plugin.features,
          businessTypes: plugin.businessTypes,
          isInstalled: installedConfig?.isActive ?? false,
          isActive: installedConfig?.isActive ?? false,
          installedAt: installedConfig?.installedAt ?? null,
          configuration: installedConfig?.configuration ?? {},
        };
      });

      res.status(200).json({
        success: true,
        data,
      });

    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // POST /api/plugins/:pluginId/install
  async installPlugin(req: Request, res: Response): Promise<void> {
    try {
      const shopId = req.user!.shopId!;
      const { pluginId } = req.params;

      await pluginEngine.installPlugin(shopId, pluginId);

      res.status(200).json({
        success: true,
        message: `Plugin '${pluginId}' installed successfully!`,
        data: { pluginId },
      });

    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // DELETE /api/plugins/:pluginId/uninstall
  async uninstallPlugin(req: Request, res: Response): Promise<void> {
    try {
      const shopId = req.user!.shopId!;
      const { pluginId } = req.params;

      await pluginEngine.uninstallPlugin(shopId, pluginId);

      res.status(200).json({
        success: true,
        message: `Plugin '${pluginId}' uninstalled successfully!`,
      });

    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // GET /api/plugins/:pluginId/config
  async getPluginConfig(req: Request, res: Response): Promise<void> {
    try {
      const shopId = req.user!.shopId!;
      const { pluginId } = req.params;

      const configuration = await pluginEngine.getPluginConfig(
        shopId,
        pluginId
      );

      res.status(200).json({
        success: true,
        data: { pluginId, configuration },
      });

    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // PUT /api/plugins/:pluginId/config
  async updatePluginConfig(req: Request, res: Response): Promise<void> {
    try {
      const shopId = req.user!.shopId!;
      const { pluginId } = req.params;
      const { configuration } = req.body;

      await pluginEngine.updatePluginConfig(shopId, pluginId, configuration);

      res.status(200).json({
        success: true,
        message: 'Plugin configuration updated successfully!',
        data: { pluginId, configuration },
      });

    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}