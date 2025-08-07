-- CRITICAL SECURITY FIXES FOR CABO FITPASS
-- Phase 1: Fix Missing RLS Policies and Remove Dangerous Dev Mode Policies

-- 1. Remove dangerous "Dev mode - allow all" policies
DROP POLICY IF EXISTS "Dev mode - allow all" ON public.bookings;
DROP POLICY IF EXISTS "Dev mode - allow all" ON public.profiles;

-- 2. Create proper RLS policies for profiles table
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- 3. Create RLS policies for payments table
CREATE POLICY "Users can view their own payments"
ON public.payments
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payments"
ON public.payments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 4. Create RLS policies for plans table (public read access for pricing)
CREATE POLICY "Anyone can view active plans"
ON public.plans
FOR SELECT
USING (is_active = true);

CREATE POLICY "Only service role can modify plans"
ON public.plans
FOR ALL
USING (current_setting('role') = 'service_role');

-- 5. Create RLS policies for subscriptions table
CREATE POLICY "Users can view their own subscriptions"
ON public.subscriptions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own subscriptions"
ON public.subscriptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions"
ON public.subscriptions
FOR UPDATE
USING (auth.uid() = user_id);

-- 6. Create RLS policies for workouts table
CREATE POLICY "Users can view their own workouts"
ON public.workouts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own workouts"
ON public.workouts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workouts"
ON public.workouts
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workouts"
ON public.workouts
FOR DELETE
USING (auth.uid() = user_id);

-- 7. Secure database functions with proper search_path
CREATE OR REPLACE FUNCTION public.book_class_with_credits(p_user_id uuid, p_class_id uuid, p_booking_type character varying DEFAULT 'subscription'::character varying)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
    required_credits INTEGER := 1;
    current_balance INTEGER := 0;
    booking_id UUID;
BEGIN
    -- Simple fallback version for demo
    -- Get user's current credit balance (fallback to demo balance)
    SELECT COALESCE(monthly_credits, 15) INTO current_balance 
    FROM profiles WHERE id = p_user_id;
    
    -- Check if user has enough credits (using 1 credit for demo)
    IF current_balance < required_credits THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'insufficient_credits',
            'required_credits', required_credits,
            'current_balance', current_balance,
            'shortage', required_credits - current_balance
        );
    END IF;
    
    -- Create the booking
    INSERT INTO bookings (user_id, class_id, type, payment_status, created_at)
    VALUES (p_user_id, p_class_id, p_booking_type, 'completed', NOW())
    RETURNING id INTO booking_id;
    
    -- Deduct credits (simple version)
    UPDATE profiles 
    SET monthly_credits = monthly_credits - required_credits
    WHERE id = p_user_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'booking_id', booking_id,
        'credits_used', required_credits,
        'remaining_balance', current_balance - required_credits
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_or_create_profile(user_id uuid)
 RETURNS TABLE(id uuid, email text, full_name text, role text, monthly_credits integer, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.handle_user_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
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
$function$;