-- Update the handle_new_user trigger to also create user roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'display_name');
  
  -- Insert user role if provided in metadata
  IF NEW.raw_user_meta_data ->> 'role' IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, (NEW.raw_user_meta_data ->> 'role')::app_role);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Also update the RLS policy for user_roles to allow the trigger to work
DROP POLICY IF EXISTS "Users can insert their own roles" ON public.user_roles;

CREATE POLICY "Users can insert their own roles" ON public.user_roles
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);