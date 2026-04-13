import { PosRepository } from './pos.repository';
import { CreateTransactionInput, TransactionFilters } from './pos.types';
import { ProductsRepository } from '../products/products.repository';

const posRepository = new PosRepository();
const productsRepository = new ProductsRepository();

export class PosService {

  // Create transaction (main POS operation)
  async createTransaction(
    input: CreateTransactionInput,
    shopId: string,
    userId: string
  ) {
    // 1. Validate all items and calculate totals
    let subtotal = 0;
    const itemsToCreate = [];

    for (const item of input.items) {
      // Get product with inventory
      const product = await posRepository.getProductWithInventory(
        item.productId,
        shopId
      );

      if (!product) {
        throw new Error(`Product ${item.productId} not found!`);
      }

      // Check stock availability
      if (product.trackInventory && product.inventory) {
        const available = product.inventory.quantity - product.inventory.reserved;
        if (available < item.quantity) {
          throw new Error(
            `Insufficient stock for ${product.name}! Available: ${available}`
          );
        }
      }

      // Calculate item total
      const unitPrice = parseFloat(product.price);
      const itemDiscount = item.discount ?? 0;
      const itemTotal = (unitPrice * item.quantity) - itemDiscount;
      subtotal += itemTotal;

      itemsToCreate.push({
        shopId,
        productId: item.productId,
        productName: product.name,
        productSku: product.sku,
        quantity: item.quantity,
        unitPrice: String(unitPrice),
        discount: String(itemDiscount),
        total: String(itemTotal),
        transactionId: '',
      });
    }

    // 2. Calculate tax and total
    const discount = input.discount ?? 0;
    const taxRate = 0.08; // 8% tax
    const tax = (subtotal - discount) * taxRate;
    const total = subtotal - discount + tax;

    // 3. Generate transaction number
    const transactionNumber = await posRepository.generateTransactionNumber(shopId);

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
        paymentStatus: 'paid',
        status: 'completed',
        notes: input.notes,
        createdBy: userId,
        updatedBy: userId,
      },
      itemsToCreate
    );

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
      shopId
    );
    if (!transaction) {
      throw new Error('Transaction not found!');
    }
    return transaction;
  }

  // Cancel transaction
  async cancelTransaction(transactionId: string, shopId: string, userId: string) {
    const existing = await posRepository.getTransactionById(
      transactionId,
      shopId
    );

    if (!existing) {
      throw new Error('Transaction not found!');
    }

    if (existing.status === 'cancelled') {
      throw new Error('Transaction already cancelled!');
    }

    if (existing.status === 'refunded') {
      throw new Error('Transaction already refunded!');
    }

    return await posRepository.updateTransactionStatus(
      transactionId,
      shopId,
      'cancelled',
      userId
    );
  }
}