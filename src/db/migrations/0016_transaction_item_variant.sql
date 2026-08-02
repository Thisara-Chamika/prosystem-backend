-- ══════════════════════════════════════════════════
-- Link transaction_items to product_variants
-- (variant_id column already exists in the DB from
-- the original product-variants plugin migration —
-- this file exists purely to formally track the change
-- Drizzle's schema file now also declares. If the column
-- genuinely doesn't exist yet on a given environment,
-- IF NOT EXISTS makes this safe to run regardless.)
-- ══════════════════════════════════════════════════

ALTER TABLE transaction_items
ADD COLUMN IF NOT EXISTS variant_id UUID
REFERENCES product_variants(variant_id);