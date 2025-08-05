-- Enable Row Level Security on all tables
ALTER TABLE public.gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Gyms table policies (public read, admin write)
CREATE POLICY "Anyone can view gyms" 
ON public.gyms 
FOR SELECT 
USING (true);

CREATE POLICY "Only authenticated users can insert gyms" 
ON public.gyms 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Only authenticated users can update gyms" 
ON public.gyms 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only authenticated users can delete gyms" 
ON public.gyms 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Classes table policies (public read, authenticated write)
CREATE POLICY "Anyone can view classes" 
ON public.classes 
FOR SELECT 
USING (true);

CREATE POLICY "Only authenticated users can insert classes" 
ON public.classes 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Only authenticated users can update classes" 
ON public.classes 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only authenticated users can delete classes" 
ON public.classes 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Bookings table policies (users can only access their own bookings)
CREATE POLICY "Users can view their own bookings" 
ON public.bookings 
FOR SELECT 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own bookings" 
ON public.bookings 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own bookings" 
ON public.bookings 
FOR UPDATE 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own bookings" 
ON public.bookings 
FOR DELETE 
USING (auth.uid()::text = user_id::text);

-- Users table policies (users can only access their own data)
CREATE POLICY "Users can view their own user record" 
ON public.users 
FOR SELECT 
USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own user record" 
ON public.users 
FOR UPDATE 
USING (auth.uid()::text = id::text);

-- Fix bookings table to reference auth.users properly
ALTER TABLE public.bookings 
ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

-- Add foreign key constraint for proper referential integrity
ALTER TABLE public.bookings 
ADD CONSTRAINT bookings_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;