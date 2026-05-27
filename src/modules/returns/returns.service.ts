import { ReturnsRepository } from './returns.repository';
import { CreateReturnInput } from './returns.types';
import { createAuditLog } from '../../utils/audit.utils';
import { AuditAction } from '../../enums/audit-actions.enum';

const returnsRepository = new ReturnsRepository();

export class ReturnsService {

  async createReturn(
    transactionId: string,
    shopId: string,
    userId: string,
    userRole: string,
    input: CreateReturnInput
  ) {
    // 1. Get original transaction
    const transaction = await returnsRepository
      .getTransactionWithItems(transactionId, shopId);

    if (!transaction) {
      throw new Error('Transaction not found!');
    }

    // 2. Only completed or partial_refund transactions
    const allowedStatuses = ['completed', 'partial_refund'];
    if (!allowedStatuses.includes(transaction.status as string)) {
      throw new Error(
        `Cannot return a ${transaction.status} transaction!`
      );
    }

    // 3. Cashier MUST provide approvedBy
    if (userRole === 'cashier') {
      if (!input.approvedBy) {
        throw new Error(
          'Manager approval is required for cashier returns!'
        );
      }
    }

    // 4. Get already returned quantities
    const alreadyReturned = await returnsRepository
      .getReturnedQuantities(transactionId);

    // 5. Validate each return item
    let totalRefund = 0;
    const itemsToReturn = [];

    for (const returnItem of input.items) {
      const originalItem = transaction.items.find(
        i => i.itemId === returnItem.transactionItemId &&
             i.productId === returnItem.productId
      );

      if (!originalItem) {
        throw new Error('Item not found in original transaction!');
      }

      const previouslyReturned =
        alreadyReturned[returnItem.transactionItemId] ?? 0;

      const availableToReturn =
        originalItem.quantity - previouslyReturned;

      if (returnItem.quantity > availableToReturn) {
        throw new Error(
          `Cannot return ${returnItem.quantity} of ` +
          `${originalItem.productName}! ` +
          `Available to return: ${availableToReturn}`
        );
      }

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

    // 6. Restore inventory
    for (const item of input.items) {
      await returnsRepository.restoreInventory(
        item.productId,
        shopId,
        item.quantity
      );
    }

    // 7. Create return record
    const result = await returnsRepository.createReturn(
      {
        shopId,
        transactionId,
        returnedBy: userId,
        approvedBy: input.approvedBy ?? null,
        reason: input.reason,
        refundMethod: input.refundMethod,
        totalRefund: String(totalRefund.toFixed(2)),
        status: 'completed',
      },
      itemsToReturn
    );

    // 8. Determine new transaction status
    const updatedReturned = { ...alreadyReturned };
    for (const item of input.items) {
      updatedReturned[item.transactionItemId] =
        (updatedReturned[item.transactionItemId] ?? 0) +
        item.quantity;
    }

    const fullyReturned = transaction.items.every(item => {
      const returned = updatedReturned[item.itemId] ?? 0;
      return returned >= item.quantity;
    });

    const newStatus = fullyReturned ? 'refunded' : 'partial_refund';

    await returnsRepository.updateTransactionStatus(
      transactionId,
      newStatus
    );

    // 9. Audit logs ─────────────────────────────────
    // Log return initiated by cashier/manager
    await createAuditLog({
      shopId,
      userId,
      action: AuditAction.RETURN_INITIATED,
      entityType: 'return',
      entityId: result.return.returnId,
      details: {
        transactionId,
        totalRefund: totalRefund.toFixed(2),
        refundMethod: input.refundMethod,
        itemCount: input.items.length,
        initiatedByRole: userRole,
      },
    });

    // Log manager approval if applicable
    if (input.approvedBy) {
      await createAuditLog({
        shopId,
        userId: input.approvedBy,
        action: AuditAction.RETURN_APPROVED,
        entityType: 'return',
        entityId: result.return.returnId,
        details: {
          transactionId,
          totalRefund: totalRefund.toFixed(2),
          approvedFor: userId,
        },
      });
    }

    return {
      ...result,
      transactionStatus: newStatus,
      totalRefund: totalRefund.toFixed(2),
      refundMethod: input.refundMethod,
      approvedBy: input.approvedBy ?? null,
    };
  }
}