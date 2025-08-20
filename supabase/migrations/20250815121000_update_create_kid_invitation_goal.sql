-- filepath: supabase/migrations/20250815121000_update_create_kid_invitation_goal.sql
-- Extend create_kid_invitation to accept goal parameter
CREATE OR REPLACE FUNCTION public.create_kid_invitation(_name TEXT, _invited_email TEXT, _goal INTEGER DEFAULT 50)
RETURNS TABLE(token TEXT) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  new_token TEXT;
BEGIN
  IF NOT has_role(auth.uid(),'parent') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  new_token := encode(gen_random_bytes(16),'hex');
  INSERT INTO public.kid_invitations(kid_id, token, invited_email, created_by, planned_name, planned_goal)
    VALUES (NULL, new_token, _invited_email, auth.uid(), _name, COALESCE(_goal,50));
  RETURN QUERY SELECT new_token;
END;$$;
GRANT EXECUTE ON FUNCTION public.create_kid_invitation(TEXT, TEXT, INTEGER) TO authenticated;

COMMENT ON FUNCTION public.create_kid_invitation(TEXT, TEXT, INTEGER) IS 'Create an invitation without creating kid row; kid created on claim';
