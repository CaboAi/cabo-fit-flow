-- Simplified Demo Data Setup for Cabo Fit Pass
-- Execute this script in Supabase SQL Editor
-- Works with existing table structure: gyms(id, name, location, logo_url), classes(id, gym_id, title, schedule, price, capacity)

-- Create demo users in profiles table (if not exist)
INSERT INTO profiles (id, email, full_name, role, monthly_credits, created_at, updated_at)
VALUES 
    ('40ec6001-c070-426a-9d8d-45326d0d7dac', 'mario@cabofit.com', 'Mario Perez', 'user', 1, NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440001', 'sarah@demo.com', 'Sarah Johnson', 'user', 4, NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440002', 'mike@demo.com', 'Mike Chen', 'user', 4, NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440003', 'lisa@demo.com', 'Lisa Rodriguez', 'user', 4, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET 
    monthly_credits = EXCLUDED.monthly_credits,
    updated_at = NOW();

-- Create new gyms for variety
INSERT INTO gyms (name, location, logo_url)
VALUES 
    ('Sunset Yoga Studio', 'Playa El Médano, Cabo San Lucas', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=100'),
    ('Cabo CrossFit', 'Av. Lázaro Cárdenas, Cabo San Lucas', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=100'),
    ('Aqua Fitness Center', 'Marina Golden Zone, Cabo San Lucas', 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=100'),
    ('Desert Pilates', 'Plaza San José, San José del Cabo', 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=100'),
    ('Beach Bootcamp Cabo', 'Medano Beach, Cabo San Lucas', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=100')
ON CONFLICT (name) DO NOTHING;

-- Add diverse classes for the next 7 days using existing gym IDs
DO $$
DECLARE 
    existing_gym_id UUID;
    sunset_yoga_id UUID;
    cabo_crossfit_id UUID;
    aqua_fitness_id UUID;
    desert_pilates_id UUID;
    beach_bootcamp_id UUID;
BEGIN
    -- Get existing gym ID
    SELECT id INTO existing_gym_id FROM gyms WHERE name = 'Cabo Fit Gym' LIMIT 1;
    
    -- Get new gym IDs
    SELECT id INTO sunset_yoga_id FROM gyms WHERE name = 'Sunset Yoga Studio' LIMIT 1;
    SELECT id INTO cabo_crossfit_id FROM gyms WHERE name = 'Cabo CrossFit' LIMIT 1;
    SELECT id INTO aqua_fitness_id FROM gyms WHERE name = 'Aqua Fitness Center' LIMIT 1;
    SELECT id INTO desert_pilates_id FROM gyms WHERE name = 'Desert Pilates' LIMIT 1;
    SELECT id INTO beach_bootcamp_id FROM gyms WHERE name = 'Beach Bootcamp Cabo' LIMIT 1;

    -- Create diverse classes for the next 7 days
    INSERT INTO classes (gym_id, title, schedule, price, capacity)
    VALUES 
        -- Day 1 Classes
        (COALESCE(sunset_yoga_id, existing_gym_id), 'Sunrise Beach Yoga', 
         CURRENT_DATE + INTERVAL '1 day' + TIME '06:00:00', 22, 20),
        
        (COALESCE(cabo_crossfit_id, existing_gym_id), 'CrossFit Fundamentals', 
         CURRENT_DATE + INTERVAL '1 day' + TIME '07:00:00', 25, 12),
        
        (COALESCE(aqua_fitness_id, existing_gym_id), 'Aqua HIIT', 
         CURRENT_DATE + INTERVAL '1 day' + TIME '08:00:00', 30, 15),
        
        (COALESCE(desert_pilates_id, existing_gym_id), 'Reformer Flow', 
         CURRENT_DATE + INTERVAL '1 day' + TIME '09:00:00', 38, 8),
        
        (COALESCE(beach_bootcamp_id, existing_gym_id), 'Beach Bootcamp', 
         CURRENT_DATE + INTERVAL '1 day' + TIME '10:00:00', 20, 25),

        -- Day 2 Classes
        (COALESCE(sunset_yoga_id, existing_gym_id), 'Vinyasa Flow', 
         CURRENT_DATE + INTERVAL '2 days' + TIME '08:00:00', 25, 18),
        
        (COALESCE(cabo_crossfit_id, existing_gym_id), 'Olympic Lifting', 
         CURRENT_DATE + INTERVAL '2 days' + TIME '16:00:00', 35, 10),
        
        (COALESCE(aqua_fitness_id, existing_gym_id), 'Aqua Zumba', 
         CURRENT_DATE + INTERVAL '2 days' + TIME '17:00:00', 18, 20),
        
        (existing_gym_id, 'Strength & Conditioning', 
         CURRENT_DATE + INTERVAL '2 days' + TIME '18:00:00', 28, 15),

        -- Day 3 Classes
        (COALESCE(sunset_yoga_id, existing_gym_id), 'Sunset Yin Yoga', 
         CURRENT_DATE + INTERVAL '3 days' + TIME '17:30:00', 30, 22),
        
        (COALESCE(desert_pilates_id, existing_gym_id), 'Mat Pilates', 
         CURRENT_DATE + INTERVAL '3 days' + TIME '11:00:00', 25, 12),
        
        (existing_gym_id, 'TRX Training', 
         CURRENT_DATE + INTERVAL '3 days' + TIME '12:00:00', 32, 10),

        -- Day 4 Classes
        (COALESCE(cabo_crossfit_id, existing_gym_id), 'Hero WOD', 
         CURRENT_DATE + INTERVAL '4 days' + TIME '06:00:00', 30, 15),
        
        (COALESCE(aqua_fitness_id, existing_gym_id), 'Gentle Water Aerobics', 
         CURRENT_DATE + INTERVAL '4 days' + TIME '09:00:00', 15, 25),
        
        (COALESCE(beach_bootcamp_id, existing_gym_id), 'Sunset Run Club', 
         CURRENT_DATE + INTERVAL '4 days' + TIME '18:00:00', 15, 30),

        -- Day 5 Classes
        (COALESCE(sunset_yoga_id, existing_gym_id), 'Power Yoga', 
         CURRENT_DATE + INTERVAL '5 days' + TIME '07:00:00', 28, 16),
        
        (COALESCE(desert_pilates_id, existing_gym_id), 'Pilates Sculpt', 
         CURRENT_DATE + INTERVAL '5 days' + TIME '10:00:00', 35, 10),
        
        (existing_gym_id, 'Bodybuilding Basics', 
         CURRENT_DATE + INTERVAL '5 days' + TIME '16:00:00', 25, 12),

        -- Day 6 Classes
        (COALESCE(cabo_crossfit_id, existing_gym_id), 'Partner WOD', 
         CURRENT_DATE + INTERVAL '6 days' + TIME '09:00:00', 25, 16),
        
        (COALESCE(aqua_fitness_id, existing_gym_id), 'Deep Water Running', 
         CURRENT_DATE + INTERVAL '6 days' + TIME '07:30:00', 22, 12),
        
        (existing_gym_id, 'Circuit Training', 
         CURRENT_DATE + INTERVAL '6 days' + TIME '17:00:00', 20, 18),

        -- Day 7 Classes
        (COALESCE(sunset_yoga_id, existing_gym_id), 'Restorative Yoga', 
         CURRENT_DATE + INTERVAL '7 days' + TIME '19:00:00', 32, 15),
        
        (COALESCE(beach_bootcamp_id, existing_gym_id), 'Beach Volleyball Fitness', 
         CURRENT_DATE + INTERVAL '7 days' + TIME '10:00:00', 18, 20)
    ON CONFLICT DO NOTHING;
END $$;

-- Create demo bookings
DO $$
DECLARE
    sunrise_yoga_id UUID;
    reformer_flow_id UUID;
    morning_yoga_id UUID;
    aqua_hiit_id UUID;
    beach_bootcamp_id UUID;
BEGIN
    -- Get class IDs for bookings
    SELECT id INTO sunrise_yoga_id FROM classes WHERE title = 'Sunrise Beach Yoga' AND schedule > CURRENT_TIMESTAMP LIMIT 1;
    SELECT id INTO reformer_flow_id FROM classes WHERE title = 'Reformer Flow' AND schedule > CURRENT_TIMESTAMP LIMIT 1;
    SELECT id INTO morning_yoga_id FROM classes WHERE title = 'Yoga Session' AND schedule < CURRENT_TIMESTAMP LIMIT 1;
    SELECT id INTO aqua_hiit_id FROM classes WHERE title = 'Aqua HIIT' AND schedule > CURRENT_TIMESTAMP LIMIT 1;
    SELECT id INTO beach_bootcamp_id FROM classes WHERE title = 'Beach Bootcamp' AND schedule > CURRENT_TIMESTAMP LIMIT 1;

    -- Create bookings for Mario (main demo user)
    -- Past booking (completed) - if we found an old class
    IF morning_yoga_id IS NOT NULL THEN
        INSERT INTO bookings (user_id, class_id, type, payment_status, notes, created_at, updated_at)
        VALUES 
            ('40ec6001-c070-426a-9d8d-45326d0d7dac', morning_yoga_id, 'monthly', 'completed', 'Great class! Very relaxing.', 
             CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP - INTERVAL '3 days')
        ON CONFLICT DO NOTHING;
    END IF;

    -- Upcoming bookings for Mario
    IF sunrise_yoga_id IS NOT NULL THEN
        INSERT INTO bookings (user_id, class_id, type, payment_status, notes, created_at, updated_at)
        VALUES 
            ('40ec6001-c070-426a-9d8d-45326d0d7dac', sunrise_yoga_id, 'monthly', 'completed', 'Looking forward to sunrise yoga!', NOW(), NOW())
        ON CONFLICT DO NOTHING;
    END IF;

    IF reformer_flow_id IS NOT NULL THEN
        INSERT INTO bookings (user_id, class_id, type, payment_status, notes, created_at, updated_at)
        VALUES 
            ('40ec6001-c070-426a-9d8d-45326d0d7dac', reformer_flow_id, 'monthly', 'completed', 'First time trying reformer pilates', NOW(), NOW())
        ON CONFLICT DO NOTHING;
    END IF;

    -- Create bookings for other demo users to show realistic capacity
    IF sunrise_yoga_id IS NOT NULL THEN
        INSERT INTO bookings (user_id, class_id, type, payment_status, notes, created_at, updated_at)
        VALUES 
            ('550e8400-e29b-41d4-a716-446655440001', sunrise_yoga_id, 'drop-in', 'completed', NULL, NOW(), NOW()),
            ('550e8400-e29b-41d4-a716-446655440002', sunrise_yoga_id, 'monthly', 'completed', 'Excited!', NOW(), NOW()),
            ('550e8400-e29b-41d4-a716-446655440003', sunrise_yoga_id, 'drop-in', 'pending', NULL, NOW(), NOW())
        ON CONFLICT DO NOTHING;
    END IF;

    IF aqua_hiit_id IS NOT NULL THEN
        INSERT INTO bookings (user_id, class_id, type, payment_status, notes, created_at, updated_at)
        VALUES 
            ('550e8400-e29b-41d4-a716-446655440001', aqua_hiit_id, 'one-time', 'completed', 'Trying aqua fitness', NOW(), NOW()),
            ('550e8400-e29b-41d4-a716-446655440002', aqua_hiit_id, 'monthly', 'completed', NULL, NOW(), NOW())
        ON CONFLICT DO NOTHING;
    END IF;

    IF beach_bootcamp_id IS NOT NULL THEN
        INSERT INTO bookings (user_id, class_id, type, payment_status, notes, created_at, updated_at)
        VALUES 
            ('550e8400-e29b-41d4-a716-446655440002', beach_bootcamp_id, 'monthly', 'completed', 'Beach workouts are the best', NOW(), NOW()),
            ('550e8400-e29b-41d4-a716-446655440003', beach_bootcamp_id, 'drop-in', 'pending', NULL, NOW(), NOW())
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Show summary
SELECT 
    (SELECT COUNT(*) FROM gyms) as total_gyms,
    (SELECT COUNT(*) FROM classes WHERE schedule > CURRENT_TIMESTAMP) as upcoming_classes,
    (SELECT COUNT(*) FROM bookings) as total_bookings,
    (SELECT COUNT(*) FROM bookings WHERE user_id = '40ec6001-c070-426a-9d8d-45326d0d7dac') as mario_bookings,
    (SELECT monthly_credits FROM profiles WHERE id = '40ec6001-c070-426a-9d8d-45326d0d7dac') as mario_credits;

-- Show Mario's upcoming bookings
SELECT 
    b.id as booking_id,
    c.title as class_name,
    g.name as gym_name,
    c.schedule,
    b.type as booking_type,
    b.payment_status,
    b.notes
FROM bookings b
JOIN classes c ON b.class_id = c.id
JOIN gyms g ON c.gym_id = g.id
WHERE b.user_id = '40ec6001-c070-426a-9d8d-45326d0d7dac'
    AND c.schedule > CURRENT_TIMESTAMP
ORDER BY c.schedule;