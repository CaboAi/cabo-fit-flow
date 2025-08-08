-- COMPLETE DATABASE SETUP FOR CABO FIT PASS
-- Execute this via Supabase MCP to create all tables, functions, and policies

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. CREATE CORE TABLES
-- ============================================

-- User Credits System
CREATE TABLE IF NOT EXISTS public.user_credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    balance INTEGER DEFAULT 4 CHECK (balance >= 0),
    monthly_allocation INTEGER DEFAULT 4,
    last_reset_date DATE DEFAULT CURRENT_DATE,
    subscription_tier VARCHAR(50) DEFAULT 'basic',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credit Transactions
CREATE TABLE IF NOT EXISTS public.credit_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('allocation', 'deduction', 'purchase', 'refund', 'adjustment')),
    description TEXT,
    booking_id UUID,
    balance_after INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Studios
CREATE TABLE IF NOT EXISTS public.studios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    address TEXT,
    city VARCHAR(100) DEFAULT 'Cabo San Lucas',
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Class Schedules (if not exists)
CREATE TABLE IF NOT EXISTS public.class_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    studio_id UUID REFERENCES public.studios(id) ON DELETE CASCADE,
    instructor_name VARCHAR(255),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    spots_available INTEGER NOT NULL,
    spots_total INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. CREATE OR REPLACE RPC FUNCTIONS
-- ============================================

-- Get user credit balance (creates user_credits record if not exists)
CREATE OR REPLACE FUNCTION public.get_user_credit_balance(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_balance INTEGER;
BEGIN
    -- Insert default credits if user doesn't exist
    INSERT INTO user_credits (user_id, balance, monthly_allocation)
    VALUES (p_user_id, 4, 4)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Get the balance
    SELECT balance INTO v_balance
    FROM user_credits
    WHERE user_id = p_user_id;
    
    RETURN COALESCE(v_balance, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Deduct user credits
CREATE OR REPLACE FUNCTION public.deduct_user_credits(
    p_user_id UUID,
    p_amount INTEGER,
    p_description TEXT DEFAULT NULL,
    p_booking_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_current_balance INTEGER;
    v_new_balance INTEGER;
BEGIN
    -- Get current balance (with row lock)
    SELECT balance INTO v_current_balance
    FROM user_credits
    WHERE user_id = p_user_id
    FOR UPDATE;
    
    -- Check if user has enough credits
    IF v_current_balance IS NULL OR v_current_balance < p_amount THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Insufficient credits',
            'current_balance', COALESCE(v_current_balance, 0),
            'required', p_amount
        );
    END IF;
    
    -- Calculate new balance
    v_new_balance := v_current_balance - p_amount;
    
    -- Update balance
    UPDATE user_credits
    SET balance = v_new_balance,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Record transaction
    INSERT INTO credit_transactions (
        user_id, amount, type, description, booking_id, balance_after
    )
    VALUES (
        p_user_id, -p_amount, 'deduction', p_description, p_booking_id, v_new_balance
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'new_balance', v_new_balance,
        'amount_deducted', p_amount
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add credits to user
CREATE OR REPLACE FUNCTION public.add_user_credits(
    p_user_id UUID,
    p_amount INTEGER,
    p_description TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_current_balance INTEGER;
    v_new_balance INTEGER;
BEGIN
    -- Ensure user exists in credits table
    INSERT INTO user_credits (user_id, balance)
    VALUES (p_user_id, 0)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Get current balance
    SELECT balance INTO v_current_balance
    FROM user_credits
    WHERE user_id = p_user_id
    FOR UPDATE;
    
    -- Calculate new balance
    v_new_balance := v_current_balance + p_amount;
    
    -- Update balance
    UPDATE user_credits
    SET balance = v_new_balance,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Record transaction
    INSERT INTO credit_transactions (
        user_id, amount, type, description, balance_after
    )
    VALUES (
        p_user_id, p_amount, 'purchase', p_description, v_new_balance
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'new_balance', v_new_balance,
        'amount_added', p_amount
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reset monthly credits
CREATE OR REPLACE FUNCTION public.reset_monthly_credits()
RETURNS VOID AS $$
BEGIN
    -- Reset all users to their monthly allocation
    UPDATE user_credits
    SET balance = monthly_allocation,
        last_reset_date = CURRENT_DATE,
        updated_at = NOW()
    WHERE last_reset_date < CURRENT_DATE;
    
    -- Record reset transactions
    INSERT INTO credit_transactions (user_id, amount, type, description, balance_after)
    SELECT 
        user_id,
        monthly_allocation,
        'allocation',
        'Monthly credit reset',
        monthly_allocation
    FROM user_credits
    WHERE last_reset_date = CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get class credit cost (simplified)
CREATE OR REPLACE FUNCTION public.get_class_credit_cost(p_class_id UUID)
RETURNS INTEGER AS $$
BEGIN
    -- For now, all classes cost 1 credit
    -- This can be expanded to check a class_credit_costs table later
    RETURN 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Book class with credits (enhanced version)
CREATE OR REPLACE FUNCTION public.book_class_with_credits(
    p_user_id UUID,
    p_class_id UUID,
    p_booking_type VARCHAR DEFAULT 'subscription'
)
RETURNS JSONB AS $$
DECLARE
    v_credit_cost INTEGER;
    v_current_balance INTEGER;
    v_booking_id UUID;
    v_deduct_result JSONB;
BEGIN
    -- Get class credit cost
    v_credit_cost := get_class_credit_cost(p_class_id);
    
    -- Get current balance
    v_current_balance := get_user_credit_balance(p_user_id);
    
    -- Check if user has enough credits
    IF v_current_balance < v_credit_cost THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'insufficient_credits',
            'required_credits', v_credit_cost,
            'current_balance', v_current_balance,
            'shortage', v_credit_cost - v_current_balance
        );
    END IF;
    
    -- Create booking
    INSERT INTO bookings (user_id, class_id, type, payment_status, created_at)
    VALUES (p_user_id, p_class_id, p_booking_type, 'completed', NOW())
    RETURNING id INTO v_booking_id;
    
    -- Deduct credits
    v_deduct_result := deduct_user_credits(
        p_user_id,
        v_credit_cost,
        'Class booking',
        v_booking_id
    );
    
    -- Check if deduction was successful
    IF NOT (v_deduct_result->>'success')::boolean THEN
        -- Rollback booking if credits couldn't be deducted
        DELETE FROM bookings WHERE id = v_booking_id;
        RETURN v_deduct_result;
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'booking_id', v_booking_id,
        'credits_used', v_credit_cost,
        'remaining_balance', (v_deduct_result->>'new_balance')::integer
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE studios ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_schedules ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. CREATE RLS POLICIES
-- ============================================

-- User Credits Policies
DROP POLICY IF EXISTS "Users can view own credits" ON user_credits;
CREATE POLICY "Users can view own credits" ON user_credits
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can manage credits" ON user_credits;
CREATE POLICY "System can manage credits" ON user_credits
    FOR ALL USING (true);

-- Credit Transactions Policies
DROP POLICY IF EXISTS "Users can view own transactions" ON credit_transactions;
CREATE POLICY "Users can view own transactions" ON credit_transactions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can create transactions" ON credit_transactions;
CREATE POLICY "System can create transactions" ON credit_transactions
    FOR INSERT WITH CHECK (true);

-- Studios Policies
DROP POLICY IF EXISTS "Public can view active studios" ON studios;
CREATE POLICY "Public can view active studios" ON studios
    FOR SELECT USING (is_active = true);

-- Class Schedules Policies
DROP POLICY IF EXISTS "Public can view schedules" ON class_schedules;
CREATE POLICY "Public can view schedules" ON class_schedules
    FOR SELECT USING (true);

-- ============================================
-- 5. INSERT SAMPLE DATA
-- ============================================

-- Insert sample studios
INSERT INTO studios (name, slug, description, address, city, image_url) VALUES
('CrossFit Cabo', 'crossfit-cabo', 'Premier CrossFit gym with ocean views', 'Marina Golden Zone', 'Cabo San Lucas', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48'),
('Yoga Flow Studio', 'yoga-flow', 'Beachfront yoga and meditation', 'Medano Beach', 'Cabo San Lucas', 'https://images.unsplash.com/photo-1545205597-3d9d02c29597'),
('F45 Training Cabo', 'f45-cabo', 'High-intensity interval training', 'Downtown', 'Cabo San Lucas', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b'),
('Pure Barre Cabo', 'pure-barre', 'Ballet-inspired fitness', 'Palmilla', 'San José del Cabo', 'https://images.unsplash.com/photo-1518611012118-696072aa579a'),
('Cabo Spin Studio', 'cabo-spin', 'Indoor cycling with a view', 'Puerto Paraiso', 'Cabo San Lucas', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64')
ON CONFLICT (slug) DO UPDATE SET
    description = EXCLUDED.description,
    image_url = EXCLUDED.image_url,
    updated_at = NOW();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_studios_slug ON studios(slug);
CREATE INDEX IF NOT EXISTS idx_studios_active ON studios(is_active);
CREATE INDEX IF NOT EXISTS idx_class_schedules_start_time ON class_schedules(start_time);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_credit_balance TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.deduct_user_credits TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.add_user_credits TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.book_class_with_credits TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_class_credit_cost TO anon, authenticated;

-- Success message
SELECT 'Database setup complete! All tables, functions, and policies created successfully.' as status;