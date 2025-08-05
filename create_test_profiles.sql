-- SQL Script to create test user profiles for Cabo FitPass
-- Run this in Supabase SQL Editor to create test profiles

-- Create test user profiles
INSERT INTO profiles (id, email, full_name, created_at, updated_at) 
VALUES 
  ('40ec6001-c070-426a-9d8d-45326d0d7dac', 'testuser1@cabofit.local', 'Test User 1', NOW(), NOW()),
  ('661db286-593a-4c1e-8ce8-fb4ea43cd58a', 'testuser2@cabofit.local', 'Test User 2', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Verify profiles were created
SELECT id, email, full_name, created_at 
FROM profiles 
WHERE id IN ('40ec6001-c070-426a-9d8d-45326d0d7dac', '661db286-593a-4c1e-8ce8-fb4ea43cd58a');

-- Optional: If you want to temporarily disable RLS for testing
-- (WARNING: Only use in development, never in production)
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- To re-enable RLS after testing:
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;