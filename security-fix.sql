-- FIX SUPABASE SECURITY WARNINGS
-- Execute this via Supabase MCP to fix the search_path warnings

-- Fix get_user_credit_balance function
CREATE OR REPLACE FUNCTION public.get_user_credit_balance(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    -- Create user credits if doesn't exist
    INSERT INTO public.user_credits (user_id, balance)
    VALUES (p_user_id, 4)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN COALESCE(
        (SELECT balance FROM public.user_credits WHERE user_id = p_user_id),
        0
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth;  -- FIX: Set explicit search path

-- Fix get_class_credit_cost function
CREATE OR REPLACE FUNCTION public.get_class_credit_cost(p_class_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN COALESCE(
        (SELECT credit_cost FROM public.classes WHERE id = p_class_id),
        1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;  -- FIX: Set explicit search path

-- Fix deduct_user_credits function
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
    v_transaction_id UUID;
BEGIN
    -- Ensure user has credit record
    INSERT INTO public.user_credits (user_id, balance)
    VALUES (p_user_id, 4)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Get current balance with lock
    SELECT balance INTO v_current_balance
    FROM public.user_credits
    WHERE user_id = p_user_id
    FOR UPDATE;
    
    -- Check sufficient balance
    IF v_current_balance < p_amount THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Insufficient credits',
            'current_balance', v_current_balance,
            'required_amount', p_amount
        );
    END IF;
    
    -- Calculate new balance
    v_new_balance := v_current_balance - p_amount;
    
    -- Update balance
    UPDATE public.user_credits
    SET balance = v_new_balance,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Log transaction
    INSERT INTO public.credit_transactions (
        user_id, 
        amount, 
        type, 
        description, 
        booking_id,
        balance_after
    )
    VALUES (
        p_user_id, 
        -p_amount, 
        'deduction', 
        p_description, 
        p_booking_id,
        v_new_balance
    )
    RETURNING id INTO v_transaction_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'transaction_id', v_transaction_id,
        'previous_balance', v_current_balance,
        'amount_deducted', p_amount,
        'new_balance', v_new_balance
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth;  -- FIX: Set explicit search path

-- Fix add_user_credits function
CREATE OR REPLACE FUNCTION public.add_user_credits(
    p_user_id UUID,
    p_amount INTEGER,
    p_type VARCHAR(50) DEFAULT 'purchase',
    p_description TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_current_balance INTEGER;
    v_new_balance INTEGER;
BEGIN
    -- Ensure user has credit record
    INSERT INTO public.user_credits (user_id, balance)
    VALUES (p_user_id, 4)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Get and update balance
    UPDATE public.user_credits
    SET balance = balance + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING balance - p_amount, balance 
    INTO v_current_balance, v_new_balance;
    
    -- Log transaction
    INSERT INTO public.credit_transactions (
        user_id, amount, type, description,
        balance_before, balance_after
    )
    VALUES (
        p_user_id, p_amount, p_type, p_description,
        v_current_balance, v_new_balance
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'previous_balance', v_current_balance,
        'amount_added', p_amount,
        'new_balance', v_new_balance
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth;  -- FIX: Set explicit search path

-- Verification queries
SELECT 'Security fix applied successfully!' as status;

-- Test the updated functions
SELECT public.get_user_credit_balance('00000000-0000-0000-0000-000000000001'::uuid) as test_balance;

-- Show function details to verify search_path is set
SELECT 
    proname as function_name,
    prosrc as source_contains_search_path
FROM pg_proc 
WHERE proname IN ('get_user_credit_balance', 'get_class_credit_cost', 'deduct_user_credits', 'add_user_credits')
AND pronamespace = 'public'::regnamespace;