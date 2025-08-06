-- Demo Data Setup for Cabo Fit Pass
-- Execute this script in Supabase SQL Editor
-- This creates comprehensive demo data for studio partner demonstrations

-- First, let's check and create demo users if they don't exist
DO $$
BEGIN
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
END $$;

-- Create new gyms for variety (simplified structure matching existing schema)
INSERT INTO gyms (name, location, logo_url)
VALUES 
    ('Sunset Yoga Studio', 'Playa El Médano, Cabo San Lucas', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=100'),
    ('Cabo CrossFit', 'Av. Lázaro Cárdenas, Cabo San Lucas', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=100'),
    ('Aqua Fitness Center', 'Marina Golden Zone, Cabo San Lucas', 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=100'),
    ('Desert Pilates', 'Plaza San José, San José del Cabo', 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=100'),
    ('Beach Bootcamp Cabo', 'Medano Beach, Cabo San Lucas', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=100')
ON CONFLICT (name) DO NOTHING;

-- Get gym IDs for creating classes
DO $$
DECLARE 
    sunset_yoga_id UUID;
    cabo_crossfit_id UUID;
    aqua_fitness_id UUID;
    desert_pilates_id UUID;
    beachfit_id UUID;
    muscle_beach_id UUID;
    flex_fitness_id UUID;
BEGIN
    SELECT id INTO sunset_yoga_id FROM gyms WHERE name = 'Sunset Yoga Studio' LIMIT 1;
    SELECT id INTO cabo_crossfit_id FROM gyms WHERE name = 'Cabo CrossFit' LIMIT 1;
    SELECT id INTO aqua_fitness_id FROM gyms WHERE name = 'Aqua Fitness Center' LIMIT 1;
    SELECT id INTO desert_pilates_id FROM gyms WHERE name = 'Desert Pilates' LIMIT 1;
    SELECT id INTO beachfit_id FROM gyms WHERE name = 'BeachFit Cabo' LIMIT 1;
    SELECT id INTO muscle_beach_id FROM gyms WHERE name = 'Muscle Beach Gym' LIMIT 1;
    SELECT id INTO flex_fitness_id FROM gyms WHERE name = 'Flex Fitness Studio' LIMIT 1;

    -- Create diverse classes for the next 7 days
    -- Day 1 Classes
    INSERT INTO classes (gym_id, name, description, instructor, max_capacity, duration, price, schedule, created_at, updated_at)
    VALUES 
        (sunset_yoga_id, 'Sunrise Beach Yoga', 'Start your day with gentle yoga as the sun rises over the Sea of Cortez', 'Maria Santos', 20, 60, 22.00, 
         CURRENT_DATE + INTERVAL '1 day' + TIME '06:00:00', NOW(), NOW()),
        
        (cabo_crossfit_id, 'CrossFit Fundamentals', 'Perfect for beginners - learn proper form and technique', 'Jake Thompson', 12, 60, 25.00,
         CURRENT_DATE + INTERVAL '1 day' + TIME '07:00:00', NOW(), NOW()),
        
        (aqua_fitness_id, 'Aqua HIIT', 'High-intensity interval training in the pool - easy on joints, tough on calories', 'Sofia Martinez', 15, 45, 30.00,
         CURRENT_DATE + INTERVAL '1 day' + TIME '08:00:00', NOW(), NOW()),
        
        (desert_pilates_id, 'Reformer Flow', 'Dynamic reformer class focusing on core strength and flexibility', 'Emma Wilson', 8, 55, 38.00,
         CURRENT_DATE + INTERVAL '1 day' + TIME '09:00:00', NOW(), NOW()),
        
        (beachfit_id, 'Beach Bootcamp', 'Total body workout on the sand - bring your energy!', 'Carlos Mendez', 25, 60, 20.00,
         CURRENT_DATE + INTERVAL '1 day' + TIME '10:00:00', NOW(), NOW()),

        -- Day 2 Classes
        (sunset_yoga_id, 'Vinyasa Flow', 'Dynamic flowing sequence linking breath with movement', 'Luna Rodriguez', 18, 75, 25.00,
         CURRENT_DATE + INTERVAL '2 days' + TIME '08:00:00', NOW(), NOW()),
        
        (cabo_crossfit_id, 'Olympic Lifting', 'Focus on snatch and clean & jerk technique', 'Mike Johnson', 10, 90, 35.00,
         CURRENT_DATE + INTERVAL '2 days' + TIME '16:00:00', NOW(), NOW()),
        
        (aqua_fitness_id, 'Aqua Zumba', 'Latin-inspired dance fitness in the water', 'Carmen Lopez', 20, 50, 18.00,
         CURRENT_DATE + INTERVAL '2 days' + TIME '17:00:00', NOW(), NOW()),
        
        (muscle_beach_id, 'Strength & Conditioning', 'Build muscle and improve athletic performance', 'Diego Silva', 15, 60, 28.00,
         CURRENT_DATE + INTERVAL '2 days' + TIME '18:00:00', NOW(), NOW()),

        -- Day 3 Classes
        (sunset_yoga_id, 'Sunset Yin Yoga', 'Deep stretching and relaxation as the sun sets', 'Maria Santos', 22, 90, 30.00,
         CURRENT_DATE + INTERVAL '3 days' + TIME '17:30:00', NOW(), NOW()),
        
        (desert_pilates_id, 'Mat Pilates', 'Classic mat work focusing on core stability', 'Rachel Green', 12, 45, 25.00,
         CURRENT_DATE + INTERVAL '3 days' + TIME '11:00:00', NOW(), NOW()),
        
        (flex_fitness_id, 'TRX Training', 'Suspension training for full-body strength', 'Tom Anderson', 10, 45, 32.00,
         CURRENT_DATE + INTERVAL '3 days' + TIME '12:00:00', NOW(), NOW()),

        -- Day 4 Classes
        (cabo_crossfit_id, 'Hero WOD', 'Challenge yourself with our workout of the day', 'Jake Thompson', 15, 60, 30.00,
         CURRENT_DATE + INTERVAL '4 days' + TIME '06:00:00', NOW(), NOW()),
        
        (aqua_fitness_id, 'Gentle Water Aerobics', 'Low-impact workout perfect for all ages', 'Nancy White', 25, 45, 15.00,
         CURRENT_DATE + INTERVAL '4 days' + TIME '09:00:00', NOW(), NOW()),
        
        (beachfit_id, 'Sunset Run Club', 'Group run along the beach followed by stretching', 'Luis Garcia', 30, 60, 15.00,
         CURRENT_DATE + INTERVAL '4 days' + TIME '18:00:00', NOW(), NOW()),

        -- Day 5 Classes
        (sunset_yoga_id, 'Power Yoga', 'Athletic yoga practice to build strength and stamina', 'Alex Chen', 16, 60, 28.00,
         CURRENT_DATE + INTERVAL '5 days' + TIME '07:00:00', NOW(), NOW()),
        
        (desert_pilates_id, 'Pilates Sculpt', 'Combine pilates with light weights for toning', 'Emma Wilson', 10, 50, 35.00,
         CURRENT_DATE + INTERVAL '5 days' + TIME '10:00:00', NOW(), NOW()),
        
        (muscle_beach_id, 'Bodybuilding Basics', 'Learn proper form for major muscle groups', 'Roberto Diaz', 12, 75, 25.00,
         CURRENT_DATE + INTERVAL '5 days' + TIME '16:00:00', NOW(), NOW()),

        -- Day 6 Classes
        (cabo_crossfit_id, 'Partner WOD', 'Team up for a fun and challenging workout', 'Sarah Miller', 16, 60, 25.00,
         CURRENT_DATE + INTERVAL '6 days' + TIME '09:00:00', NOW(), NOW()),
        
        (aqua_fitness_id, 'Deep Water Running', 'Cardio workout using flotation belts', 'Mark Davis', 12, 40, 22.00,
         CURRENT_DATE + INTERVAL '6 days' + TIME '07:30:00', NOW(), NOW()),
        
        (flex_fitness_id, 'Circuit Training', 'Fast-paced stations for total body conditioning', 'Jennifer Lee', 18, 60, 20.00,
         CURRENT_DATE + INTERVAL '6 days' + TIME '17:00:00', NOW(), NOW()),

        -- Day 7 Classes
        (sunset_yoga_id, 'Restorative Yoga', 'Deep relaxation with props and extended holds', 'Maria Santos', 15, 75, 32.00,
         CURRENT_DATE + INTERVAL '7 days' + TIME '19:00:00', NOW(), NOW()),
        
        (beachfit_id, 'Beach Volleyball Fitness', 'Volleyball drills and conditioning on the sand', 'Pablo Hernandez', 20, 90, 18.00,
         CURRENT_DATE + INTERVAL '7 days' + TIME '10:00:00', NOW(), NOW())
    ON CONFLICT DO NOTHING;
END $$;

-- Now create bookings for demo purposes
DO $$
DECLARE
    class1_id UUID;
    class2_id UUID;
    class3_id UUID;
    class4_id UUID;
    class5_id UUID;
    class6_id UUID;
    class7_id UUID;
    class8_id UUID;
    class9_id UUID;
    class10_id UUID;
BEGIN
    -- Get some class IDs for bookings
    SELECT id INTO class1_id FROM classes WHERE name = 'Sunrise Beach Yoga' AND schedule > CURRENT_TIMESTAMP LIMIT 1;
    SELECT id INTO class2_id FROM classes WHERE name = 'Aqua HIIT' AND schedule > CURRENT_TIMESTAMP LIMIT 1;
    SELECT id INTO class3_id FROM classes WHERE name = 'Reformer Flow' AND schedule > CURRENT_TIMESTAMP LIMIT 1;
    SELECT id INTO class4_id FROM classes WHERE name = 'Beach Bootcamp' AND schedule > CURRENT_TIMESTAMP LIMIT 1;
    SELECT id INTO class5_id FROM classes WHERE name = 'Vinyasa Flow' AND schedule > CURRENT_TIMESTAMP LIMIT 1;
    SELECT id INTO class6_id FROM classes WHERE name = 'Olympic Lifting' AND schedule > CURRENT_TIMESTAMP LIMIT 1;
    SELECT id INTO class7_id FROM classes WHERE name = 'Sunset Yin Yoga' AND schedule > CURRENT_TIMESTAMP LIMIT 1;
    SELECT id INTO class8_id FROM classes WHERE name = 'Power Yoga' AND schedule > CURRENT_TIMESTAMP LIMIT 1;
    SELECT id INTO class9_id FROM classes WHERE name = 'Partner WOD' AND schedule > CURRENT_TIMESTAMP LIMIT 1;
    SELECT id INTO class10_id FROM classes WHERE name = 'Morning Yoga Flow' AND schedule < CURRENT_TIMESTAMP LIMIT 1;

    -- Create bookings for Mario (main demo user)
    -- Past booking (completed)
    INSERT INTO bookings (user_id, class_id, type, payment_status, notes, created_at, updated_at)
    VALUES 
        ('40ec6001-c070-426a-9d8d-45326d0d7dac', class10_id, 'monthly', 'completed', 'Great class! Very relaxing.', 
         CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP - INTERVAL '3 days');

    -- Upcoming bookings for Mario
    INSERT INTO bookings (user_id, class_id, type, payment_status, notes, created_at, updated_at)
    VALUES 
        ('40ec6001-c070-426a-9d8d-45326d0d7dac', class1_id, 'monthly', 'completed', 'Looking forward to sunrise yoga!', NOW(), NOW()),
        ('40ec6001-c070-426a-9d8d-45326d0d7dac', class3_id, 'monthly', 'completed', 'First time trying reformer pilates', NOW(), NOW());

    -- Create bookings for other demo users to show realistic capacity
    INSERT INTO bookings (user_id, class_id, type, payment_status, notes, created_at, updated_at)
    VALUES 
        ('550e8400-e29b-41d4-a716-446655440001', class1_id, 'drop-in', 'completed', NULL, NOW(), NOW()),
        ('550e8400-e29b-41d4-a716-446655440002', class1_id, 'monthly', 'completed', 'Excited!', NOW(), NOW()),
        ('550e8400-e29b-41d4-a716-446655440003', class1_id, 'drop-in', 'pending', NULL, NOW(), NOW()),
        
        ('550e8400-e29b-41d4-a716-446655440001', class2_id, 'one-time', 'completed', 'Trying aqua fitness', NOW(), NOW()),
        ('550e8400-e29b-41d4-a716-446655440002', class2_id, 'monthly', 'completed', NULL, NOW(), NOW()),
        
        ('550e8400-e29b-41d4-a716-446655440001', class3_id, 'drop-in', 'completed', 'Love pilates!', NOW(), NOW()),
        ('550e8400-e29b-41d4-a716-446655440003', class3_id, 'monthly', 'completed', NULL, NOW(), NOW()),
        
        ('550e8400-e29b-41d4-a716-446655440001', class4_id, 'drop-in', 'completed', NULL, NOW(), NOW()),
        ('550e8400-e29b-41d4-a716-446655440002', class4_id, 'monthly', 'completed', 'Beach workouts are the best', NOW(), NOW()),
        ('550e8400-e29b-41d4-a716-446655440003', class4_id, 'drop-in', 'pending', NULL, NOW(), NOW()),
        
        ('550e8400-e29b-41d4-a716-446655440001', class5_id, 'monthly', 'completed', NULL, NOW(), NOW()),
        ('550e8400-e29b-41d4-a716-446655440002', class5_id, 'drop-in', 'completed', 'Great instructor', NOW(), NOW()),
        
        ('550e8400-e29b-41d4-a716-446655440001', class6_id, 'one-time', 'completed', 'Olympic lifting is challenging!', NOW(), NOW()),
        
        ('550e8400-e29b-41d4-a716-446655440002', class7_id, 'monthly', 'completed', NULL, NOW(), NOW()),
        ('550e8400-e29b-41d4-a716-446655440003', class7_id, 'drop-in', 'completed', 'Perfect for relaxation', NOW(), NOW()),
        
        ('550e8400-e29b-41d4-a716-446655440001', class8_id, 'drop-in', 'pending', NULL, NOW(), NOW()),
        ('550e8400-e29b-41d4-a716-446655440003', class8_id, 'monthly', 'completed', NULL, NOW(), NOW()),
        
        ('550e8400-e29b-41d4-a716-446655440002', class9_id, 'drop-in', 'completed', 'Fun partner workout', NOW(), NOW())
    ON CONFLICT DO NOTHING;

    -- Update Mario's monthly credits to show he's used 3 of 4
    UPDATE profiles 
    SET monthly_credits = 1 
    WHERE id = '40ec6001-c070-426a-9d8d-45326d0d7dac';
END $$;

-- Create a view for easy demo data verification
CREATE OR REPLACE VIEW demo_overview AS
SELECT 
    (SELECT COUNT(*) FROM gyms) as total_gyms,
    (SELECT COUNT(*) FROM classes WHERE schedule > CURRENT_TIMESTAMP) as upcoming_classes,
    (SELECT COUNT(*) FROM bookings) as total_bookings,
    (SELECT COUNT(*) FROM bookings WHERE user_id = '40ec6001-c070-426a-9d8d-45326d0d7dac') as mario_bookings,
    (SELECT COUNT(*) FROM bookings WHERE user_id = '40ec6001-c070-426a-9d8d-45326d0d7dac' AND created_at > CURRENT_TIMESTAMP - INTERVAL '30 days') as mario_recent_bookings;

-- Display demo overview
SELECT * FROM demo_overview;

-- Show Mario's upcoming bookings with class details
SELECT 
    b.id as booking_id,
    c.name as class_name,
    g.name as gym_name,
    c.schedule,
    c.instructor,
    b.type as booking_type,
    b.payment_status,
    b.notes
FROM bookings b
JOIN classes c ON b.class_id = c.id
JOIN gyms g ON c.gym_id = g.id
WHERE b.user_id = '40ec6001-c070-426a-9d8d-45326d0d7dac'
    AND c.schedule > CURRENT_TIMESTAMP
ORDER BY c.schedule;

-- Summary message
DO $$
BEGIN
    RAISE NOTICE 'Demo data setup complete! 
    - Created 4 new gyms (7+ total)
    - Created 23 new classes across 7 days
    - Created bookings for Mario and demo users
    - Mario has 1 completed and 2 upcoming bookings
    - Mario has 1 of 4 monthly credits remaining';
END $$;