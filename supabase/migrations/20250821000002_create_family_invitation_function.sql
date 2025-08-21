-- Create function to generate family invitations

CREATE OR REPLACE FUNCTION public.create_family_invitation(
  _invited_email TEXT DEFAULT NULL
)
RETURNS TABLE(token TEXT) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  new_token TEXT;
BEGIN
  -- Must be parent to create invitations
  IF NOT has_role(auth.uid(), 'parent') THEN
    RAISE EXCEPTION 'must be parent role to create invitations';
  END IF;
  
  -- Generate random token
  new_token := encode(gen_random_bytes(16), 'hex');
  
  -- Insert invitation
  INSERT INTO public.family_invitations (token, invited_email, created_by)
  VALUES (new_token, _invited_email, auth.uid());
  
  -- Return token
  RETURN QUERY SELECT new_token;
END;$$;

GRANT EXECUTE ON FUNCTION public.create_family_invitation(TEXT) TO authenticated;