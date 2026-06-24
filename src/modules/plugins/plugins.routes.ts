import { Router } from 'express';
import { PluginsController } from './plugins.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';

const router = Router();
const pluginsController = new PluginsController();

router.use(authenticate);

// GET /api/plugins — list all with install status
router.get(
  '/',
  authorize('shop_owner'),
  pluginsController.getPlugins.bind(pluginsController)
);

// POST /api/plugins/:pluginId/install
router.post(
  '/:pluginId/install',
  authorize('shop_owner'),
  pluginsController.installPlugin.bind(pluginsController)
);

// DELETE /api/plugins/:pluginId/uninstall
router.delete(
  '/:pluginId/uninstall',
  authorize('shop_owner'),
  pluginsController.uninstallPlugin.bind(pluginsController)
);

// GET /api/plugins/:pluginId/config
router.get(
  '/:pluginId/config',
  authorize('shop_owner', 'shop_manager'),
  pluginsController.getPluginConfig.bind(pluginsController)
);

// PUT /api/plugins/:pluginId/config
router.put(
  '/:pluginId/config',
  authorize('shop_owner'),
  pluginsController.updatePluginConfig.bind(pluginsController)
);

export default router;