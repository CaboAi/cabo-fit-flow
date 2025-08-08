-- Phase 1: Create roles system and helper function
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'app_role' AND typnamespace = 'public'::regnamespace
  ) THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'gym_owner', 'user');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Service role can manage roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (current_setting('role', true) = 'service_role')
WITH CHECK (current_setting('role', true) = 'service_role');

-- Helper: role checker
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  );
$$;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- Phase 2: Restrict write access on classes & gyms to admins/gym owners
-- Classes
DROP POLICY IF EXISTS "Only authenticated users can insert classes" ON public.classes;
DROP POLICY IF EXISTS "Only authenticated users can update classes" ON public.classes;
DROP POLICY IF EXISTS "Only authenticated users can delete classes" ON public.classes;

CREATE POLICY "Admins and gym owners can insert classes"
ON public.classes
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'gym_owner'::public.app_role)
);

CREATE POLICY "Admins and gym owners can update classes"
ON public.classes
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'gym_owner'::public.app_role)
);

CREATE POLICY "Admins and gym owners can delete classes"
ON public.classes
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'gym_owner'::public.app_role)
);

-- Gyms
DROP POLICY IF EXISTS "Only authenticated users can insert gyms" ON public.gyms;
DROP POLICY IF EXISTS "Only authenticated users can update gyms" ON public.gyms;
DROP POLICY IF EXISTS "Only authenticated users can delete gyms" ON public.gyms;

CREATE POLICY "Admins and gym owners can insert gyms"
ON public.gyms
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'gym_owner'::public.app_role)
);

CREATE POLICY "Admins and gym owners can update gyms"
ON public.gyms
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'gym_owner'::public.app_role)
);

CREATE POLICY "Admins and gym owners can delete gyms"
ON public.gyms
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'gym_owner'::public.app_role)
);

-- Phase 3: Secure and align credit functions (keep old overloads intact)
-- New UUID-based get_user_credit_balance
CREATE OR REPLACE FUNCTION public.get_user_credit_balance(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  -- Ensure record exists (safe no-op if table missing at runtime)
  INSERT INTO public.user_credits (user_id, credits, last_updated)
  VALUES (p_user_id, 4, NOW())
  ON CONFLICT (user_id) DO NOTHING;

  RETURN COALESCE(
    (SELECT credits FROM public.user_credits WHERE user_id = p_user_id)::INT,
    0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth;

-- New UUID-based get_class_credit_cost with safe fallback
CREATE OR REPLACE FUNCTION public.get_class_credit_cost(p_class_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_cost INTEGER;
BEGIN
  BEGIN
    SELECT COALESCE(credit_cost, 1) INTO v_cost FROM public.classes WHERE id = p_class_id;
  EXCEPTION WHEN undefined_column THEN
    RETURN 1; -- classes table may not have credit_cost yet
  END;

  RETURN COALESCE(v_cost, 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- New UUID-based deduct_user_credits returning JSONB
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
  -- Ensure user record
  INSERT INTO public.user_credits (user_id, credits, last_updated)
  VALUES (p_user_id, 4, NOW())
  ON CONFLICT (user_id) DO NOTHING;

  -- Lock and read balance
  SELECT credits INTO v_current_balance
  FROM public.user_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF COALESCE(v_current_balance, 0) < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient credits',
      'current_balance', COALESCE(v_current_balance, 0),
      'required_amount', p_amount
    );
  END IF;

  v_new_balance := v_current_balance - p_amount;

  UPDATE public.user_credits
  SET credits = v_new_balance,
      last_updated = NOW()
  WHERE user_id = p_user_id;

  -- Log transaction if table exists
  BEGIN
    INSERT INTO public.credit_transactions (
      user_id, amount, transaction_type, description, class_id
    ) VALUES (
      p_user_id, -p_amount, 'DEDUCT', p_description, p_booking_id
    ) RETURNING id INTO v_transaction_id;
  EXCEPTION WHEN undefined_table THEN
    v_transaction_id := NULL; -- No-op if table doesn't exist
  END;

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

-- New UUID-based add_user_credits returning JSONB
CREATE OR REPLACE FUNCTION public.add_user_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_type VARCHAR(50) DEFAULT 'purchase',
  p_description TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_prev INTEGER;
  v_new INTEGER;
BEGIN
  INSERT INTO public.user_credits (user_id, credits, last_updated)
  VALUES (p_user_id, 4, NOW())
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.user_credits
  SET credits = credits + p_amount,
      last_updated = NOW()
  WHERE user_id = p_user_id
  RETURNING credits - p_amount, credits INTO v_prev, v_new;

  -- Log transaction if table exists
  BEGIN
    INSERT INTO public.credit_transactions (
      user_id, amount, transaction_type, source, description
    ) VALUES (
      p_user_id, p_amount, 'ADD', p_type, p_description
    );
  EXCEPTION WHEN undefined_table THEN
    -- ignore if table not present
    NULL;
  END;

  RETURN jsonb_build_object(
    'success', true,
    'previous_balance', COALESCE(v_prev, 0),
    'amount_added', p_amount,
    'new_balance', COALESCE(v_new, p_amount)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth;

GRANT EXECUTE ON FUNCTION public.get_user_credit_balance(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_class_credit_cost(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.deduct_user_credits(uuid, integer, text, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.add_user_credits(uuid, integer, varchar, text) TO authenticated, service_role;

-- Phase 4: Fix search_path on existing trigger functions
CREATE OR REPLACE FUNCTION public.validate_booking_data()
RETURNS TRIGGER AS $$
DECLARE
  class_capacity INTEGER;
  current_bookings INTEGER;
  class_exists BOOLEAN;
  user_exists BOOLEAN;
BEGIN
  IF NEW.user_id IS NULL THEN RAISE EXCEPTION 'User ID cannot be null'; END IF;
  IF NEW.class_id IS NULL THEN RAISE EXCEPTION 'Class ID cannot be null'; END IF;

  IF NEW.type IS NULL THEN NEW.type := 'drop-in'; END IF;
  IF NEW.payment_status IS NULL THEN NEW.payment_status := 'pending'; END IF;

  IF NEW.type NOT IN ('drop-in','subscription','day-pass','trial','membership') THEN
    RAISE EXCEPTION 'Invalid booking type: %', NEW.type;
  END IF;
  IF NEW.payment_status NOT IN ('pending','completed','failed','cancelled','refunded') THEN
    RAISE EXCEPTION 'Invalid payment status: %', NEW.payment_status;
  END IF;

  SELECT EXISTS(SELECT 1 FROM public.classes WHERE id = NEW.class_id) INTO class_exists;
  IF NOT class_exists THEN RAISE EXCEPTION 'Class with ID % does not exist', NEW.class_id; END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.profiles WHERE id = NEW.user_id AND (deleted_at IS NULL OR deleted_at IS NULL)
    UNION
    SELECT 1 FROM auth.users WHERE id = NEW.user_id
  ) INTO user_exists;
  IF NOT user_exists THEN RAISE EXCEPTION 'User with ID % does not exist or is deleted', NEW.user_id; END IF;

  BEGIN
    SELECT capacity INTO class_capacity FROM public.classes WHERE id = NEW.class_id;
  EXCEPTION WHEN undefined_column THEN
    class_capacity := 999;
  END;
  class_capacity := COALESCE(class_capacity, 999);

  SELECT COUNT(*) INTO current_bookings
  FROM public.bookings
  WHERE class_id = NEW.class_id
    AND payment_status IN ('completed','pending')
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID);

  IF class_capacity < 999 AND current_bookings >= class_capacity THEN
    RAISE EXCEPTION 'Class is full. Capacity: %, Current bookings: %', class_capacity, current_bookings;
  END IF;

  NEW.created_at := COALESCE(NEW.created_at, NOW());
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth;

CREATE OR REPLACE FUNCTION public.log_booking_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.booking_audit_log (booking_id, action, old_data, new_data, user_id, timestamp)
    VALUES (NEW.id, 'INSERT', NULL, row_to_json(NEW), NEW.user_id, NOW());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.booking_audit_log (booking_id, action, old_data, new_data, user_id, timestamp)
    VALUES (NEW.id, 'UPDATE', row_to_json(OLD), row_to_json(NEW), NEW.user_id, NOW());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.booking_audit_log (booking_id, action, old_data, new_data, user_id, timestamp)
    VALUES (OLD.id, 'DELETE', row_to_json(OLD), NULL, OLD.user_id, NOW());
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

CREATE OR REPLACE FUNCTION public.check_booking_type()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type IS NULL THEN NEW.type := 'drop-in'; END IF;
  IF NEW.type NOT IN ('drop-in','subscription','day-pass','trial','membership') THEN
    RAISE EXCEPTION 'Invalid booking type: %', NEW.type;
  END IF;
  IF NEW.payment_status IS NULL THEN NEW.payment_status := 'pending'; END IF;
  IF NEW.created_at IS NULL THEN NEW.created_at := NOW(); END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Add your profile initialization logic here if needed
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth;

-- Verification note
SELECT 'Security fixes migration completed.' AS status;