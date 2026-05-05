export interface CreateStaffInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'shop_manager' | 'cashier';
  phone?: string;
}

export interface UpdateStaffInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  role?: 'shop_manager' | 'cashier';
  phone?: string;
  isActive?: boolean;
}

export interface StaffFilters {
  role?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}