-- ══════════════════════════════════════════════════
-- Password Reset Tokens Migration
-- No RLS — we don't know the requesting user's shop
-- until after they're identified by email, same
-- reasoning as the existing login-by-email lookup.
-- ══════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  reset_token_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id
ON password_reset_tokens(user_id);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token_hash
ON password_reset_tokens(token_hash);