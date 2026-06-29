import { PluginManifest } from './types';

export interface AvailablePlugin {
  id: string;
  name: string;
  version: string;
  description: string;
  category: string;
  icon: string;
  features: string[];
  businessTypes: string[];
  manifest: PluginManifest;
}

export const AVAILABLE_PLUGINS: AvailablePlugin[] = [
  {
    id: 'fashion-shop',
    name: 'Fashion Shop',
    version: '1.0.0',
    description: 'Add size and color variants to your products. Perfect for clothing, footwear, and accessories.',
    category: 'retail',
    icon: '👗',
    features: [
      'Product variants (size + color)',
      'Variant specific inventory tracking',
      'Size/color selector at POS checkout',
      'Variant based sales reporting',
    ],
    businessTypes: ['fashion-shop', 'general'],
    manifest: {
      id: 'fashion-shop',
      name: 'Fashion Shop',
      version: '1.0.0',
      description: 'Add size and color variants to your products.',
      category: 'retail',
      icon: '👗',
      hooks: {
        onInstall: 'handleInstall',
        onUninstall: 'handleUninstall',
        beforeCheckout: 'validateVariantSelection',
        afterSale: 'updateVariantInventory',
      },
      routes: [],
      migrations: [],
      ui: {
        pages: [],
        posExtensions: ['VariantSelector'],
      },
    },
  },
];

// Helper — find plugin by ID
export const findPlugin = (pluginId: string): AvailablePlugin | undefined => {
  return AVAILABLE_PLUGINS.find(p => p.id === pluginId);
};