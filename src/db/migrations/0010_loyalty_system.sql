-- ══════════════════════════════════════════════════
-- Loyalty System Migration
-- ══════════════════════════════════════════════════

-- Add loyalty fields to customers table
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS points_balance
INT NOT NULL DEFAULT 0;

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS total_points_earned
INT NOT NULL DEFAULT 0;

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS loyalty_tier
VARCHAR(20) NOT NULL DEFAULT 'bronze'
CHECK (loyalty_tier IN ('bronze', 'silver', 'gold'));

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS total_spent
DECIMAL(10,2) NOT NULL DEFAULT 0;

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS total_visits
INT NOT NULL DEFAULT 0;

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS last_visit
TIMESTAMP;

-- Create loyalty_settings table
CREATE TABLE IF NOT EXISTS loyalty_settings (
  setting_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id          UUID NOT NULL REFERENCES shops(shop_id) UNIQUE,
  is_enabled       BOOLEAN DEFAULT true,
  points_per_100   DECIMAL(5,2) DEFAULT 1,
  points_to_redeem INT DEFAULT 100,
  redeem_value     DECIMAL(10,2) DEFAULT 50,
  silver_threshold INT DEFAULT 501,
  gold_threshold   INT DEFAULT 2001,
  created_at       TIMESTAMP DEFAULT NOW(),
  updated_at       TIMESTAMP DEFAULT NOW()
);

ALTER TABLE loyalty_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY shop_isolation ON loyalty_settings
  USING (
    shop_id::text = current_setting('app.current_shop_id', true)
    OR current_setting('app.current_role', true) = 'super_admin'
  );

-- Create loyalty_transactions table
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  loyalty_tx_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id        UUID NOT NULL REFERENCES shops(shop_id),
  customer_id    UUID NOT NULL REFERENCES customers(customer_id),
  transaction_id UUID REFERENCES transactions(transaction_id),
  type           VARCHAR(10) NOT NULL
                 CHECK (type IN ('earn', 'redeem')),
  points         INT NOT NULL,
  balance_before INT NOT NULL,
  balance_after  INT NOT NULL,
  description    VARCHAR(255),
  created_at     TIMESTAMP DEFAULT NOW()
);

ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY shop_isolation ON loyalty_transactions
  USING (
    shop_id::text = current_setting('app.current_shop_id', true)
    OR current_setting('app.current_role', true) = 'super_admin'
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_loyalty_tx_customer
ON loyalty_transactions(customer_id);

CREATE INDEX IF NOT EXISTS idx_loyalty_tx_shop
ON loyalty_transactions(shop_id);