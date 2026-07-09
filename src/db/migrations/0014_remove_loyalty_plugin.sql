-- ══════════════════════════════════════════════════
-- Remove loyalty-program leftover plugin data
-- ══════════════════════════════════════════════════

-- Remove from plugin_configurations entirely
DELETE FROM plugin_configurations
WHERE plugin_id = 'loyalty-program';

-- Remove the string from any shop's active_plugins array
UPDATE shops
SET active_plugins = active_plugins - 'loyalty-program'
WHERE active_plugins @> '["loyalty-program"]'::jsonb;