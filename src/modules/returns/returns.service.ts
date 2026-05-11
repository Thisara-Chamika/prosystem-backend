import { ReturnsRepository } from './returns.repository';
import { CreateReturnInput } from './returns.types';

const returnsRepository = new ReturnsRepository();

export class ReturnsService {

  async createReturn(
    transactionId: string,
    shopId: string,
    userId: string,
    input: CreateReturnInput
  ) {
    // 1. Get original transaction
    const transaction = await returnsRepository
      .getTransactionWithItems(transactionId, shopId);

    if (!transaction) {
      throw new Error('Transaction not found!');
    }

    // 2. Only completed transactions can be returned
    const allowedStatuses = ['completed', 'partial_refund'];
    if (!allowedStatuses.includes(transaction.status as string)) {
        throw new Error(
        `Cannot return a ${transaction.status} transaction!`
        );
    }

    // 3. Get already returned quantities
    const alreadyReturned = await returnsRepository
      .getReturnedQuantities(transactionId);

    // 4. Validate each return item
    let totalRefund = 0;
    const itemsToReturn = [];

    for (const returnItem of input.items) {
      // Find item in original transaction
      const originalItem = transaction.items.find(
        i => i.itemId === returnItem.transactionItemId &&
             i.productId === returnItem.productId
      );

      if (!originalItem) {
        throw new Error(
          `Item not found in original transaction!`
        );
      }

      // Check how many already returned
      const previouslyReturned =
        alreadyReturned[returnItem.transactionItemId] ?? 0;

      const availableToReturn =
        originalItem.quantity - previouslyReturned;

      if (returnItem.quantity > availableToReturn) {
        throw new Error(
          `Cannot return ${returnItem.quantity} of ${originalItem.productName}! ` +
          `Available to return: ${availableToReturn}`
        );
      }

      // Calculate refund amount
      const unitPrice = parseFloat(originalItem.unitPrice);
      const itemRefund = unitPrice * returnItem.quantity;
      totalRefund += itemRefund;

      itemsToReturn.push({
        shopId,
        transactionItemId: returnItem.transactionItemId,
        productId: returnItem.productId,
        quantity: returnItem.quantity,
        unitPrice: String(unitPrice),
        total: String(itemRefund.toFixed(2)),
        reason: returnItem.reason,
        returnId: '',
      });
    }

    // 5. Restore inventory for returned items
    for (let i = 0; i < input.items.length; i++) {
      await returnsRepository.restoreInventory(
        input.items[i].productId,
        shopId,
        input.items[i].quantity
      );
    }

    // 6. Create return record
    const result = await returnsRepository.createReturn(
      {
        shopId,
        transactionId,
        returnedBy: userId,
        reason: input.reason,
        refundMethod: input.refundMethod,
        totalRefund: String(totalRefund.toFixed(2)),
        status: 'completed',
      },
      itemsToReturn
    );

    // 7. Determine new transaction status
    const allItems = transaction.items;
    const updatedReturned = { ...alreadyReturned };

    for (const item of input.items) {
      updatedReturned[item.transactionItemId] =
        (updatedReturned[item.transactionItemId] ?? 0) +
        item.quantity;
    }

    // Check if ALL items fully returned
    const fullyReturned = allItems.every(item => {
      const returned = updatedReturned[item.itemId] ?? 0;
      return returned >= item.quantity;
    });

    const newStatus = fullyReturned ? 'refunded' : 'partial_refund';

    // 8. Update transaction status
    await returnsRepository.updateTransactionStatus(
      transactionId,
      newStatus
    );

    return {
      ...result,
      transactionStatus: newStatus,
      totalRefund: totalRefund.toFixed(2),
      refundMethod: input.refundMethod,
    };
  }
}