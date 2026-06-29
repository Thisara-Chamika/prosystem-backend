-- ══════════════════════════════════════════════════
-- Plugin Configurations Migration
-- ══════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS plugin_configurations (
  config_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id      UUID NOT NULL REFERENCES shops(shop_id) ON DELETE CASCADE,
  plugin_id    VARCHAR(100) NOT NULL,
  configuration JSONB DEFAULT '{}',
  is_active    BOOLEAN DEFAULT true,
  installed_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at   TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(shop_id, plugin_id)
);

ALTER TABLE plugin_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY shop_isolation ON plugin_configurations
  USING (
    shop_id::text = current_setting('app.current_shop_id', true)
    OR current_setting('app.current_role', true) = 'super_admin'
  );