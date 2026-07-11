-- ══════════════════════════════════════════════════
-- Add flexible attributes column to product_variants
-- Keeps size/color for backwards compatibility.
-- ══════════════════════════════════════════════════

ALTER TABLE product_variants
ADD COLUMN IF NOT EXISTS attributes
JSONB DEFAULT '{}';