import { PluginManifest } from "./types";

export interface AvailablePlugin {
  id: string;
  name: string;
  version: string;
  description: string;
  category: "generic" | "specific";
  icon: string;
  features: string[];
  compatible_with: string[];
  auto_install_for: string[];
  manifest: PluginManifest;
}

const ALL_BUSINESS_TYPES = [
  "fashion-shop",
  "salon",
  "restaurant",
  "pharmacy",
  "supermarket",
  "electronics-shop",
  "general",
];

export const AVAILABLE_PLUGINS: AvailablePlugin[] = [
  // ── REAL PLUGIN (has hooks + migrations) ──────────
  {
    id: "product-variants",
    name: "Product Variants",
    version: "1.0.0",
    description:
      "Add custom variants to any product. Configure your own attributes like size, color, volume, type.",
    category: "generic",
    icon: "🎨",
    features: [
      "Custom variant attributes (size, color, volume, type etc.)",
      "Variant specific inventory tracking",
      "Variant selector at POS checkout",
      "Variant sales reporting",
    ],
    compatible_with: [
      "fashion-shop",
      "electronics-shop",
      "salon",
      "pharmacy",
      "supermarket",
      "general",
    ],
    auto_install_for: ["fashion-shop", "electronics-shop"],
    manifest: {
      id: "product-variants",
      name: "Product Variants",
      version: "1.0.0",
      description: "Add custom variants to any product.",
      category: "retail",
      icon: "🎨",
      hooks: {
        onInstall: "handleInstall",
        onUninstall: "handleUninstall",
        beforeCheckout: "validateVariantSelection",
        afterSale: "updateVariantInventory",
      },
      routes: [],
      migrations: [],
      ui: {
        pages: [],
        posExtensions: ["VariantSelector"],
      },
    },
  },

  // ── PLANNED PLUGINS (no hooks built yet) ──────────
  {
    id: "appointment-booking",
    name: "Appointment Booking",
    version: "1.0.0",
    description:
      "Schedule appointments, manage staff availability, and track bookings.",
    category: "generic",
    icon: "📅",
    features: [
      "Appointment calendar",
      "Staff availability management",
      "Customer booking history",
      "Reminder notifications",
    ],
    compatible_with: ["salon", "general"],
    auto_install_for: ["salon"],
    manifest: {
      id: "appointment-booking",
      name: "Appointment Booking",
      version: "1.0.0",
      description:
        "Schedule appointments, manage staff availability, and track bookings.",
      category: "service",
      icon: "📅",
      hooks: {}, // ← no hooks yet, just installable
      routes: [],
      migrations: [],
      ui: { pages: [], posExtensions: [] },
    },
  },
];

// ── Helper: find plugin by ID ─────────────────────
export const findPlugin = (pluginId: string): AvailablePlugin | undefined => {
  return AVAILABLE_PLUGINS.find((p) => p.id === pluginId);
};

// ── Helper: get plugins to auto-install for a business type ──
export const getAutoInstallPlugins = (businessType: string): string[] => {
  return AVAILABLE_PLUGINS.filter((p) =>
    p.auto_install_for.includes(businessType),
  ).map((p) => p.id);
};

// ── Helper: get compatible plugins for a business type ──
export const getCompatiblePlugins = (
  businessType: string,
): AvailablePlugin[] => {
  return AVAILABLE_PLUGINS.filter(
    (p) =>
      p.compatible_with.includes(businessType) ||
      p.compatible_with.includes("general"),
  );
};
