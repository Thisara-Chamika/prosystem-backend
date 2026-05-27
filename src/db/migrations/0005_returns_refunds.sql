-- ══════════════════════════════════════════════════
-- Returns & Refunds Migration
-- ══════════════════════════════════════════════════

-- Step 1: Add partial_refund to transaction status enum
ALTER TYPE transaction_status ADD VALUE 'partial_refund';

-- Step 2: Create refund_method enum
CREATE TYPE refund_method AS ENUM (
  'cash',
  'card',
  'store_credit'
);

-- Step 3: Create returns table
CREATE TABLE returns (
  return_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(shop_id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES transactions(transaction_id),
  returned_by UUID NOT NULL REFERENCES users(user_id),
  reason VARCHAR(500),
  refund_method refund_method NOT NULL,
  total_refund DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Step 4: Create return_items table
CREATE TABLE return_items (
  return_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id UUID NOT NULL REFERENCES returns(return_id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES shops(shop_id) ON DELETE CASCADE,
  transaction_item_id UUID NOT NULL REFERENCES transaction_items(item_id),
  product_id UUID NOT NULL REFERENCES products(product_id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  reason VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Step 5: Enable RLS on new tables
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_items ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies
CREATE POLICY returns_isolation ON returns
  USING (
    shop_id::text = current_setting('app.current_shop_id', true)
    OR current_setting('app.current_role', true) = 'super_admin'
  );

CREATE POLICY return_items_isolation ON return_items
  USING (
    shop_id::text = current_setting('app.current_shop_id', true)
    OR current_setting('app.current_role', true) = 'super_admin'
  );