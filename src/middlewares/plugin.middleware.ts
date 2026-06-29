import { Request, Response, NextFunction } from 'express';
import { pluginEngine } from '../plugins/PluginEngine';

export const requirePlugin = (pluginId: string) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const shopId = req.user!.shopId!;

      // Load plugins for this shop
      const plugins = await pluginEngine.loadPluginsForShop(shopId);
      const isActive = plugins.some(
        p => p.pluginId === pluginId && p.isActive
      );

      if (!isActive) {
        res.status(403).json({
          success: false,
          message: `Plugin '${pluginId}' is not installed for this shop!`,
        });
        return;
      }

      next();

    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Plugin check failed!',
      });
    }
  };
};