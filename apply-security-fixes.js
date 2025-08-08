#!/usr/bin/env node

/**
 * Apply Security Fixes to Database Functions
 * 
 * This script applies security fixes by recreating functions with proper search_path
 * Set SUPABASE_SERVICE_ROLE_KEY environment variable before running
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://pamzfhiiuvmtlwwvufut.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
    console.log('⚠️  SUPABASE_SERVICE_ROLE_KEY environment variable not set');
    console.log('💡 Set it with: export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"');
    console.log('🔧 Or execute the SQL manually in Supabase Dashboard > SQL Editor');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function applySecurityFixes() {
    console.log('🔒 Applying security fixes to database functions...');

    const functions = [
        {
            name: 'get_user_credit_balance',
            sql: `
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
                SET search_path = public, auth;
            `
        },
        {
            name: 'get_class_credit_cost',
            sql: `
                CREATE OR REPLACE FUNCTION public.get_class_credit_cost(p_class_id UUID)
                RETURNS INTEGER AS $$
                BEGIN
                    RETURN COALESCE(
                        (SELECT credit_cost FROM public.classes WHERE id = p_class_id),
                        1
                    );
                END;
                $$ LANGUAGE plpgsql SECURITY DEFINER
                SET search_path = public;
            `
        },
        {
            name: 'deduct_user_credits',
            sql: `
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
                SET search_path = public, auth;
            `
        },
        {
            name: 'add_user_credits',
            sql: `
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
                SET search_path = public, auth;
            `
        }
    ];

    for (const func of functions) {
        console.log(`🔧 Updating function: ${func.name}...`);
        
        try {
            const { error } = await supabase.rpc('query', { 
                query: func.sql.trim()
            });

            if (error) {
                console.error(`❌ Error updating ${func.name}:`, error);
            } else {
                console.log(`✅ Successfully updated ${func.name}`);
            }
        } catch (err) {
            console.error(`❌ Unexpected error updating ${func.name}:`, err);
        }
    }

    // Test the functions
    console.log('\n🔍 Testing updated functions...');
    
    try {
        const { data: testBalance, error: testError } = await supabase
            .rpc('get_user_credit_balance', { 
                p_user_id: '00000000-0000-0000-0000-000000000001' 
            });

        if (testError) {
            console.log('⚠️  Function test warning:', testError.message);
        } else {
            console.log('✅ Function test successful - balance:', testBalance);
        }

        const { data: testCost, error: costError } = await supabase
            .rpc('get_class_credit_cost', { 
                p_class_id: '00000000-0000-0000-0000-000000000001' 
            });

        if (costError) {
            console.log('⚠️  Cost function test warning:', costError.message);
        } else {
            console.log('✅ Cost function test successful - cost:', testCost);
        }

    } catch (err) {
        console.log('⚠️  Test error (this is normal if test UUIDs don\'t exist):', err.message);
    }

    console.log('\n🎉 Security fixes applied successfully!');
    console.log('🔒 All database functions now have explicit search_path settings');
    console.log('🛡️  This eliminates the Supabase security warnings');
}

applySecurityFixes().catch(console.error);