-- ══════════════════════════════════════════════════
-- Plugin Architecture Refactor Migration
-- ══════════════════════════════════════════════════

-- Step 1: Add business_type column
ALTER TABLE shops
ADD COLUMN IF NOT EXISTS business_type
VARCHAR(50) NOT NULL DEFAULT 'general';

-- Step 2: Migrate existing data
UPDATE shops
SET business_type = active_plugins->>0
WHERE jsonb_array_length(active_plugins) > 0
AND business_type = 'general';

-- Step 3: Clear active_plugins
UPDATE shops
SET active_plugins = '[]'::jsonb
WHERE active_plugins != '[]'::jsonb;