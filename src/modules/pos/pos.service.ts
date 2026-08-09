import { PosRepository } from "./pos.repository";
import { CreateTransactionInput, TransactionFilters } from "./pos.types";
import { ProductsRepository } from "../products/products.repository";
import { pluginEngine } from "../../plugins/PluginEngine";
import { loyaltyService } from "../loyalty/loyalty.service";
import { emailService } from "../../services/EmailService";
import { ShopsRepository } from "../shops/shops.repository";
import { checkAndSendLowStockAlerts } from "../../utils/low-stock-alert.utils";
import { paymentsService } from "../payments/payments.service";

const posRepository = new PosRepository();
const productsRepository = new ProductsRepository();
const shopsRepository = new ShopsRepository();

export class PosService {
  // Create transaction (main POS operation)
  async createTransaction(
    input: CreateTransactionInput,
    shopId: string,
    userId: string,
    role: string = "cashier",
  ) {
    // 1. Validate all items and calculate totals
    let subtotal = 0;
    let totalTax = 0;
    const itemsToCreate = [];

    for (const item of input.items) {
      // Get product with inventory
      const product = await posRepository.getProductWithInventory(
        item.productId,
        shopId,
      );

      if (!product) {
        throw new Error(`Product ${item.productId} not found!`);
      }

      // Check stock availability
      if (
        product.productType !== "service" &&
        product.trackInventory &&
        product.inventory
      ) {
        const available =
          product.inventory.quantity - product.inventory.reserved;
        if (available < item.quantity) {
          throw new Error(
            `Insufficient stock for ${product.name}! Available: ${available}`,
          );
        }
      }

      // Calculate item total
      // Calculate item total — base price + variant adjustment if applicable
  let unitPrice = parseFloat(product.price);

  if (item.variantId) {
    const variant = await posRepository.getVariantPriceAdjustment(
      item.variantId,
      shopId
    );

    if (!variant) {
      throw new Error(
        `Selected variant not found for ${product.name}!`
      );
    }

    const priceAdjustment = parseFloat(variant.priceAdjustment ?? '0');
    unitPrice += priceAdjustment;
  }

  const itemDiscount = item.discount ?? 0;
  const itemSubtotal = unitPrice * item.quantity - itemDiscount;

      // ── Calculate tax per product ──────────────────
      const productTaxRate = parseFloat(product.taxRate ?? "0") / 100;
      const itemTax = itemSubtotal * productTaxRate;

      subtotal += itemSubtotal;
      totalTax += itemTax;

      itemsToCreate.push({
        shopId,
        productId: item.productId,
        productName: product.name,
        productSku: product.sku,
        quantity: item.quantity,
        unitPrice: String(unitPrice),
        discount: String(itemDiscount),
        total: String(itemSubtotal),
        transactionId: "",
        productType: product.productType,
        trackInventory: product.trackInventory,
        variantId: item.variantId ?? null,
      });
    }

    // 2. Calculate tax and total
    const discount = input.discount ?? 0;
    const tax = totalTax;
    const total = subtotal - discount + tax;

    if (total < 0) {
      throw new Error(
        `Calculated transaction total is negative (${total.toFixed(2)}). ` +
        `Check the discount value — subtotal: ${subtotal.toFixed(2)}, ` +
        `tax: ${tax.toFixed(2)}, discount: ${discount.toFixed(2)}.`
      );
    }

    // ── Verify card payment with Stripe (never trust the frontend!) ──
    let stripeChargeId: string | undefined;

    if (input.paymentMethod === "card") {
      if (!input.stripePaymentIntentId) {
        throw new Error("stripePaymentIntentId is required for card payments!");
      }

      const intent = await paymentsService.retrievePaymentIntent(
        input.stripePaymentIntentId
      );

      if (intent.status !== "succeeded") {
        throw new Error("Payment not confirmed. Cannot complete sale.");
      }

      const expectedAmountInCents = Math.round(total * 100);
      const toleranceCents = 1; // ±1 cent, absorbs floating-point rounding only
      const difference = Math.abs(intent.amount - expectedAmountInCents);

      if (difference > toleranceCents) {
        // Genuine mismatch beyond rounding tolerance — refund immediately
        // so the customer is never left charged with no transaction record.
        await paymentsService.refundPaymentIntent(input.stripePaymentIntentId);

        throw new Error(
          `Payment amount mismatch (charged: ${intent.amount}, expected: ${expectedAmountInCents}). ` +
          `The charge has been automatically refunded.`
        );
      }

      // Extract the charge id for storage — Stripe's newer API versions
      // nest this under latest_charge rather than a top-level charges list.
      stripeChargeId = typeof intent.latest_charge === "string"
        ? intent.latest_charge
        : intent.latest_charge?.id;
    }
    // ──────────────────────────────────────────────────────────────

    // ── beforeCheckout hook ───────────────────────────
    await pluginEngine.runHook("beforeCheckout", {
      shopId,
      userId,
      role,
      data: {
        items: itemsToCreate,
        customerId: input.customerId,
        discount: input.discount,
      },
    });

    // 3. Generate transaction number
    const transactionNumber =
      await posRepository.generateTransactionNumber(shopId);

    // 4. Create transaction
    const result = await posRepository.createTransaction(
      {
        shopId,
        transactionNumber,
        customerId: input.customerId ?? null,
        cashierId: userId,
        subtotal: String(subtotal),
        tax: String(tax),
        discount: String(discount),
        total: String(total),
        paymentMethod: input.paymentMethod,
        paymentStatus: "paid",
        status: "completed",
        notes: input.notes,
        stripePaymentIntentId: input.stripePaymentIntentId ?? null,
        stripeChargeId: stripeChargeId ?? null,
        createdBy: userId,
        updatedBy: userId,
      },
      itemsToCreate,
    );

    // ── afterSale hook ────────────────────────────────
    try {
      await pluginEngine.runHook("afterSale", {
        shopId,
        userId,
        role,
        data: {
          transaction: result.transaction,
          items: result.items,
        },
      });
    } catch (error) {
      // afterSale errors NEVER crash the transaction!
      console.error("afterSale hook error:", error);
    }

    // ── Check low stock and send alerts ───────────────
    checkAndSendLowStockAlerts(shopId).catch((err) => {
      console.error("Low stock alert error:", err);
    });

    // ── Loyalty & CRM (after transaction saved) ───────
    if (input.customerId) {
      try {
        // 1. Always update CRM stats
        await loyaltyService.updateCustomerStats(
          input.customerId,
          shopId,
          parseFloat(result.transaction.total),
        );

        // 2. Redeem points FIRST if requested
        if (input.pointsToRedeem && input.pointsToRedeem > 0) {
          await loyaltyService.redeemPointsForTransaction(
            input.customerId,
            shopId,
            input.pointsToRedeem,
            result.transaction.transactionId,
          );
        }

        // 3. Earn points on final total (after discount)
        await loyaltyService.earnPoints(
          input.customerId,
          shopId,
          result.transaction.transactionId,
          parseFloat(result.transaction.total),
        );
      } catch (error) {
        // Never crash transaction for loyalty errors!
        console.error("Loyalty/CRM error:", error);
      }
    }

    // ── Send receipt email (never breaks transaction!) ──
    if (input.customerId) {
      try {
        const customer = await posRepository.getCustomerById(
          input.customerId,
          shopId,
        );
        const shop = await shopsRepository.getShopById(shopId);

        const prefs = (shop?.configuration as any)?.emailNotifications ?? {};

        if (customer?.email && prefs.receiptEmails !== false) {
          await emailService
            .sendReceiptEmail({
              to: customer.email,
              customerName: customer.firstName,
              shopName: shop?.name ?? "Shop",
              transactionNumber: result.transaction.transactionNumber,
              items: result.items.map((i) => ({
                name: i.productName,
                quantity: i.quantity,
                total: parseFloat(i.total),
              })),
              subtotal: parseFloat(result.transaction.subtotal),
              tax: parseFloat(result.transaction.tax),
              discount: parseFloat(result.transaction.discount),
              total: parseFloat(result.transaction.total),
              currency: shop?.currency ?? "USD",
            })
            .catch((err) => {
              console.error("Failed to send receipt email:", err);
            });
        }
      } catch (error) {
        console.error("Receipt email error:", error);
      }
    }

    return result;
  }

  // Get all transactions
  async getTransactions(shopId: string, filters: TransactionFilters) {
    return await posRepository.getTransactions(shopId, filters);
  }

  // Get single transaction
  async getTransactionById(transactionId: string, shopId: string) {
    const transaction = await posRepository.getTransactionById(
      transactionId,
      shopId,
    );
    if (!transaction) {
      throw new Error("Transaction not found!");
    }
    return transaction;
  }

  // Cancel transaction
  async cancelTransaction(
    transactionId: string,
    shopId: string,
    userId: string,
  ) {
    const existing = await posRepository.getTransactionById(
      transactionId,
      shopId,
    );

    if (!existing) {
      throw new Error("Transaction not found!");
    }

    if (existing.status === "cancelled") {
      throw new Error("Transaction already cancelled!");
    }

    if (existing.status === "refunded") {
      throw new Error("Transaction already refunded!");
    }

    return await posRepository.updateTransactionStatus(
      transactionId,
      shopId,
      "cancelled",
      userId,
    );
  }

  //Return lookup for transactions and customers
  async returnLookup(shopId: string, search: string) {
    if (!search || search.trim().length < 2) {
      throw new Error("Search term must be at least 2 characters!");
    }

    const results = await posRepository.returnLookup(shopId, search.trim());

    return {
      searchType: search.toUpperCase().startsWith("TXN-")
        ? "transaction_number"
        : /^\d{10,}$/.test(search)
          ? "phone"
          : "customer_name",
      results,
    };
  }
}