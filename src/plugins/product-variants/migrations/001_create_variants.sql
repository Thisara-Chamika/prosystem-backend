-- ══════════════════════════════════════════════════
-- Fashion Shop Plugin — Variants Migration
-- ══════════════════════════════════════════════════

-- Create product_variants table
CREATE TABLE IF NOT EXISTS product_variants (
  variant_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id           UUID NOT NULL REFERENCES shops(shop_id) ON DELETE CASCADE,
  product_id        UUID NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
  size              VARCHAR(20),
  color             VARCHAR(50),
  sku_variant       VARCHAR(100),
  price_adjustment  DECIMAL(10,2) DEFAULT 0,
  quantity          INT NOT NULL DEFAULT 0,
  custom_attributes JSONB DEFAULT '{}',
  is_active         BOOLEAN DEFAULT true,
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW(),
  UNIQUE(shop_id, product_id, size, color)
);

-- Enable RLS
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- RLS policy
CREATE POLICY shop_isolation ON product_variants
  USING (
    shop_id::text = current_setting('app.current_shop_id', true)
    OR current_setting('app.current_role', true) = 'super_admin'
  );

-- Add variant_id to transaction_items
ALTER TABLE transaction_items
ADD COLUMN IF NOT EXISTS variant_id UUID
REFERENCES product_variants(variant_id);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_variants_product_id
ON product_variants(product_id);

CREATE INDEX IF NOT EXISTS idx_variants_shop_id
ON product_variants(shop_id);