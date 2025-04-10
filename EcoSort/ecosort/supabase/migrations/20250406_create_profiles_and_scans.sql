
-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  points INTEGER DEFAULT 0,
  scans INTEGER DEFAULT 0,
  badges TEXT[] DEFAULT ARRAY['Newcomer'],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create scans table
CREATE TABLE IF NOT EXISTS public.scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  waste_type TEXT NOT NULL,
  image_url TEXT,
  points INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies for scans
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own scans"
  ON public.scans
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scans"
  ON public.scans
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create function to increment user points
CREATE OR REPLACE FUNCTION public.increment_user_points(user_id_param UUID, points_to_add INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET 
    points = points + points_to_add,
    scans = scans + 1
  WHERE user_id = user_id_param;
END;
$$ LANGUAGE plpgsql;
