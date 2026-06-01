export const AuditAction = {
  // Auth actions
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',

  // Return actions
  RETURN_INITIATED: 'RETURN_INITIATED',
  RETURN_APPROVED: 'RETURN_APPROVED',

  // Staff actions
  STAFF_CREATED: 'STAFF_CREATED',
  STAFF_UPDATED: 'STAFF_UPDATED',
  STAFF_DEACTIVATED: 'STAFF_DEACTIVATED',

  // Product actions
  PRODUCT_CREATED: 'PRODUCT_CREATED',
  PRODUCT_DELETED: 'PRODUCT_DELETED',

  // Transaction actions
  TRANSACTION_CREATED: 'TRANSACTION_CREATED',
  TRANSACTION_CANCELLED: 'TRANSACTION_CANCELLED',

  // Shop settings
  SETTINGS_UPDATED: 'SETTINGS_UPDATED',
} as const;

export type AuditActionType = typeof AuditAction[keyof typeof AuditAction];