-- ══════════════════════════════════════════════════
-- Product Type Migration
-- ══════════════════════════════════════════════════

-- Add product_type column to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS product_type
VARCHAR(20) NOT NULL DEFAULT 'product'
CHECK (product_type IN ('product', 'service'));

-- Update existing products to 'product' type
UPDATE products
SET product_type = 'product'
WHERE product_type IS NULL;