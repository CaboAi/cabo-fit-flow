-- FINAL DEMO DATA SETUP - Cabo Fit Pass
-- Designed for your exact repository structure and constraints
-- Execute in Supabase SQL Editor
-- Works with RLS policies and existing foreign key constraints

-- ============================================================================
-- PART 1: DEMO USERS & PROFILES
-- ============================================================================

-- Ensure Mario's profile is set up correctly for demo
UPDATE profiles 
SET 
    monthly_credits = 1,  -- Show 1 of 4 credits remaining for demo
    full_name = 'Mario Polanco Jr',
    email = 'mario@cabofit.com',
    role = 'user',
    updated_at = NOW()
WHERE id = '40ec6001-c070-426a-9d8d-45326d0d7dac';

-- Create additional demo users for social proof
INSERT INTO profiles (id, email, full_name, role, monthly_credits, created_at, updated_at)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440001', 'sarah.johnson@gmail.com', 'Sarah Johnson', 'user', 3, NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440002', 'mike.chen@outlook.com', 'Mike Chen', 'user', 2, NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440003', 'lisa.rodriguez@yahoo.com', 'Lisa Rodriguez', 'user', 4, NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440004', 'james.taylor@gmail.com', 'James Taylor', 'user', 1, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET 
    monthly_credits = EXCLUDED.monthly_credits,
    updated_at = NOW();

-- ============================================================================
-- PART 2: NEW DEMO GYMS
-- ============================================================================

-- Add variety of gyms across Los Cabos using exact table structure
INSERT INTO gyms (name, location, logo_url)
VALUES 
    ('Sunset Yoga Cabo', 'Playa El Médano, Cabo San Lucas', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=100&h=100&fit=crop'),
    ('CrossFit Los Cabos', 'Av. Lázaro Cárdenas, Cabo San Lucas', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=100&h=100&fit=crop'),
    ('Aqua Fitness Marina', 'Marina Golden Zone, Cabo San Lucas', 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=100&h=100&fit=crop'),
    ('Pilates San José', 'Plaza San José, San José del Cabo', 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=100&h=100&fit=crop'),
    ('Beach Bootcamp Cabo', 'Medano Beach, Cabo San Lucas', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=100&h=100&fit=crop'),
    ('Cabo Wellness Center', 'Tourist Corridor, Los Cabos', 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=100&h=100&fit=crop')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- PART 3: DIVERSE CLASSES FOR NEXT 7 DAYS
-- ============================================================================

DO $$
DECLARE 
    sunset_yoga_id UUID;
    crossfit_id UUID;
    aqua_fitness_id UUID;
    pilates_id UUID;
    bootcamp_id UUID;
    wellness_id UUID;
    existing_gym_id UUID;
BEGIN
    -- Get gym IDs
    SELECT id INTO sunset_yoga_id FROM gyms WHERE name = 'Sunset Yoga Cabo' LIMIT 1;
    SELECT id INTO crossfit_id FROM gyms WHERE name = 'CrossFit Los Cabos' LIMIT 1;
    SELECT id INTO aqua_fitness_id FROM gyms WHERE name = 'Aqua Fitness Marina' LIMIT 1;
    SELECT id INTO pilates_id FROM gyms WHERE name = 'Pilates San José' LIMIT 1;
    SELECT id INTO bootcamp_id FROM gyms WHERE name = 'Beach Bootcamp Cabo' LIMIT 1;
    SELECT id INTO wellness_id FROM gyms WHERE name = 'Cabo Wellness Center' LIMIT 1;
    SELECT id INTO existing_gym_id FROM gyms WHERE name != 'Sunset Yoga Cabo' LIMIT 1;

    -- Insert classes for next 7 days with variety
    INSERT INTO classes (gym_id, title, schedule, price, capacity)
    VALUES 
        -- DAY 1: Tomorrow's classes
        (COALESCE(sunset_yoga_id, existing_gym_id), 'Sunrise Beach Vinyasa', 
         (CURRENT_DATE + INTERVAL '1 day')::timestamp + TIME '06:00:00', 28, 20),
        
        (COALESCE(crossfit_id, existing_gym_id), 'CrossFit Fundamentals', 
         (CURRENT_DATE + INTERVAL '1 day')::timestamp + TIME '07:30:00', 32, 12),
        
        (COALESCE(aqua_fitness_id, existing_gym_id), 'Aqua HIIT Blast', 
         (CURRENT_DATE + INTERVAL '1 day')::timestamp + TIME '09:00:00', 35, 15),
        
        (COALESCE(pilates_id, existing_gym_id), 'Reformer Power Flow', 
         (CURRENT_DATE + INTERVAL '1 day')::timestamp + TIME '10:30:00', 42, 8),
        
        (COALESCE(bootcamp_id, existing_gym_id), 'Beach Body Bootcamp', 
         (CURRENT_DATE + INTERVAL '1 day')::timestamp + TIME '17:00:00', 25, 25),
        
        (COALESCE(wellness_id, existing_gym_id), 'Mindful Meditation', 
         (CURRENT_DATE + INTERVAL '1 day')::timestamp + TIME '18:30:00', 20, 15),

        -- DAY 2: Classes variety
        (COALESCE(sunset_yoga_id, existing_gym_id), 'Power Yoga Flow', 
         (CURRENT_DATE + INTERVAL '2 days')::timestamp + TIME '08:00:00', 30, 18),
        
        (COALESCE(crossfit_id, existing_gym_id), 'Olympic Lifting Workshop', 
         (CURRENT_DATE + INTERVAL '2 days')::timestamp + TIME '16:00:00', 40, 10),
        
        (COALESCE(aqua_fitness_id, existing_gym_id), 'Aqua Zumba Party', 
         (CURRENT_DATE + INTERVAL '2 days')::timestamp + TIME '17:30:00', 22, 20),
        
        (COALESCE(wellness_id, existing_gym_id), 'Therapeutic Massage Class', 
         (CURRENT_DATE + INTERVAL '2 days')::timestamp + TIME '19:00:00', 45, 6),

        -- DAY 3: Midweek options
        (COALESCE(sunset_yoga_id, existing_gym_id), 'Sunset Yin & Restore', 
         (CURRENT_DATE + INTERVAL '3 days')::timestamp + TIME '17:30:00', 32, 22),
        
        (COALESCE(pilates_id, existing_gym_id), 'Mat Pilates Core', 
         (CURRENT_DATE + INTERVAL '3 days')::timestamp + TIME '11:00:00', 28, 12),
        
        (COALESCE(bootcamp_id, existing_gym_id), 'HIIT on the Beach', 
         (CURRENT_DATE + INTERVAL '3 days')::timestamp + TIME '12:00:00', 30, 18),
        
        (COALESCE(crossfit_id, existing_gym_id), 'Functional Fitness', 
         (CURRENT_DATE + INTERVAL '3 days')::timestamp + TIME '18:00:00', 35, 15),

        -- DAY 4: Thursday energy
        (COALESCE(crossfit_id, existing_gym_id), 'Hero WOD Challenge', 
         (CURRENT_DATE + INTERVAL '4 days')::timestamp + TIME '06:00:00', 38, 14),
        
        (COALESCE(aqua_fitness_id, existing_gym_id), 'Water Aerobics Plus', 
         (CURRENT_DATE + INTERVAL '4 days')::timestamp + TIME '09:30:00', 18, 25),
        
        (COALESCE(bootcamp_id, existing_gym_id), 'Sunset Beach Run', 
         (CURRENT_DATE + INTERVAL '4 days')::timestamp + TIME '18:00:00', 15, 30),
        
        (COALESCE(wellness_id, existing_gym_id), 'Sound Bath Healing', 
         (CURRENT_DATE + INTERVAL '4 days')::timestamp + TIME '20:00:00', 35, 12),

        -- DAY 5: Friday favorites
        (COALESCE(sunset_yoga_id, existing_gym_id), 'Friday Flow & Wine', 
         (CURRENT_DATE + INTERVAL '5 days')::timestamp + TIME '17:00:00', 38, 16),
        
        (COALESCE(pilates_id, existing_gym_id), 'Pilates Sculpt Intensive', 
         (CURRENT_DATE + INTERVAL '5 days')::timestamp + TIME '10:00:00', 40, 10),
        
        (COALESCE(crossfit_id, existing_gym_id), 'Friday Night Lights WOD', 
         (CURRENT_DATE + INTERVAL '5 days')::timestamp + TIME '19:00:00', 35, 12),

        -- DAY 6: Weekend warriors
        (COALESCE(bootcamp_id, existing_gym_id), 'Saturday Warrior Bootcamp', 
         (CURRENT_DATE + INTERVAL '6 days')::timestamp + TIME '08:00:00', 32, 20),
        
        (COALESCE(aqua_fitness_id, existing_gym_id), 'Weekend Aqua Fun', 
         (CURRENT_DATE + INTERVAL '6 days')::timestamp + TIME '10:00:00', 25, 18),
        
        (COALESCE(sunset_yoga_id, existing_gym_id), 'Saturday Slow Flow', 
         (CURRENT_DATE + INTERVAL '6 days')::timestamp + TIME '16:00:00', 30, 20),

        -- DAY 7: Sunday recovery
        (COALESCE(sunset_yoga_id, existing_gym_id), 'Sunday Restoration', 
         (CURRENT_DATE + INTERVAL '7 days')::timestamp + TIME '09:00:00', 35, 15),
        
        (COALESCE(wellness_id, existing_gym_id), 'Breathwork & Recovery', 
         (CURRENT_DATE + INTERVAL '7 days')::timestamp + TIME '11:00:00', 28, 12),
        
        (COALESCE(bootcamp_id, existing_gym_id), 'Beach Volleyball Fitness', 
         (CURRENT_DATE + INTERVAL '7 days')::timestamp + TIME '16:00:00', 20, 24)
    ON CONFLICT DO NOTHING;
END $$;

-- ============================================================================
-- PART 4: DEMO BOOKINGS FOR MARIO AND SOCIAL PROOF
-- ============================================================================

DO $$
DECLARE
    sunrise_vinyasa_id UUID;
    reformer_power_id UUID;
    past_class_id UUID;
    power_yoga_id UUID;
    aqua_hiit_id UUID;
    beach_bootcamp_id UUID;
    friday_flow_id UUID;
BEGIN
    -- Get class IDs for bookings
    SELECT id INTO sunrise_vinyasa_id FROM classes WHERE title = 'Sunrise Beach Vinyasa' 
        AND schedule > CURRENT_TIMESTAMP LIMIT 1;
    SELECT id INTO reformer_power_id FROM classes WHERE title = 'Reformer Power Flow' 
        AND schedule > CURRENT_TIMESTAMP LIMIT 1;
    SELECT id INTO power_yoga_id FROM classes WHERE title = 'Power Yoga Flow' 
        AND schedule > CURRENT_TIMESTAMP LIMIT 1;
    SELECT id INTO aqua_hiit_id FROM classes WHERE title = 'Aqua HIIT Blast' 
        AND schedule > CURRENT_TIMESTAMP LIMIT 1;
    SELECT id INTO beach_bootcamp_id FROM classes WHERE title = 'Beach Body Bootcamp' 
        AND schedule > CURRENT_TIMESTAMP LIMIT 1;
    SELECT id INTO friday_flow_id FROM classes WHERE title = 'Friday Flow & Wine' 
        AND schedule > CURRENT_TIMESTAMP LIMIT 1;
    
    -- Get a past class for completed booking
    SELECT id INTO past_class_id FROM classes WHERE schedule < CURRENT_TIMESTAMP LIMIT 1;

    -- MARIO'S BOOKINGS (3 total: 1 completed, 2 upcoming)
    
    -- Completed booking from earlier today/yesterday
    IF past_class_id IS NOT NULL THEN
        INSERT INTO bookings (user_id, class_id, type, payment_status, completed_at, notes)
        VALUES 
            ('40ec6001-c070-426a-9d8d-45326d0d7dac', past_class_id, 'monthly', 'completed', 
             CURRENT_TIMESTAMP - INTERVAL '1 day', 'Great morning workout! Loved the beachside location.')
        ON CONFLICT DO NOTHING;
    END IF;

    -- Upcoming booking 1: Tomorrow's sunrise yoga
    IF sunrise_vinyasa_id IS NOT NULL THEN
        INSERT INTO bookings (user_id, class_id, type, payment_status, notes)
        VALUES 
            ('40ec6001-c070-426a-9d8d-45326d0d7dac', sunrise_vinyasa_id, 'monthly', 'completed', 
             'Perfect way to start the day! Can''t wait for sunrise yoga.')
        ON CONFLICT DO NOTHING;
    END IF;

    -- Upcoming booking 2: Day after tomorrow's power yoga
    IF power_yoga_id IS NOT NULL THEN
        INSERT INTO bookings (user_id, class_id, type, payment_status, notes)
        VALUES 
            ('40ec6001-c070-426a-9d8d-45326d0d7dac', power_yoga_id, 'monthly', 'completed', 
             'Ready to build some strength! Love this instructor.')
        ON CONFLICT DO NOTHING;
    END IF;

    -- SOCIAL PROOF BOOKINGS - Other users for realistic booking counts
    
    -- Sunrise Vinyasa - popular class
    IF sunrise_vinyasa_id IS NOT NULL THEN
        INSERT INTO bookings (user_id, class_id, type, payment_status, notes)
        VALUES 
            ('550e8400-e29b-41d4-a716-446655440001', sunrise_vinyasa_id, 'drop-in', 'completed', 
             'Tourist here - this was amazing!'),
            ('550e8400-e29b-41d4-a716-446655440002', sunrise_vinyasa_id, 'monthly', 'completed', 
             'Regular here, never gets old'),
            ('550e8400-e29b-41d4-a716-446655440003', sunrise_vinyasa_id, 'drop-in', 'pending', NULL),
            ('550e8400-e29b-41d4-a716-446655440004', sunrise_vinyasa_id, 'one-time', 'completed', 
             'First time yoga - excited!')
        ON CONFLICT DO NOTHING;
    END IF;

    -- Aqua HIIT - good capacity
    IF aqua_hiit_id IS NOT NULL THEN
        INSERT INTO bookings (user_id, class_id, type, payment_status, notes)
        VALUES 
            ('550e8400-e29b-41d4-a716-446655440001', aqua_hiit_id, 'monthly', 'completed', 
             'Love the water workouts!'),
            ('550e8400-e29b-41d4-a716-446655440002', aqua_hiit_id, 'drop-in', 'completed', NULL),
            ('550e8400-e29b-41d4-a716-446655440003', aqua_hiit_id, 'monthly', 'completed', 
             'Great cardio without the impact')
        ON CONFLICT DO NOTHING;
    END IF;

    -- Beach Bootcamp - high energy
    IF beach_bootcamp_id IS NOT NULL THEN
        INSERT INTO bookings (user_id, class_id, type, payment_status, notes)
        VALUES 
            ('550e8400-e29b-41d4-a716-446655440002', beach_bootcamp_id, 'drop-in', 'completed', 
             'Beach workouts hit different!'),
            ('550e8400-e29b-41d4-a716-446655440003', beach_bootcamp_id, 'monthly', 'completed', NULL),
            ('550e8400-e29b-41d4-a716-446655440004', beach_bootcamp_id, 'drop-in', 'pending', 
             'Bringing friends!')
        ON CONFLICT DO NOTHING;
    END IF;

    -- Reformer Power Flow - boutique experience
    IF reformer_power_id IS NOT NULL THEN
        INSERT INTO bookings (user_id, class_id, type, payment_status, notes)
        VALUES 
            ('550e8400-e29b-41d4-a716-446655440001', reformer_power_id, 'one-time', 'completed', 
             'Worth every peso! Amazing equipment'),
            ('550e8400-e29b-41d4-a716-446655440003', reformer_power_id, 'monthly', 'completed', 
             'My weekly pilates fix')
        ON CONFLICT DO NOTHING;
    END IF;

    -- Friday Flow & Wine - special event
    IF friday_flow_id IS NOT NULL THEN
        INSERT INTO bookings (user_id, class_id, type, payment_status, notes)
        VALUES 
            ('550e8400-e29b-41d4-a716-446655440001', friday_flow_id, 'drop-in', 'completed', 
             'Perfect Friday night plan!'),
            ('550e8400-e29b-41d4-a716-446655440002', friday_flow_id, 'drop-in', 'completed', 
             'Yoga + wine = perfect combo'),
            ('550e8400-e29b-41d4-a716-446655440004', friday_flow_id, 'one-time', 'pending', 
             'Date night sorted!')
        ON CONFLICT DO NOTHING;
    END IF;

END $$;

-- ============================================================================
-- PART 5: VERIFICATION & SUMMARY
-- ============================================================================

-- Display demo summary
SELECT 
    'DEMO SETUP COMPLETE!' as status,
    (SELECT COUNT(*) FROM gyms) as total_gyms,
    (SELECT COUNT(*) FROM classes WHERE schedule > CURRENT_TIMESTAMP) as upcoming_classes,
    (SELECT COUNT(*) FROM bookings WHERE user_id = '40ec6001-c070-426a-9d8d-45326d0d7dac') as mario_bookings,
    (SELECT monthly_credits FROM profiles WHERE id = '40ec6001-c070-426a-9d8d-45326d0d7dac') as mario_credits_remaining,
    (SELECT COUNT(*) FROM bookings) as total_bookings;

-- Show Mario's upcoming schedule for verification
SELECT 
    'MARIO''S UPCOMING CLASSES' as info,
    c.title as class_name,
    g.name as gym_name,
    c.schedule::date as class_date,
    c.schedule::time as class_time,
    b.type as booking_type,
    b.payment_status,
    b.notes
FROM bookings b
JOIN classes c ON b.class_id = c.id
JOIN gyms g ON c.gym_id = g.id
WHERE b.user_id = '40ec6001-c070-426a-9d8d-45326d0d7dac'
    AND c.schedule > CURRENT_TIMESTAMP
ORDER BY c.schedule;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '🎉 DEMO DATA SETUP COMPLETE!';
    RAISE NOTICE '✅ Mario has realistic booking history';
    RAISE NOTICE '✅ 25+ upcoming classes available';
    RAISE NOTICE '✅ Multiple gyms with variety';
    RAISE NOTICE '✅ Social proof bookings added';
    RAISE NOTICE '🚀 Ready for studio partner demos!';
END $$;