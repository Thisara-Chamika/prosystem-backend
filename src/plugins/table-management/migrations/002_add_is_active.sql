-- ══════════════════════════════════════════════════
-- Table Management Plugin — Add Soft Delete Support
-- ══════════════════════════════════════════════════

ALTER TABLE restaurant_tables
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL;