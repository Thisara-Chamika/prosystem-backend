export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  category: 'retail' | 'restaurant' | 'service' | 'healthcare';
  icon: string;
  hooks: {
    onInstall?: string;
    onUninstall?: string;
    beforeCheckout?: string;
    afterSale?: string;
    beforeProductCreate?: string;
    afterProductCreate?: string;
  };
  routes: PluginRoute[];
  migrations: string[];
  ui: {
    pages: PluginPage[];
    posExtensions: string[];
  };
}

export interface PluginRoute {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  handler: string;
  roles: string[];
}

export interface PluginPage {
  name: string;
  route: string;
  sidebar: boolean;
  roles: string[];
}

export interface HookContext {
  shopId: string;
  userId: string;
  role: string;
  data: any;
}

export interface InstalledPlugin {
  pluginId: string;
  manifest: PluginManifest;
  isActive: boolean;
  configuration: Record<string, any>;
  installedAt: Date;
}