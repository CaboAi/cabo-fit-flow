-- Migration 01: Enhance Plans Table for Credit System
-- Execute in Supabase SQL Editor

-- First, let's see the current plans table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'plans' 
ORDER BY ordinal_position;

-- Enhance existing plans table with credit-based fields
ALTER TABLE plans ADD COLUMN IF NOT EXISTS credits_included INTEGER DEFAULT 0;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS credit_rollover_limit INTEGER DEFAULT 0;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS extra_credit_price INTEGER DEFAULT 200; -- Price in cents for additional credits
ALTER TABLE plans ADD COLUMN IF NOT EXISTS plan_type VARCHAR(20) DEFAULT 'subscription' 
  CHECK (plan_type IN ('subscription', 'credit_pack', 'unlimited'));
ALTER TABLE plans ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing plans with credit information
-- Monthly Pass: 20 credits per month, rollover up to 5 credits
UPDATE plans 
SET 
  credits_included = 20,
  credit_rollover_limit = 5,
  plan_type = 'subscription',
  extra_credit_price = 150 -- $1.50 per extra credit
WHERE name ILIKE '%monthly%' OR name ILIKE '%unlimited%';

-- Weekly Pass: 8 credits per week, no rollover
UPDATE plans 
SET 
  credits_included = 8,
  credit_rollover_limit = 0,
  plan_type = 'subscription',
  extra_credit_price = 175 -- $1.75 per extra credit
WHERE name ILIKE '%weekly%';

-- Day Pass: 2 credits, no rollover (one-time)
UPDATE plans 
SET 
  credits_included = 2,
  credit_rollover_limit = 0,
  plan_type = 'credit_pack',
  extra_credit_price = 200 -- $2.00 per extra credit
WHERE name ILIKE '%day%' OR name ILIKE '%daily%';

-- Insert new credit pack plans if they don't exist
INSERT INTO plans (name, price, billing_interval, credits_included, credit_rollover_limit, plan_type, extra_credit_price, is_active)
VALUES 
  ('5-Credit Pack', 1250, 'one_time', 5, 0, 'credit_pack', 250, true), -- $12.50 for 5 credits = $2.50 each
  ('10-Credit Pack', 2250, 'one_time', 10, 0, 'credit_pack', 225, true), -- $22.50 for 10 credits = $2.25 each
  ('20-Credit Pack', 4000, 'one_time', 20, 0, 'credit_pack', 200, true) -- $40.00 for 20 credits = $2.00 each
ON CONFLICT (name) DO UPDATE SET
  credits_included = EXCLUDED.credits_included,
  credit_rollover_limit = EXCLUDED.credit_rollover_limit,
  plan_type = EXCLUDED.plan_type,
  extra_credit_price = EXCLUDED.extra_credit_price,
  is_active = EXCLUDED.is_active;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_plans_type_active ON plans(plan_type, is_active);

-- Display updated plans
SELECT 
  name,
  price,
  billing_interval,
  credits_included,
  credit_rollover_limit,
  plan_type,
  extra_credit_price,
  is_active
FROM plans 
ORDER BY plan_type, price;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 01 completed: Plans table enhanced with credit system';
  RAISE NOTICE '📊 Updated existing plans with credit allocations';
  RAISE NOTICE '💳 Added new credit pack plans';
END $$;