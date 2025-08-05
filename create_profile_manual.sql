-- Manual SQL script to fix profiles_id_fkey foreign key violation
-- Run this in Supabase SQL Editor with elevated permissions

-- Step 1: Check if user exists in auth.users (for reference)
-- Note: This may not work with anon key, but shows the expected structure
-- SELECT id, email, created_at FROM auth.users WHERE id = '40ec6001-c070-426a-9d8d-45326d0d7dac';

-- Step 2: Create or update the profile in public.profiles
-- This should work even with RLS because it's run as the service role in SQL Editor
INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    role, 
    created_at, 
    updated_at
) VALUES (
    '40ec6001-c070-426a-9d8d-45326d0d7dac',
    'mariopjr91@gmail.com',
    'Mario Perez',
    'user',
    NOW(),
    NOW()
) 
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    updated_at = NOW();

-- Step 3: Verify the profile was created
SELECT id, email, full_name, role, created_at, updated_at 
FROM public.profiles 
WHERE id = '40ec6001-c070-426a-9d8d-45326d0d7dac';

-- Step 4: Test that we can now reference this profile
-- Check if the class exists for our test booking
SELECT id, title, capacity, price 
FROM public.classes 
WHERE id = 'e0b37bc6-4d8d-4610-97fe-e94f7ba1ba06';

-- Step 5: Test booking creation (optional - can be done via API after profile exists)
-- INSERT INTO public.bookings (
--     user_id,
--     class_id,
--     type,
--     payment_status,
--     notes,
--     created_at
-- ) VALUES (
--     '40ec6001-c070-426a-9d8d-45326d0d7dac',
--     'e0b37bc6-4d8d-4610-97fe-e94f7ba1ba06',
--     'drop-in',
--     'pending',
--     'Test booking',
--     NOW()
-- )
-- ON CONFLICT (user_id, class_id) DO NOTHING;

-- Show final verification
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    COUNT(b.id) as booking_count
FROM public.profiles p
LEFT JOIN public.bookings b ON p.id = b.user_id
WHERE p.id = '40ec6001-c070-426a-9d8d-45326d0d7dac'
GROUP BY p.id, p.email, p.full_name, p.role;