-- ══════════════════════════════════════════════════
-- Categories Migration
-- ══════════════════════════════════════════════════

-- Step 1: Create categories table
CREATE TABLE IF NOT EXISTS categories (
  category_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(shop_id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(shop_id, name)
);

-- Step 2: Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Step 3: RLS policy
CREATE POLICY shop_isolation ON categories
  USING (
    shop_id::text = current_setting('app.current_shop_id', true)
    OR current_setting('app.current_role', true) = 'super_admin'
  );

-- Step 4: Indexes
CREATE INDEX idx_categories_shop_id ON categories(shop_id);
CREATE INDEX idx_categories_sort_order ON categories(shop_id, sort_order);