export interface ReturnItemInput {
  productId: string;
  transactionItemId: string;
  quantity: number;
  reason?: string;
}

export interface CreateReturnInput {
  items: ReturnItemInput[];
  reason?: string;
  refundMethod: 'cash' | 'card' | 'store_credit';
  approvedBy?: string;
}