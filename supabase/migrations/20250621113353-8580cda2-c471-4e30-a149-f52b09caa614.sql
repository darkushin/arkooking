
-- Create a table for recipes
CREATE TABLE public.recipes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  image TEXT,
  cook_time INTEGER NOT NULL DEFAULT 0,
  prep_time INTEGER NOT NULL DEFAULT 0,
  servings INTEGER NOT NULL DEFAULT 1,
  tags TEXT[] DEFAULT '{}',
  ingredients TEXT[] DEFAULT '{}',
  instructions TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS) to ensure users can only see their own recipes
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

-- Create policy that allows users to SELECT their own recipes
CREATE POLICY "Users can view their own recipes" 
  ON public.recipes 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy that allows users to INSERT their own recipes
CREATE POLICY "Users can create their own recipes" 
  ON public.recipes 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy that allows users to UPDATE their own recipes
CREATE POLICY "Users can update their own recipes" 
  ON public.recipes 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create policy that allows users to DELETE their own recipes
CREATE POLICY "Users can delete their own recipes" 
  ON public.recipes 
  FOR DELETE 
  USING (auth.uid() = user_id);
