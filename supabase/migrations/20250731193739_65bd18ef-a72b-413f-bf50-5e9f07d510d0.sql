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
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookings" 
ON public.bookings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings" 
ON public.bookings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookings" 
ON public.bookings 
FOR DELETE 
USING (auth.uid() = user_id);

-- Users table policies (users can only access their own data)
CREATE POLICY "Users can view their own user record" 
ON public.users 
FOR SELECT 
USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own user record" 
ON public.users 
FOR UPDATE 
USING (auth.uid()::text = id::text);