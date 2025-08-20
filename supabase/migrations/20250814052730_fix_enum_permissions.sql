-- Fix enum permissions and recreate function with proper search path
-- Grant usage on the enum type to public
GRANT USAGE ON TYPE public.app_role TO public;

-- Recreate the handle_new_user function with explicit schema references
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'display_name');
  
  -- Insert user role if provided in metadata
  IF NEW.raw_user_meta_data ->> 'role' IS NOT NULL THEN
    -- Use explicit casting without schema prefix
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, (NEW.raw_user_meta_data ->> 'role')::public.app_role);
  END IF;
  
  RETURN NEW;
END;
$$;