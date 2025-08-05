-- Auto Profile Creation for Cabo Fit Pass
-- This SQL file creates triggers and functions to automatically create user profiles

-- First, add deleted_at column if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON profiles(deleted_at) WHERE deleted_at IS NOT NULL;

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    monthly_credits,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'fullName', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    COALESCE((NEW.raw_user_meta_data->>'monthly_credits')::INTEGER, 4),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to handle user metadata updates
CREATE OR REPLACE FUNCTION handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if metadata changed
  IF OLD.raw_user_meta_data IS DISTINCT FROM NEW.raw_user_meta_data THEN
    UPDATE public.profiles SET
      full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'fullName', profiles.full_name),
      role = COALESCE(NEW.raw_user_meta_data->>'role', profiles.role),
      monthly_credits = COALESCE((NEW.raw_user_meta_data->>'monthly_credits')::INTEGER, profiles.monthly_credits),
      updated_at = NOW()
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for user metadata updates
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_user_update();

-- Helper function to get or create profile
CREATE OR REPLACE FUNCTION get_or_create_profile(user_id UUID)
RETURNS TABLE(
  id UUID,
  email TEXT,
  full_name TEXT,
  role TEXT,
  monthly_credits INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  profile_record RECORD;
  auth_user RECORD;
BEGIN
  -- First try to get existing profile
  SELECT * INTO profile_record FROM public.profiles WHERE profiles.id = user_id AND deleted_at IS NULL;
  
  IF FOUND THEN
    RETURN QUERY SELECT 
      profile_record.id,
      profile_record.email,
      profile_record.full_name,
      profile_record.role,
      profile_record.monthly_credits,
      profile_record.created_at,
      profile_record.updated_at;
    RETURN;
  END IF;
  
  -- Get auth user data
  SELECT * INTO auth_user FROM auth.users WHERE users.id = user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found in auth.users';
  END IF;
  
  -- Create new profile
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    monthly_credits,
    created_at,
    updated_at
  )
  VALUES (
    auth_user.id,
    auth_user.email,
    COALESCE(auth_user.raw_user_meta_data->>'full_name', auth_user.raw_user_meta_data->>'fullName', 'User'),
    COALESCE(auth_user.raw_user_meta_data->>'role', 'user'),
    COALESCE((auth_user.raw_user_meta_data->>'monthly_credits')::INTEGER, 4),
    NOW(),
    NOW()
  )
  RETURNING * INTO profile_record;
  
  RETURN QUERY SELECT 
    profile_record.id,
    profile_record.email,
    profile_record.full_name,
    profile_record.role,
    profile_record.monthly_credits,
    profile_record.created_at,
    profile_record.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Migrate existing users without profiles
DO $$
DECLARE
  auth_user RECORD;
BEGIN
  FOR auth_user IN 
    SELECT u.id, u.email, u.raw_user_meta_data
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.id
    WHERE p.id IS NULL
  LOOP
    INSERT INTO public.profiles (
      id,
      email,
      full_name,
      role,
      monthly_credits,
      created_at,
      updated_at
    )
    VALUES (
      auth_user.id,
      auth_user.email,
      COALESCE(auth_user.raw_user_meta_data->>'full_name', auth_user.raw_user_meta_data->>'fullName', 'User'),
      COALESCE(auth_user.raw_user_meta_data->>'role', 'user'),
      COALESCE((auth_user.raw_user_meta_data->>'monthly_credits')::INTEGER, 4),
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;
  END LOOP;
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_profile(UUID) TO authenticated;

-- Test the setup
SELECT 'Auto profile creation setup completed successfully!' as status;