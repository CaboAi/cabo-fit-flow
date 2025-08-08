-- CABO FIT PASS: Insert Studio Sample Data
-- Execute this in Supabase SQL Editor with service role permissions
-- This will add 5 sample fitness studios to the 'gyms' table

-- Note: The database uses 'gyms' table to represent fitness studios/venues
-- The table structure is: id (UUID), name (string), location (string), logo_url (string)

INSERT INTO public.gyms (name, location, logo_url) VALUES
('CrossFit Cabo', 'Marina Golden Zone, Cabo San Lucas', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100&h=100&fit=crop'),
('Yoga Flow Studio', 'Medano Beach, Cabo San Lucas', 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=100&h=100&fit=crop'),
('F45 Training Cabo', 'Downtown, Cabo San Lucas', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=100&h=100&fit=crop'),
('Pure Barre Cabo', 'Palmilla, San José del Cabo', 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=100&h=100&fit=crop'),
('Cabo Spin Studio', 'Puerto Paraiso, Cabo San Lucas', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=100&h=100&fit=crop')
ON CONFLICT (name) DO UPDATE SET
    location = EXCLUDED.location,
    logo_url = EXCLUDED.logo_url;

-- Verification queries
-- Count total studios/gyms
SELECT COUNT(*) as studio_count FROM public.gyms;

-- Show sample studios with their locations
SELECT name, location FROM public.gyms LIMIT 3;

-- Show all studios for verification
SELECT 
    id,
    name,
    location,
    logo_url
FROM public.gyms
ORDER BY name;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '🎉 Studio data insertion completed!';
    RAISE NOTICE '✅ Added 5 fitness studios to the gyms table';
    RAISE NOTICE '🏋️ Studios: CrossFit Cabo, Yoga Flow Studio, F45 Training Cabo, Pure Barre Cabo, Cabo Spin Studio';
    RAISE NOTICE '📍 Located across Cabo San Lucas and San José del Cabo';
    RAISE NOTICE '🚀 Ready for booking system testing!';
END $$;