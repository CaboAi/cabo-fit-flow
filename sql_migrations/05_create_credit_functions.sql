-- Migration 05: Create Credit Functions
-- Execute in Supabase SQL Editor

-- Function to get user's current credit balance
CREATE OR REPLACE FUNCTION get_user_credit_balance(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_balance INTEGER;
BEGIN
    SELECT credits_balance INTO v_balance
    FROM user_credits 
    WHERE user_id = p_user_id 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    RETURN COALESCE(v_balance, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate class credit cost with dynamic pricing
CREATE OR REPLACE FUNCTION get_class_credit_cost(
    p_class_id UUID,
    p_booking_datetime TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS INTEGER AS $$
DECLARE
    v_cost INTEGER;
    v_class_record RECORD;
    v_cost_record RECORD;
    v_is_peak BOOLEAN DEFAULT false;
    v_is_last_minute BOOLEAN DEFAULT false;
    v_is_weekend BOOLEAN DEFAULT false;
    v_weekend_multiplier DECIMAL DEFAULT 1.0;
    v_final_cost DECIMAL;
BEGIN
    -- Get class details
    SELECT c.*, g.name as gym_name
    INTO v_class_record
    FROM classes c
    JOIN gyms g ON c.gym_id = g.id
    WHERE c.id = p_class_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Class not found';
    END IF;
    
    -- Get cost configuration (class-specific first, then gym default)
    SELECT *
    INTO v_cost_record
    FROM class_credit_costs
    WHERE class_id = p_class_id 
        AND is_active = true
        AND (expiry_date IS NULL OR expiry_date > CURRENT_DATE)
    ORDER BY effective_date DESC
    LIMIT 1;
    
    -- If no class-specific cost, use gym default
    IF NOT FOUND THEN
        SELECT *
        INTO v_cost_record
        FROM class_credit_costs
        WHERE gym_id = v_class_record.gym_id 
            AND class_id IS NULL
            AND is_active = true
            AND (expiry_date IS NULL OR expiry_date > CURRENT_DATE)
        ORDER BY effective_date DESC
        LIMIT 1;
    END IF;
    
    -- If still no cost config, use default
    IF NOT FOUND THEN
        v_cost := 1;
        v_weekend_multiplier := 1.0;
    ELSE
        -- Check if booking is during peak hours
        IF v_cost_record.peak_hours_start IS NOT NULL AND v_cost_record.peak_hours_end IS NOT NULL THEN
            v_is_peak := EXTRACT(HOUR FROM v_class_record.start_time) BETWEEN 
                EXTRACT(HOUR FROM v_cost_record.peak_hours_start) AND 
                EXTRACT(HOUR FROM v_cost_record.peak_hours_end);
        END IF;
        
        -- Check if booking is last minute
        IF v_cost_record.last_minute_threshold_hours IS NOT NULL THEN
            v_is_last_minute := (v_class_record.start_time - p_booking_datetime) <= 
                (v_cost_record.last_minute_threshold_hours || ' hours')::INTERVAL;
        END IF;
        
        -- Check if class is on weekend
        v_is_weekend := EXTRACT(DOW FROM v_class_record.start_time) IN (0, 6); -- Sunday = 0, Saturday = 6
        
        -- Determine base cost
        IF v_is_last_minute THEN
            v_cost := v_cost_record.last_minute_credit_cost;
        ELSIF v_is_peak THEN
            v_cost := v_cost_record.peak_credit_cost;
        ELSE
            v_cost := v_cost_record.base_credit_cost;
        END IF;
        
        v_weekend_multiplier := CASE WHEN v_is_weekend THEN v_cost_record.weekend_multiplier ELSE 1.0 END;
    END IF;
    
    -- Apply weekend multiplier
    v_final_cost := v_cost * v_weekend_multiplier;
    
    -- Round to nearest integer
    RETURN CEIL(v_final_cost);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to book a class using credits
CREATE OR REPLACE FUNCTION book_class_with_credits(
    p_user_id UUID,
    p_class_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_credit_cost INTEGER;
    v_current_balance INTEGER;
    v_booking_id UUID;
    v_transaction_id UUID;
    v_class_record RECORD;
BEGIN
    -- Get class details for validation
    SELECT * INTO v_class_record
    FROM classes c
    WHERE c.id = p_class_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Class not found';
    END IF;
    
    -- Check if class is in the future
    IF v_class_record.start_time <= NOW() THEN
        RAISE EXCEPTION 'Cannot book past or current classes';
    END IF;
    
    -- Check class capacity
    IF v_class_record.current_participants >= v_class_record.max_participants THEN
        RAISE EXCEPTION 'Class is full';
    END IF;
    
    -- Get credit cost for this class
    v_credit_cost := get_class_credit_cost(p_class_id);
    
    -- Get user's current balance
    v_current_balance := get_user_credit_balance(p_user_id);
    
    -- Check if user has enough credits
    IF v_current_balance < v_credit_cost THEN
        RAISE EXCEPTION 'Insufficient credits. Need % credits, have %', v_credit_cost, v_current_balance;
    END IF;
    
    -- Create the booking
    INSERT INTO bookings (user_id, class_id, status, booking_date)
    VALUES (p_user_id, p_class_id, 'confirmed', NOW())
    RETURNING id INTO v_booking_id;
    
    -- Update class participant count
    UPDATE classes 
    SET current_participants = current_participants + 1
    WHERE id = p_class_id;
    
    -- Log the credit transaction
    v_transaction_id := log_credit_transaction(
        p_user_id,
        'used',
        -v_credit_cost,
        'Credits used for class booking: ' || v_class_record.title,
        NULL, -- subscription_id
        v_booking_id,
        p_class_id,
        NULL, -- plan_id
        NULL, -- amount_cents
        NULL, -- payment_method
        NULL, -- payment_intent_id
        jsonb_build_object(
            'credit_cost', v_credit_cost,
            'class_title', v_class_record.title,
            'booking_datetime', NOW()
        )
    );
    
    RETURN v_booking_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cancel a booking and refund credits
CREATE OR REPLACE FUNCTION cancel_booking_with_credit_refund(
    p_booking_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_booking_record RECORD;
    v_class_record RECORD;
    v_original_transaction RECORD;
    v_refund_amount INTEGER;
    v_transaction_id UUID;
    v_cancellation_fee INTEGER DEFAULT 0;
    v_hours_before_class INTERVAL;
BEGIN
    -- Get booking details
    SELECT * INTO v_booking_record
    FROM bookings
    WHERE id = p_booking_id AND user_id = p_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking not found or not owned by user';
    END IF;
    
    -- Check if booking is already cancelled
    IF v_booking_record.status = 'cancelled' THEN
        RAISE EXCEPTION 'Booking is already cancelled';
    END IF;
    
    -- Get class details
    SELECT * INTO v_class_record
    FROM classes
    WHERE id = v_booking_record.class_id;
    
    -- Check if class has already started
    IF v_class_record.start_time <= NOW() THEN
        RAISE EXCEPTION 'Cannot cancel booking for past or current classes';
    END IF;
    
    -- Get original transaction to determine refund amount
    SELECT credits_amount INTO v_refund_amount
    FROM credit_transactions
    WHERE booking_id = p_booking_id 
        AND transaction_type = 'used'
        AND user_id = p_user_id
    ORDER BY transaction_date DESC
    LIMIT 1;
    
    -- If no original transaction found, assume 1 credit
    IF v_refund_amount IS NULL THEN
        v_refund_amount := -1;
    END IF;
    
    -- Calculate cancellation policy (24 hours = full refund, less = 50% refund)
    v_hours_before_class := v_class_record.start_time - NOW();
    
    IF v_hours_before_class < '24 hours'::INTERVAL THEN
        v_refund_amount := v_refund_amount / 2; -- 50% refund for late cancellation
        v_cancellation_fee := ABS(v_refund_amount);
    END IF;
    
    -- Update booking status
    UPDATE bookings 
    SET 
        status = 'cancelled',
        updated_at = NOW()
    WHERE id = p_booking_id;
    
    -- Update class participant count
    UPDATE classes 
    SET current_participants = GREATEST(0, current_participants - 1)
    WHERE id = v_booking_record.class_id;
    
    -- Log refund transaction (if any credits to refund)
    IF v_refund_amount < 0 THEN
        v_transaction_id := log_credit_transaction(
            p_user_id,
            'refunded',
            ABS(v_refund_amount),
            'Credit refund for cancelled booking: ' || v_class_record.title,
            NULL, -- subscription_id
            p_booking_id,
            v_booking_record.class_id,
            NULL, -- plan_id
            NULL, -- amount_cents
            NULL, -- payment_method
            NULL, -- payment_intent_id
            jsonb_build_object(
                'original_booking_id', p_booking_id,
                'cancellation_fee', v_cancellation_fee,
                'hours_before_class', EXTRACT(EPOCH FROM v_hours_before_class) / 3600,
                'refund_percentage', CASE WHEN v_hours_before_class >= '24 hours'::INTERVAL THEN 100 ELSE 50 END
            )
        );
    END IF;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process monthly credit rollover
CREATE OR REPLACE FUNCTION process_credit_rollover(p_user_id UUID DEFAULT NULL)
RETURNS TABLE(user_id UUID, rolled_over INTEGER, expired INTEGER) AS $$
DECLARE
    user_record RECORD;
BEGIN
    -- If specific user provided, process only that user
    IF p_user_id IS NOT NULL THEN
        FOR user_record IN 
            SELECT uc.*, s.plan_id, p.credits_included
            FROM user_credits uc
            JOIN subscriptions s ON uc.subscription_id = s.id
            JOIN plans p ON s.plan_id = p.id
            WHERE uc.user_id = p_user_id
                AND s.status = 'active'
                AND (uc.last_rollover_date IS NULL OR uc.last_rollover_date < DATE_TRUNC('month', CURRENT_DATE))
        LOOP
            -- Process rollover for this user
            SELECT * FROM process_user_credit_rollover(user_record) 
            INTO user_id, rolled_over, expired;
            RETURN NEXT;
        END LOOP;
    ELSE
        -- Process all eligible users
        FOR user_record IN 
            SELECT uc.*, s.plan_id, p.credits_included
            FROM user_credits uc
            JOIN subscriptions s ON uc.subscription_id = s.id
            JOIN plans p ON s.plan_id = p.id
            WHERE s.status = 'active'
                AND (uc.last_rollover_date IS NULL OR uc.last_rollover_date < DATE_TRUNC('month', CURRENT_DATE))
        LOOP
            -- Process rollover for this user
            SELECT * FROM process_user_credit_rollover(user_record) 
            INTO user_id, rolled_over, expired;
            RETURN NEXT;
        END LOOP;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function for individual user credit rollover
CREATE OR REPLACE FUNCTION process_user_credit_rollover(user_record RECORD)
RETURNS TABLE(user_id UUID, rolled_over INTEGER, expired INTEGER) AS $$
DECLARE
    v_credits_to_rollover INTEGER;
    v_credits_to_expire INTEGER;
    v_new_earned_credits INTEGER;
    v_transaction_id UUID;
BEGIN
    -- Calculate rollover
    v_credits_to_rollover := LEAST(user_record.credits_balance, user_record.rollover_limit);
    v_credits_to_expire := GREATEST(0, user_record.credits_balance - user_record.rollover_limit);
    v_new_earned_credits := user_record.credits_included;
    
    -- Expire excess credits if any
    IF v_credits_to_expire > 0 THEN
        v_transaction_id := log_credit_transaction(
            user_record.user_id,
            'expired',
            -v_credits_to_expire,
            'Credits expired at month end (rollover limit: ' || user_record.rollover_limit || ')',
            user_record.subscription_id,
            NULL,
            NULL,
            user_record.plan_id,
            NULL,
            NULL,
            NULL,
            jsonb_build_object(
                'rollover_limit', user_record.rollover_limit,
                'expired_credits', v_credits_to_expire,
                'rollover_date', CURRENT_DATE
            )
        );
    END IF;
    
    -- Add new monthly credits
    IF v_new_earned_credits > 0 THEN
        v_transaction_id := log_credit_transaction(
            user_record.user_id,
            'earned',
            v_new_earned_credits,
            'Monthly credits from subscription: ' || (SELECT name FROM plans WHERE id = user_record.plan_id),
            user_record.subscription_id,
            NULL,
            NULL,
            user_record.plan_id,
            NULL,
            NULL,
            NULL,
            jsonb_build_object(
                'monthly_allocation', v_new_earned_credits,
                'rolled_over_credits', v_credits_to_rollover,
                'rollover_date', CURRENT_DATE
            )
        );
    END IF;
    
    -- Update user credits record
    UPDATE user_credits
    SET 
        credits_balance = v_credits_to_rollover + v_new_earned_credits,
        rollover_credits = v_credits_to_rollover,
        last_rollover_date = CURRENT_DATE,
        last_updated = NOW()
    WHERE user_credits.user_id = user_record.user_id 
        AND subscription_id = user_record.subscription_id;
    
    user_id := user_record.user_id;
    rolled_over := v_credits_to_rollover;
    expired := v_credits_to_expire;
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to purchase additional credits
CREATE OR REPLACE FUNCTION purchase_credits(
    p_user_id UUID,
    p_credits_amount INTEGER,
    p_amount_cents INTEGER,
    p_payment_method VARCHAR DEFAULT 'stripe',
    p_payment_intent_id VARCHAR DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_transaction_id UUID;
BEGIN
    -- Validate input
    IF p_credits_amount <= 0 THEN
        RAISE EXCEPTION 'Credits amount must be positive';
    END IF;
    
    IF p_amount_cents <= 0 THEN
        RAISE EXCEPTION 'Payment amount must be positive';
    END IF;
    
    -- Log the purchase transaction
    v_transaction_id := log_credit_transaction(
        p_user_id,
        'purchased',
        p_credits_amount,
        'Purchased ' || p_credits_amount || ' credits',
        NULL, -- subscription_id
        NULL, -- booking_id
        NULL, -- class_id
        NULL, -- plan_id
        p_amount_cents,
        p_payment_method,
        p_payment_intent_id,
        jsonb_build_object(
            'credits_purchased', p_credits_amount,
            'price_per_credit_cents', p_amount_cents::DECIMAL / p_credits_amount,
            'purchase_date', NOW()
        )
    );
    
    RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_credit_balance TO authenticated;
GRANT EXECUTE ON FUNCTION get_class_credit_cost TO authenticated;
GRANT EXECUTE ON FUNCTION book_class_with_credits TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_booking_with_credit_refund TO authenticated;
GRANT EXECUTE ON FUNCTION purchase_credits TO authenticated;

-- Admin functions (service role only)
GRANT EXECUTE ON FUNCTION process_credit_rollover TO service_role;
GRANT EXECUTE ON FUNCTION process_user_credit_rollover TO service_role;

-- Create view for credit balance with plan info
CREATE OR REPLACE VIEW user_credit_dashboard AS
SELECT 
    uc.user_id,
    p.full_name,
    p.email,
    uc.credits_balance,
    uc.credits_earned,
    uc.credits_purchased,
    uc.credits_used,
    uc.credits_expired,
    uc.rollover_credits,
    uc.rollover_limit,
    pl.name as plan_name,
    pl.credits_included as monthly_credits,
    s.status as subscription_status,
    uc.last_rollover_date,
    CASE 
        WHEN uc.last_rollover_date IS NULL THEN 'Never'
        WHEN uc.last_rollover_date < DATE_TRUNC('month', CURRENT_DATE) THEN 'Due'
        ELSE 'Current'
    END as rollover_status
FROM user_credits uc
JOIN profiles p ON uc.user_id = p.id
JOIN subscriptions s ON uc.subscription_id = s.id
JOIN plans pl ON s.plan_id = pl.id;

-- Grant access to the view
GRANT SELECT ON user_credit_dashboard TO authenticated;

-- Test the functions with sample data
DO $$
DECLARE
    v_test_user_id UUID;
    v_test_class_id UUID;
    v_credit_cost INTEGER;
    v_balance INTEGER;
BEGIN
    -- Find a test user and class
    SELECT id INTO v_test_user_id FROM profiles LIMIT 1;
    SELECT id INTO v_test_class_id FROM classes WHERE start_time > NOW() LIMIT 1;
    
    IF v_test_user_id IS NOT NULL AND v_test_class_id IS NOT NULL THEN
        -- Test getting credit balance
        v_balance := get_user_credit_balance(v_test_user_id);
        RAISE NOTICE 'Test user balance: % credits', v_balance;
        
        -- Test getting class cost
        v_credit_cost := get_class_credit_cost(v_test_class_id);
        RAISE NOTICE 'Test class cost: % credits', v_credit_cost;
    END IF;
END $$;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Migration 05 completed: Credit system functions created';
    RAISE NOTICE '🔧 Functions available:';
    RAISE NOTICE '  - get_user_credit_balance(user_id)';
    RAISE NOTICE '  - get_class_credit_cost(class_id, booking_datetime)';
    RAISE NOTICE '  - book_class_with_credits(user_id, class_id)';
    RAISE NOTICE '  - cancel_booking_with_credit_refund(booking_id, user_id)';
    RAISE NOTICE '  - purchase_credits(user_id, amount, price_cents, payment_method)';
    RAISE NOTICE '  - process_credit_rollover(user_id)';
    RAISE NOTICE '📊 Dashboard view created: user_credit_dashboard';
    RAISE NOTICE '🚀 Credit system is now fully functional!';
END $$;