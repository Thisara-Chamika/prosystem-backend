-- ══════════════════════════════════════════════════
-- ProSystem Row Level Security Policies
-- ══════════════════════════════════════════════════

-- ── STEP 1: Enable RLS on all tables ─────────────
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;

-- ── STEP 2: Create policies for shops table ───────
CREATE POLICY shops_isolation ON shops
  USING (
    shop_id::text = current_setting('app.current_shop_id', true)
    OR current_setting('app.current_role', true) = 'super_admin'
  );

-- ── STEP 3: Create policies for users table ───────
CREATE POLICY users_isolation ON users
  USING (
    shop_id::text = current_setting('app.current_shop_id', true)
    OR current_setting('app.current_role', true) = 'super_admin'
  );

-- ── STEP 4: Create policies for products table ────
CREATE POLICY products_isolation ON products
  USING (
    shop_id::text = current_setting('app.current_shop_id', true)
    OR current_setting('app.current_role', true) = 'super_admin'
  );

-- ── STEP 5: Create policies for inventory table ───
CREATE POLICY inventory_isolation ON inventory
  USING (
    shop_id::text = current_setting('app.current_shop_id', true)
    OR current_setting('app.current_role', true) = 'super_admin'
  );

-- ── STEP 6: Create policies for customers table ───
CREATE POLICY customers_isolation ON customers
  USING (
    shop_id::text = current_setting('app.current_shop_id', true)
    OR current_setting('app.current_role', true) = 'super_admin'
  );

-- ── STEP 7: Create policies for transactions ──────
CREATE POLICY transactions_isolation ON transactions
  USING (
    shop_id::text = current_setting('app.current_shop_id', true)
    OR current_setting('app.current_role', true) = 'super_admin'
  );

-- ── STEP 8: Create policies for transaction_items ─
CREATE POLICY transaction_items_isolation ON transaction_items
  USING (
    shop_id::text = current_setting('app.current_shop_id', true)
    OR current_setting('app.current_role', true) = 'super_admin'
  );