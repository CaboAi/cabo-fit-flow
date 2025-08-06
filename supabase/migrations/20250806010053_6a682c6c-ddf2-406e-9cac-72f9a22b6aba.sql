-- Ensure monthly_credits column exists in profiles table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'monthly_credits'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN monthly_credits integer DEFAULT 4;
    END IF;
END $$;

-- Also ensure we have the correct columns that are being used in the code
DO $$ 
BEGIN
    -- Add missing columns if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' 
        AND column_name = 'created_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.bookings 
        ADD COLUMN created_at timestamp with time zone DEFAULT now();
    END IF;
END $$;