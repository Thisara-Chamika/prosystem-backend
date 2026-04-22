export interface CreateProductInput {
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  category?: string;
  price: number;
  cost?: number;
  taxRate?: number;
  trackInventory?: boolean;
  initialStock?: number;
}

export interface UpdateProductInput {
  barcode?: string;
  name?: string;
  description?: string;
  category?: string;
  price?: number;
  cost?: number;
  taxRate?: number;
  trackInventory?: boolean;
  isActive?: boolean;
}

export interface ProductFilters {
  category?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;   
  order?: 'asc' | 'desc';
}