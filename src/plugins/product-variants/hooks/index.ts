import { db } from "../../../config/database";
import { productVariants } from "../../../db/schema/product-variants";
import { products } from "../../../db/schema/products";
import { eq, and, gt } from "drizzle-orm";
import { HookContext } from "../../types";
import { pluginEngine } from "../../PluginEngine";
import { shops } from "../../../db/schema/shops";

// ── ON INSTALL ────────────────────────────────────
export async function handleInstall(context: HookContext) {
  // Get shop's business type to pick sensible defaults
  const shopResult = await db
    .select({ businessType: shops.businessType })
    .from(shops)
    .where(eq(shops.shopId, context.shopId))
    .limit(1);

  const businessType = shopResult[0]?.businessType ?? "general";

  let defaultAttributes: Array<{ name: string; options: string[] }>;

  switch (businessType) {
    case "fashion-shop":
      defaultAttributes = [
        { name: "Size", options: ["XS", "S", "M", "L", "XL", "XXL"] },
        { name: "Color", options: ["Black", "White", "Red", "Blue", "Green"] },
      ];
      break;
    case "electronics-shop":
      defaultAttributes = [
        { name: "Storage", options: ["64GB", "128GB", "256GB", "512GB"] },
        { name: "Color", options: ["Black", "White", "Silver", "Gold"] },
      ];
      break;
    case "salon":
      defaultAttributes = [
        { name: "Volume", options: ["200ml", "400ml", "750ml", "1000ml"] },
        { name: "Type", options: ["Dry", "Oily", "Normal", "Colored"] },
      ];
      break;
    case "pharmacy":
      defaultAttributes = [
        { name: "Dosage", options: ["250mg", "500mg", "1000mg"] },
        { name: "Form", options: ["Tablet", "Capsule", "Syrup", "Injection"] },
      ];
      break;
    default:
      defaultAttributes = [
        { name: "Variant 1", options: ["Option A", "Option B"] },
        { name: "Variant 2", options: ["Option X", "Option Y"] },
      ];
  }

  await pluginEngine.updatePluginConfig(context.shopId, "product-variants", {
    attributes: defaultAttributes,
  });

  console.log(
    `✅ Product Variants plugin installed for shop: ${context.shopId} (business type: ${businessType})`,
  );
}

// ── ON UNINSTALL ──────────────────────────────────
export async function handleUninstall(context: HookContext) {
  console.log(`✅ Fashion plugin uninstalled for shop: ${context.shopId}`);
}

// ── BEFORE CHECKOUT ───────────────────────────────
export async function validateVariantSelection(context: HookContext) {
  const { items } = context.data;

  for (const item of items) {
    // Check if this product has any active variants
    const variants = await db
      .select()
      .from(productVariants)
      .where(
        and(
          eq(productVariants.productId, item.productId),
          eq(productVariants.isActive, true),
        ),
      );

    const hasVariants = variants.length > 0;

    if (hasVariants) {
      // Must have variantId selected!
      if (!item.variantId) {
        // Get product name for error message
        const product = await db
          .select()
          .from(products)
          .where(eq(products.productId, item.productId))
          .limit(1);

        throw new Error(
          `Please select variant options for "${product[0]?.name ?? "this product"}" before checkout!`,
        );
      }

      // Check selected variant exists and has stock
      const selectedVariant = variants.find(
        (v) => v.variantId === item.variantId,
      );

      if (!selectedVariant) {
        throw new Error("Selected variant not found!");
      }

      if (selectedVariant.quantity < item.quantity) {
        throw new Error(
          `Not enough stock for selected size/color. Available: ${selectedVariant.quantity}`,
        );
      }
    }
  }

  // All checks passed!
}

// ── AFTER SALE ────────────────────────────────────
export async function updateVariantInventory(context: HookContext) {
  const { items } = context.data;

  for (const item of items) {
    if (!item.variantId) continue;

    // Get current variant
    const variant = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.variantId, item.variantId))
      .limit(1);

    if (variant[0]) {
      // Deduct quantity
      await db
        .update(productVariants)
        .set({
          quantity: variant[0].quantity - item.quantity,
          updatedAt: new Date(),
        })
        .where(eq(productVariants.variantId, item.variantId));
    }
  }
}
