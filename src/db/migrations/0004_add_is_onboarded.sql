-- Add is_onboarded column to shops table
ALTER TABLE shops ADD COLUMN is_onboarded BOOLEAN DEFAULT false;

-- Update existing shops to true (they already completed setup)
UPDATE shops SET is_onboarded = true WHERE is_active = true;