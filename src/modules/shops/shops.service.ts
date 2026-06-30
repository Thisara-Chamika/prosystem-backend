import { ShopsRepository } from "./shops.repository";
import {
  UpdateBusinessTypeInput,
  UpdateConfigurationInput,
  UpdatePluginInput,
  ShopSettings,
} from "./shops.types";
import {
  BUSINESS_TEMPLATES,
  PLUGINS_BY_BUSINESS,
  BusinessTemplate,
} from "../../enums/plugins.enum";
import { createAuditLog } from "../../utils/audit.utils";
import { AuditAction } from "../../enums/audit-actions.enum";
import { CategoriesService } from "../categories/categories.service";
import { emailService } from "../../services/EmailService";

const shopsRepository = new ShopsRepository();

export class ShopsService {
  async getMyShop(shopId: string) {
    const shop = await shopsRepository.getShopById(shopId);
    if (!shop) {
      throw new Error("Shop not found!");
    }
    return shop;
  }

  async updateBusinessType(shopId: string, input: UpdateBusinessTypeInput) {
    if (!BUSINESS_TEMPLATES.includes(input.businessType as BusinessTemplate)) {
      throw new Error(
        `Invalid business type! Valid types: ${BUSINESS_TEMPLATES.join(", ")}`,
      );
    }

    const shop = await shopsRepository.updateBusinessType(
      shopId,
      input.businessType,
    );

    if (!shop) {
      throw new Error("Shop not found!");
    }

    // ── Seed categories for new business type! ────
    const categoriesService = new CategoriesService();
    await categoriesService.seedCategoriesForBusinessType(
      shopId,
      input.businessType,
    );

    return shop;
  }

  async getAvailablePlugins(shopId: string) {
    const shop = await shopsRepository.getShopById(shopId);
    if (!shop) {
      throw new Error("Shop not found!");
    }

    const activePlugins = (shop.activePlugins as string[]) ?? [];

    const businessTemplate = activePlugins.find((p) =>
      BUSINESS_TEMPLATES.includes(p as BusinessTemplate),
    ) as BusinessTemplate | undefined;

    if (!businessTemplate) {
      return {
        businessTemplate: null,
        availablePlugins: [],
        activePlugins,
        message: "Please select a business type first!",
      };
    }

    const availablePlugins = PLUGINS_BY_BUSINESS[businessTemplate] ?? [];

    return {
      businessTemplate,
      availablePlugins,
      activePlugins,
    };
  }

  async updatePlugin(shopId: string, input: UpdatePluginInput) {
    const shop = await shopsRepository.getShopById(shopId);
    if (!shop) {
      throw new Error("Shop not found!");
    }

    const activePlugins = (shop.activePlugins as string[]) ?? [];

    const businessTemplate = activePlugins.find((p) =>
      BUSINESS_TEMPLATES.includes(p as BusinessTemplate),
    ) as BusinessTemplate | undefined;

    if (!businessTemplate) {
      throw new Error("Please select a business type first!");
    }

    const availablePlugins = PLUGINS_BY_BUSINESS[businessTemplate] ?? [];
    if (!availablePlugins.includes(input.plugin)) {
      throw new Error(
        `Plugin '${input.plugin}' is not available for ${businessTemplate}!`,
      );
    }

    if (BUSINESS_TEMPLATES.includes(input.plugin as BusinessTemplate)) {
      throw new Error("Cannot remove business template via this endpoint!");
    }

    return await shopsRepository.updatePlugin(
      shopId,
      input.plugin,
      input.action,
    );
  }

  async updateConfiguration(shopId: string, input: UpdateConfigurationInput) {
    const config: Record<string, any> = {};
    if (input.primaryColor) config.primaryColor = input.primaryColor;
    if (input.logoUrl) config.logoUrl = input.logoUrl;

    const settings: Record<string, any> = {};
    if (input.currency) settings.currency = input.currency;
    if (input.timezone) settings.timezone = input.timezone;
    if (input.shopName) settings.name = input.shopName;

    if (Object.keys(config).length > 0) {
      await shopsRepository.updateConfiguration(shopId, config);
    }

    if (Object.keys(settings).length > 0) {
      await shopsRepository.updateSettings(shopId, settings);
    }

    return await shopsRepository.getShopById(shopId);
  }

  async getSettings(shopId: string) {
    const shop = await shopsRepository.getShopById(shopId);
    if (!shop) {
      throw new Error("Shop not found!");
    }
    return shop;
  }

  async updateSettings(shopId: string, input: ShopSettings, userId: string) {
    const currentShop = await shopsRepository.getShopById(shopId);
    if (!currentShop) {
      throw new Error("Shop not found!");
    }

    const settings: Record<string, any> = {};
    if (input.shopName) settings.name = input.shopName;
    if (input.currency) settings.currency = input.currency;
    if (input.timezone) settings.timezone = input.timezone;

    const configUpdate: Record<string, any> = {};
    if (input.configuration) {
      if (input.configuration.primaryColor !== undefined)
        configUpdate.primaryColor = input.configuration.primaryColor;
      if (input.configuration.logoUrl !== undefined)
        configUpdate.logoUrl = input.configuration.logoUrl;
    } else {
      if (input.primaryColor !== undefined)
        configUpdate.primaryColor = input.primaryColor;
      if (input.logoUrl !== undefined) configUpdate.logoUrl = input.logoUrl;
    }

    if (Object.keys(settings).length > 0) {
      await shopsRepository.updateSettings(shopId, settings);
    }

    if (Object.keys(configUpdate).length > 0) {
      await shopsRepository.updateConfiguration(shopId, configUpdate);
    }

    const updatedShop = await shopsRepository.getShopById(shopId);

    await createAuditLog({
      shopId,
      userId,
      action: AuditAction.SETTINGS_UPDATED,
      entityType: "shop",
      entityId: shopId,
      details: {
        oldValues: {
          name: currentShop.name,
          currency: currentShop.currency,
          timezone: currentShop.timezone,
          configuration: currentShop.configuration,
        },
        newValues: {
          name: updatedShop?.name,
          currency: updatedShop?.currency,
          timezone: updatedShop?.timezone,
          configuration: updatedShop?.configuration,
        },
      },
    });

    return updatedShop;
  }

  async completeOnboarding(shopId: string) {
    const shop = await shopsRepository.completeOnboarding(shopId);
    if (!shop) {
      throw new Error("Shop not found!");
    }

    // ── Send shop welcome email (only once!) ──────────
    if (!shop.welcomeEmailSent) {
      try {
        await shopsRepository.markWelcomeEmailSent(shopId);

        const owner = await shopsRepository.getShopOwner(shopId);

        if (owner?.email) {
          const businessType =
            (shop.activePlugins as string[])?.[0] ?? "general";

          await emailService
            .sendShopWelcomeEmail({
              to: owner.email,
              ownerName: owner.firstName,
              shopName: shop.name,
              businessType,
            })
            .catch((err) => {
              console.error("Failed to send shop welcome email:", err);
            });
        }
      } catch (error) {
        console.error("Shop welcome email error:", error);
      }
    }

    return shop;
  }

  // Get email preferences
  async getEmailPreferences(shopId: string) {
    const shop = await shopsRepository.getShopById(shopId);
    if (!shop) {
      throw new Error("Shop not found!");
    }

    const defaults = {
      shopWelcomeEmail: true,
      staffWelcomeEmail: true,
      receiptEmails: true,
      lowStockAlerts: true,
      customerWelcomeEmails: true,
    };

    const configured = (shop.configuration as any)?.emailNotifications ?? {};

    return { ...defaults, ...configured };
  }

  // Update email preferences
  async updateEmailPreferences(
    shopId: string,
    input: {
      shopWelcomeEmail?: boolean;
      staffWelcomeEmail?: boolean;
      receiptEmails?: boolean;
      lowStockAlerts?: boolean;
      customerWelcomeEmails?: boolean;
    },
  ) {
    const shop = await shopsRepository.getShopById(shopId);
    if (!shop) {
      throw new Error("Shop not found!");
    }

    const currentConfig = (shop.configuration as any) ?? {};
    const currentPrefs = currentConfig.emailNotifications ?? {};

    const updatedPrefs = { ...currentPrefs, ...input };

    await shopsRepository.updateConfiguration(shopId, {
      emailNotifications: updatedPrefs,
    });

    return updatedPrefs;
  }
}
