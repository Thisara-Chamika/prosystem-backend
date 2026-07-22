-- ══════════════════════════════════════════════════
-- Stripe Payment Integration Migration
-- ══════════════════════════════════════════════════

-- Track Stripe payment intent + charge on transactions
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255);

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS stripe_charge_id VARCHAR(255);

-- Track Stripe refund id on returns (needed for Step 6)
ALTER TABLE returns
ADD COLUMN IF NOT EXISTS stripe_refund_id VARCHAR(255);

-- Index for webhook lookups (finding a transaction by
-- payment intent id when reconciling Stripe events)
CREATE INDEX IF NOT EXISTS idx_transactions_stripe_payment_intent
ON transactions(stripe_payment_intent_id);