-- Migration 02: Create User Credits Table
-- Execute in Supabase SQL Editor

-- Create user_credits table to track each user's credit balance
CREATE TABLE IF NOT EXISTS user_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    
    -- Credit balances
    credits_balance INTEGER NOT NULL DEFAULT 0,
    credits_earned INTEGER NOT NULL DEFAULT 0, -- Total credits earned from subscriptions
    credits_purchased INTEGER NOT NULL DEFAULT 0, -- Total credits purchased separately
    credits_used INTEGER NOT NULL DEFAULT 0, -- Total credits used for bookings
    credits_expired INTEGER NOT NULL DEFAULT 0, -- Total credits that expired
    credits_refunded INTEGER NOT NULL DEFAULT 0, -- Total credits refunded from cancelled bookings
    
    -- Rollover tracking
    rollover_credits INTEGER NOT NULL DEFAULT 0, -- Credits carried over from previous period
    rollover_limit INTEGER NOT NULL DEFAULT 0, -- Maximum credits that can be rolled over
    
    -- Timestamps
    last_rollover_date TIMESTAMP WITH TIME ZONE,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one record per user per subscription
    UNIQUE(user_id, subscription_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_user_credits_subscription ON user_credits(subscription_id);
CREATE INDEX IF NOT EXISTS idx_user_credits_balance ON user_credits(user_id, credits_balance);

-- Enable RLS
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own credits" 
  ON user_credits FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own credits" 
  ON user_credits FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage all credits" 
  ON user_credits FOR ALL 
  USING (current_setting('role') = 'service_role');

-- Grant permissions
GRANT ALL ON user_credits TO authenticated;
GRANT ALL ON user_credits TO service_role;

-- Create trigger to update last_updated timestamp
CREATE OR REPLACE FUNCTION update_user_credits_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_credits_updated_at
    BEFORE UPDATE ON user_credits
    FOR EACH ROW
    EXECUTE FUNCTION update_user_credits_timestamp();

-- Initialize credits for existing users with active subscriptions
INSERT INTO user_credits (user_id, subscription_id, credits_balance, credits_earned, rollover_limit)
SELECT 
    s.user_id,
    s.id as subscription_id,
    COALESCE(p.credits_included, 0) as credits_balance,
    COALESCE(p.credits_included, 0) as credits_earned,
    COALESCE(p.credit_rollover_limit, 0) as rollover_limit
FROM subscriptions s
JOIN plans p ON s.plan_id = p.id
WHERE s.status = 'active'
    AND NOT EXISTS (
        SELECT 1 FROM user_credits uc 
        WHERE uc.user_id = s.user_id AND uc.subscription_id = s.id
    )
ON CONFLICT (user_id, subscription_id) DO NOTHING;

-- Display created user credits
SELECT 
    uc.user_id,
    p.email,
    pl.name as plan_name,
    uc.credits_balance,
    uc.credits_earned,
    uc.rollover_limit,
    uc.created_at
FROM user_credits uc
JOIN profiles p ON uc.user_id = p.id
JOIN subscriptions s ON uc.subscription_id = s.id
JOIN plans pl ON s.plan_id = pl.id
ORDER BY uc.created_at DESC;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Migration 02 completed: User credits table created';
    RAISE NOTICE '🔄 RLS policies enabled for security';
    RAISE NOTICE '👤 Initialized credits for existing active subscribers';
END $$;