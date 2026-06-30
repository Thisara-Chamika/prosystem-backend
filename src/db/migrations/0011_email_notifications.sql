-- ══════════════════════════════════════════════════
-- Email Notifications Migration
-- ══════════════════════════════════════════════════

ALTER TABLE shops
ADD COLUMN IF NOT EXISTS onboarding_completed
BOOLEAN DEFAULT false;

ALTER TABLE shops
ADD COLUMN IF NOT EXISTS welcome_email_sent
BOOLEAN DEFAULT false;

ALTER TABLE shops
ADD COLUMN IF NOT EXISTS last_low_stock_alert_sent
TIMESTAMP;