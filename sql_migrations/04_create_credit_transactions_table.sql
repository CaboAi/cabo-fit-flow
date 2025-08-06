-- Migration 04: Create Credit Transactions Table
-- Execute in Supabase SQL Editor

-- Create table to track all credit transactions for audit and reporting
CREATE TABLE IF NOT EXISTS credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    
    -- Transaction details
    transaction_type VARCHAR(20) NOT NULL CHECK (
        transaction_type IN ('earned', 'purchased', 'used', 'expired', 'refunded', 'rollover')
    ),
    credits_amount INTEGER NOT NULL, -- Positive for earn/purchase, negative for use/expire
    credits_balance_before INTEGER NOT NULL,
    credits_balance_after INTEGER NOT NULL,
    
    -- Transaction context
    description TEXT NOT NULL,
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
    
    -- Financial tracking (if applicable)
    amount_cents INTEGER, -- For purchased credits
    payment_method VARCHAR(50), -- stripe, paypal, etc.
    payment_intent_id VARCHAR(255), -- External payment reference
    
    -- Metadata
    metadata JSONB,
    
    -- Timestamps
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    effective_date DATE DEFAULT CURRENT_DATE, -- When credits become available/expire
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CHECK (credits_amount != 0), -- No zero-amount transactions
    CHECK (credits_balance_before >= 0),
    CHECK (credits_balance_after >= 0)
);

-- Create indexes for performance and reporting
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_date ON credit_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_booking ON credit_transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_date ON credit_transactions(user_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_effective_date ON credit_transactions(effective_date);

-- Enable RLS
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own credit transactions" 
  ON credit_transactions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage all credit transactions" 
  ON credit_transactions FOR ALL 
  USING (current_setting('role') = 'service_role');

-- Grant permissions
GRANT SELECT ON credit_transactions TO authenticated;
GRANT ALL ON credit_transactions TO service_role;

-- Function to log credit transactions
CREATE OR REPLACE FUNCTION log_credit_transaction(
    p_user_id UUID,
    p_transaction_type VARCHAR,
    p_credits_amount INTEGER,
    p_description TEXT,
    p_subscription_id UUID DEFAULT NULL,
    p_booking_id UUID DEFAULT NULL,
    p_class_id UUID DEFAULT NULL,
    p_plan_id UUID DEFAULT NULL,
    p_amount_cents INTEGER DEFAULT NULL,
    p_payment_method VARCHAR DEFAULT NULL,
    p_payment_intent_id VARCHAR DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_balance_before INTEGER;
    v_balance_after INTEGER;
    v_transaction_id UUID;
    v_user_credits_record RECORD;
BEGIN
    -- Get current balance
    SELECT credits_balance INTO v_balance_before
    FROM user_credits 
    WHERE user_id = p_user_id 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    IF v_balance_before IS NULL THEN
        v_balance_before := 0;
    END IF;
    
    -- Calculate new balance
    v_balance_after := v_balance_before + p_credits_amount;
    
    -- Insert transaction record
    INSERT INTO credit_transactions (
        user_id, subscription_id, booking_id, transaction_type,
        credits_amount, credits_balance_before, credits_balance_after,
        description, class_id, plan_id, amount_cents, payment_method,
        payment_intent_id, metadata
    ) VALUES (
        p_user_id, p_subscription_id, p_booking_id, p_transaction_type,
        p_credits_amount, v_balance_before, v_balance_after,
        p_description, p_class_id, p_plan_id, p_amount_cents, p_payment_method,
        p_payment_intent_id, p_metadata
    ) RETURNING id INTO v_transaction_id;
    
    -- Update user credits balance
    UPDATE user_credits 
    SET 
        credits_balance = v_balance_after,
        credits_earned = CASE 
            WHEN p_transaction_type = 'earned' THEN credits_earned + p_credits_amount
            ELSE credits_earned 
        END,
        credits_purchased = CASE 
            WHEN p_transaction_type = 'purchased' THEN credits_purchased + p_credits_amount
            ELSE credits_purchased 
        END,
        credits_used = CASE 
            WHEN p_transaction_type = 'used' THEN credits_used + ABS(p_credits_amount)
            ELSE credits_used 
        END,
        credits_expired = CASE 
            WHEN p_transaction_type = 'expired' THEN credits_expired + ABS(p_credits_amount)
            ELSE credits_expired 
        END,
        credits_refunded = CASE 
            WHEN p_transaction_type = 'refunded' THEN credits_refunded + p_credits_amount
            ELSE credits_refunded 
        END,
        last_updated = NOW()
    WHERE user_id = p_user_id;
    
    RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION log_credit_transaction TO authenticated;
GRANT EXECUTE ON FUNCTION log_credit_transaction TO service_role;

-- Create sample transactions for existing users (if any)
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN 
        SELECT uc.user_id, uc.subscription_id, uc.credits_balance, s.plan_id
        FROM user_credits uc
        JOIN subscriptions s ON uc.subscription_id = s.id
        WHERE uc.credits_balance > 0
    LOOP
        -- Log initial credit earning transaction
        PERFORM log_credit_transaction(
            user_record.user_id,
            'earned',
            user_record.credits_balance,
            'Initial credits from subscription',
            user_record.subscription_id,
            NULL,
            NULL,
            user_record.plan_id,
            NULL,
            NULL,
            NULL,
            jsonb_build_object('source', 'migration', 'migration_date', NOW())
        );
    END LOOP;
END $$;

-- View for transaction reporting
CREATE OR REPLACE VIEW credit_transaction_summary AS
SELECT 
    ct.user_id,
    p.email,
    p.full_name,
    DATE_TRUNC('month', ct.transaction_date) as month,
    ct.transaction_type,
    COUNT(*) as transaction_count,
    SUM(ct.credits_amount) as total_credits,
    SUM(CASE WHEN ct.amount_cents IS NOT NULL THEN ct.amount_cents ELSE 0 END) as total_revenue_cents
FROM credit_transactions ct
JOIN profiles p ON ct.user_id = p.id
GROUP BY ct.user_id, p.email, p.full_name, DATE_TRUNC('month', ct.transaction_date), ct.transaction_type
ORDER BY month DESC, p.email, ct.transaction_type;

-- Grant view access
GRANT SELECT ON credit_transaction_summary TO authenticated;

-- Display recent transactions
SELECT 
    ct.transaction_date,
    p.email,
    ct.transaction_type,
    ct.credits_amount,
    ct.credits_balance_after,
    ct.description
FROM credit_transactions ct
JOIN profiles p ON ct.user_id = p.id
ORDER BY ct.transaction_date DESC
LIMIT 20;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Migration 04 completed: Credit transactions table created';
    RAISE NOTICE '📝 Transaction logging function created';
    RAISE NOTICE '🔒 RLS policies enabled for security';
    RAISE NOTICE '📊 Transaction summary view created';
    RAISE NOTICE '🎯 Sample transactions logged for existing users';
END $$;