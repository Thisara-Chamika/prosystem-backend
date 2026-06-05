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
  productType?: 'product' | 'service';
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
  productType?: 'product' | 'service';
}

export interface ProductFilters {
  category?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;   
  order?: 'asc' | 'desc';
  include?: string; 
  productType?: 'product' | 'service';
}