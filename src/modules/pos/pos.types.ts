export interface CreateTransactionInput {
  customerId?: string;
  items: TransactionItemInput[];
  paymentMethod: 'cash' | 'card' | 'online' | 'mixed';
  discount?: number;
  notes?: string;
}

export interface TransactionItemInput {
  productId: string;
  quantity: number;
  discount?: number;
}

export interface TransactionFilters {
  status?: string;
  paymentMethod?: string;
  customerId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}