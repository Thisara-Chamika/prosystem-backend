-- ══════════════════════════════════════════════════
-- Manager PIN + Audit Logs Migration
-- ══════════════════════════════════════════════════

-- Step 1: Add manager_pin to users table
ALTER TABLE users ADD COLUMN manager_pin VARCHAR(255);

-- Step 2: Add approved_by to returns table
ALTER TABLE returns ADD COLUMN approved_by UUID REFERENCES users(user_id);

-- Step 3: Create audit_logs table
CREATE TABLE audit_logs (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(shop_id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(user_id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id VARCHAR(255),
  details JSONB DEFAULT '{}',
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Step 4: Enable RLS on audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Step 5: RLS policy for audit_logs
CREATE POLICY audit_logs_isolation ON audit_logs
  USING (
    shop_id::text = current_setting('app.current_shop_id', true)
    OR current_setting('app.current_role', true) = 'super_admin'
  );

-- Step 6: Index for faster queries
CREATE INDEX idx_audit_logs_shop_id ON audit_logs(shop_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);