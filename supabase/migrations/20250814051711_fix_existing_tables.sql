-- Fix existing table conflicts by adding IF NOT EXISTS

-- Create user_roles table only if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Create the missing trigger for user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Insert profile (if not exists)
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'display_name')
  ON CONFLICT (id) DO NOTHING;
  
  -- Insert user role if provided in metadata
  IF NEW.raw_user_meta_data ->> 'role' IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, (NEW.raw_user_meta_data ->> 'role')::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update RLS policy
DROP POLICY IF EXISTS "Users can insert their own roles" ON public.user_roles;
CREATE POLICY "Users can insert their own roles" ON public.user_roles
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);