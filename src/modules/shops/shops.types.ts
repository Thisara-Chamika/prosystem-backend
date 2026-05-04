export interface UpdateBusinessTypeInput {
  businessType: string;
}

export interface UpdateConfigurationInput {
  primaryColor?: string;
  currency?: string;
  timezone?: string;
  logoUrl?: string;
  shopName?: string;
}

export interface UpdatePluginInput {
  plugin: string;
  action: 'add' | 'remove';
}

export interface ShopSettings {
  shopName?: string;
  currency?: string;
  timezone?: string;
  primaryColor?: string;
  logoUrl?: string;
}