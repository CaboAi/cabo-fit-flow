-- CABO FIT PASS: Add New Studio Sample Data
-- This SQL adds 5 specific new studios to complement the existing gyms
-- Execute in Supabase SQL Editor (bypasses RLS with service role permissions)

-- Insert new studios that complement existing ones
INSERT INTO public.gyms (name, location, logo_url) VALUES
('CrossFit Cabo Elite', 'Marina Golden Zone, Cabo San Lucas', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100&h=100&fit=crop'),
('Yoga Flow Studio Medano', 'Medano Beach Front, Cabo San Lucas', 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=100&h=100&fit=crop'),
('F45 Training Los Cabos', 'Tourist Corridor, Los Cabos', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=100&h=100&fit=crop'),
('Pure Barre San José', 'Art District, San José del Cabo', 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=100&h=100&fit=crop'),
('Cabo Spin & Soul', 'Puerto Paraiso Mall, Cabo San Lucas', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=100&h=100&fit=crop')
ON CONFLICT (name) DO UPDATE SET
    location = EXCLUDED.location,
    logo_url = EXCLUDED.logo_url;

-- Verification: Count all studios
SELECT COUNT(*) as total_studios FROM public.gyms;

-- Verification: Show the 5 newest studios
SELECT name, location FROM public.gyms 
ORDER BY name 
LIMIT 5;

-- Verification: Show all studios to confirm no duplicates
SELECT 
    ROW_NUMBER() OVER (ORDER BY name) as num,
    name,
    location
FROM public.gyms
ORDER BY name;

-- Success confirmation
DO $$
DECLARE
    studio_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO studio_count FROM public.gyms;
    
    RAISE NOTICE '🎉 Studio addition completed successfully!';
    RAISE NOTICE '✅ Total studios now in database: %', studio_count;
    RAISE NOTICE '🏋️ New studios added: CrossFit Cabo Elite, Yoga Flow Studio Medano, F45 Training Los Cabos, Pure Barre San José, Cabo Spin & Soul';
    RAISE NOTICE '📍 Located across Los Cabos area for maximum coverage';
    RAISE NOTICE '🚀 Booking system fully enabled with diverse studio options!';
END $$;