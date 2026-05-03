import { ShopsRepository } from './shops.repository';
import {
  UpdateBusinessTypeInput,
  UpdateConfigurationInput,
  UpdatePluginInput,
  ShopSettings
} from './shops.types';
import {
  BUSINESS_TEMPLATES,
  PLUGINS_BY_BUSINESS,
  BusinessTemplate
} from '../../enums/plugins.enum';

const shopsRepository = new ShopsRepository();

export class ShopsService {

  // Get current shop
  async getMyShop(shopId: string) {
    const shop = await shopsRepository.getShopById(shopId);
    if (!shop) {
      throw new Error('Shop not found!');
    }
    return shop;
  }

  // Update business type
  async updateBusinessType(shopId: string, input: UpdateBusinessTypeInput) {
    // Validate business type exists
    if (!BUSINESS_TEMPLATES.includes(input.businessType as BusinessTemplate)) {
      throw new Error(
        `Invalid business type! Valid types: ${BUSINESS_TEMPLATES.join(', ')}`
      );
    }

    const shop = await shopsRepository.updateBusinessType(
      shopId,
      input.businessType
    );

    if (!shop) {
      throw new Error('Shop not found!');
    }

    return shop;
  }

  // Get available plugins for shop's business type
  async getAvailablePlugins(shopId: string) {
    const shop = await shopsRepository.getShopById(shopId);
    if (!shop) {
      throw new Error('Shop not found!');
    }

    const activePlugins = (shop.activePlugins as string[]) ?? [];

    // Find business template from active plugins
    const businessTemplate = activePlugins.find(p =>
      BUSINESS_TEMPLATES.includes(p as BusinessTemplate)
    ) as BusinessTemplate | undefined;

    if (!businessTemplate) {
      return {
        businessTemplate: null,
        availablePlugins: [],
        activePlugins,
        message: 'Please select a business type first!'
      };
    }

    const availablePlugins = PLUGINS_BY_BUSINESS[businessTemplate] ?? [];

    return {
      businessTemplate,
      availablePlugins,
      activePlugins,
    };
  }

  // Update plugin (add or remove)
  async updatePlugin(shopId: string, input: UpdatePluginInput) {
    const shop = await shopsRepository.getShopById(shopId);
    if (!shop) {
      throw new Error('Shop not found!');
    }

    const activePlugins = (shop.activePlugins as string[]) ?? [];

    // Find business template
    const businessTemplate = activePlugins.find(p =>
      BUSINESS_TEMPLATES.includes(p as BusinessTemplate)
    ) as BusinessTemplate | undefined;

    if (!businessTemplate) {
      throw new Error('Please select a business type first!');
    }

    // Validate plugin belongs to their business type
    const availablePlugins = PLUGINS_BY_BUSINESS[businessTemplate] ?? [];
    if (!availablePlugins.includes(input.plugin)) {
      throw new Error(
        `Plugin '${input.plugin}' is not available for ${businessTemplate}!`
      );
    }

    // Cannot remove business template via this endpoint
    if (BUSINESS_TEMPLATES.includes(input.plugin as BusinessTemplate)) {
      throw new Error('Cannot remove business template via this endpoint. Use PUT /api/shops/business-type instead!');
    }

    const updated = await shopsRepository.updatePlugin(
      shopId,
      input.plugin,
      input.action
    );

    return updated;
  }

  // Update configuration
  async updateConfiguration(shopId: string, input: UpdateConfigurationInput) {
    const config: Record<string, any> = {};

    if (input.primaryColor) config.primaryColor = input.primaryColor;
    if (input.logoUrl) config.logoUrl = input.logoUrl;

    // Update shop table directly for currency, timezone, name
    const settings: Record<string, any> = {};
    if (input.currency) settings.currency = input.currency;
    if (input.timezone) settings.timezone = input.timezone;
    if (input.shopName) settings.name = input.shopName;

    // Update configuration JSONB
    if (Object.keys(config).length > 0) {
      await shopsRepository.updateConfiguration(shopId, config);
    }

    // Update shop settings
    if (Object.keys(settings).length > 0) {
      await shopsRepository.updateSettings(shopId, settings);
    }

    // Return updated shop
    return await shopsRepository.getShopById(shopId);
  }

  // Get shop settings
  async getSettings(shopId: string) {
    const shop = await shopsRepository.getShopById(shopId);
    if (!shop) {
      throw new Error('Shop not found!');
    }
    return shop;
  }

  // Update shop settings
  async updateSettings(shopId: string, input: ShopSettings) {
    const settings: Record<string, any> = {};

    if (input.shopName) settings.name = input.shopName;
    if (input.currency) settings.currency = input.currency;
    if (input.timezone) settings.timezone = input.timezone;

    const config: Record<string, any> = {};
    if (input.primaryColor) config.primaryColor = input.primaryColor;
    if (input.logoUrl) config.logoUrl = input.logoUrl;

    if (Object.keys(settings).length > 0) {
      await shopsRepository.updateSettings(shopId, settings);
    }

    if (Object.keys(config).length > 0) {
      await shopsRepository.updateConfiguration(shopId, config);
    }

    return await shopsRepository.getShopById(shopId);
  }

  // Complete onboarding
async completeOnboarding(shopId: string) {
  const shop = await shopsRepository.completeOnboarding(shopId);
  if (!shop) {
    throw new Error('Shop not found!');
  }
  return shop;
}
}