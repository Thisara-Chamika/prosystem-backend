export const BUSINESS_TEMPLATES = [
  'fashion-shop',
  'salon',
  'restaurant',
  'pharmacy',
  'supermarket',
  'electronics-shop',
] as const;

export type BusinessTemplate = typeof BUSINESS_TEMPLATES[number];

export const PLUGINS_BY_BUSINESS: Record<BusinessTemplate, string[]> = {
  'fashion-shop': [
    'barcode-scanner',
    'size-variants',
    'color-variants',
    'loyalty-program',
    'card-payments',
    'online-payments',
  ],
  'salon': [
    'appointment-booking',
    'staff-commission',
    'loyalty-program',
    'sms-notifications',
    'card-payments',
    'online-payments',
  ],
  'restaurant': [
    'table-management',
    'kitchen-display',
    'online-ordering',
    'delivery',
    'card-payments',
    'online-payments',
  ],
  'pharmacy': [
    'barcode-scanner',
    'expiry-tracking',
    'prescription-management',
    'card-payments',
    'online-payments',
  ],
  'supermarket': [
    'barcode-scanner',
    'weighing-scale',
    'loyalty-program',
    'card-payments',
    'online-payments',
  ],
  'electronics-shop': [
    'barcode-scanner',
    'warranty-tracking',
    'serial-number-tracking',
    'card-payments',
    'online-payments',
  ],
};