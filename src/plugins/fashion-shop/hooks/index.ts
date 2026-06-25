import { db } from '../../../config/database';
import { productVariants } from '../../../db/schema/product-variants';
import { products } from '../../../db/schema/products';
import { eq, and, gt } from 'drizzle-orm';
import { HookContext } from '../../types';
import { pluginEngine } from '../../PluginEngine';

// ── ON INSTALL ────────────────────────────────────
export async function handleInstall(context: HookContext) {
  // Set default config when plugin is installed
  const defaultConfig = {
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Black', 'White', 'Red', 'Blue', 'Green'],
  };

  await pluginEngine.updatePluginConfig(
    context.shopId,
    'fashion-shop',
    defaultConfig
  );

  console.log(`✅ Fashion plugin installed for shop: ${context.shopId}`);
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
          eq(productVariants.isActive, true)
        )
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
          `Please select size and color for "${product[0]?.name ?? 'this product'}" before checkout!`
        );
      }

      // Check selected variant exists and has stock
      const selectedVariant = variants.find(
        v => v.variantId === item.variantId
      );

      if (!selectedVariant) {
        throw new Error('Selected variant not found!');
      }

      if (selectedVariant.quantity < item.quantity) {
        throw new Error(
          `Not enough stock for selected size/color. Available: ${selectedVariant.quantity}`
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