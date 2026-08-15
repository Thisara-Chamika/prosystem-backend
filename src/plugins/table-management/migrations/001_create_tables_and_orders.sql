-- ══════════════════════════════════════════════════
-- Table Management Plugin — Tables & Orders Migration
-- ══════════════════════════════════════════════════

-- Create restaurant_tables table
CREATE TABLE IF NOT EXISTS restaurant_tables (
  table_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id       UUID NOT NULL REFERENCES shops(shop_id) ON DELETE CASCADE,
  table_number  INT NOT NULL,
  capacity      INT DEFAULT 4,
  status        VARCHAR(20) NOT NULL DEFAULT 'available'
                CHECK (status IN ('available','occupied','reserved','needs_cleaning')),
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW(),
  UNIQUE(shop_id, table_number)
);

ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY shop_isolation ON restaurant_tables
  USING (
    shop_id::text = current_setting('app.current_shop_id', true)
    OR current_setting('app.current_role', true) = 'super_admin'
  );

-- Create restaurant_orders table (the running tab, per table)
CREATE TABLE IF NOT EXISTS restaurant_orders (
  order_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id       UUID NOT NULL REFERENCES shops(shop_id) ON DELETE CASCADE,
  table_id      UUID NOT NULL REFERENCES restaurant_tables(table_id) ON DELETE CASCADE,
  status        VARCHAR(20) NOT NULL DEFAULT 'open'
                CHECK (status IN ('open','sent_to_kitchen','ready','served','billing','closed')),
  server_id     UUID NOT NULL REFERENCES users(user_id),
  customer_id   UUID REFERENCES customers(customer_id),
  notes         TEXT,
  opened_at     TIMESTAMP DEFAULT NOW(),
  closed_at     TIMESTAMP
);

ALTER TABLE restaurant_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY shop_isolation ON restaurant_orders
  USING (
    shop_id::text = current_setting('app.current_shop_id', true)
    OR current_setting('app.current_role', true) = 'super_admin'
  );

-- Create restaurant_order_items table (line items on the running tab)
CREATE TABLE IF NOT EXISTS restaurant_order_items (
  order_item_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id           UUID NOT NULL REFERENCES shops(shop_id) ON DELETE CASCADE,
  order_id          UUID NOT NULL REFERENCES restaurant_orders(order_id) ON DELETE CASCADE,
  product_id        UUID NOT NULL REFERENCES products(product_id),
  quantity          INT NOT NULL,
  unit_price        DECIMAL(10,2) NOT NULL,
  special_requests  TEXT,
  kitchen_status    VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (kitchen_status IN ('pending','preparing','ready','served')),
  added_at          TIMESTAMP DEFAULT NOW()
);

ALTER TABLE restaurant_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY shop_isolation ON restaurant_order_items
  USING (
    shop_id::text = current_setting('app.current_shop_id', true)
    OR current_setting('app.current_role', true) = 'super_admin'
  );

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_restaurant_tables_shop_id
ON restaurant_tables(shop_id);

CREATE INDEX IF NOT EXISTS idx_restaurant_orders_table_id
ON restaurant_orders(table_id);

CREATE INDEX IF NOT EXISTS idx_restaurant_orders_shop_id
ON restaurant_orders(shop_id);

CREATE INDEX IF NOT EXISTS idx_restaurant_order_items_order_id
ON restaurant_order_items(order_id);

CREATE INDEX IF NOT EXISTS idx_restaurant_order_items_shop_id
ON restaurant_order_items(shop_id);