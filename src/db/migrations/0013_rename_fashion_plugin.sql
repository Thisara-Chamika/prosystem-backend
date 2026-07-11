-- ══════════════════════════════════════════════════
-- Rename fashion-shop → product-variants
-- ══════════════════════════════════════════════════

UPDATE plugin_configurations
SET plugin_id = 'product-variants',
    is_active = false,
    updated_at = NOW()
WHERE plugin_id = 'fashion-shop';