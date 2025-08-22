-- Phase 2: Create universal family invitation claim function

CREATE OR REPLACE FUNCTION public.claim_family_invitation(_token TEXT)
RETURNS TABLE(success BOOLEAN) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  inv RECORD;
  fam_id UUID;
  parent_user UUID;
BEGIN
  -- Get invitation
  SELECT * INTO inv FROM public.family_invitations WHERE token=_token AND accepted_at IS NULL AND expires_at > now();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid or expired token';
  END IF;
  
  -- Get parent/creator user
  parent_user := inv.created_by;
  
  -- Mark invitation as accepted
  UPDATE public.family_invitations SET accepted_at = now() WHERE id = inv.id;
  
  -- Find existing family linking parent
  IF parent_user IS NOT NULL THEN
    SELECT fm.family_id INTO fam_id FROM public.family_members fm
      WHERE fm.user_id = parent_user LIMIT 1;
  END IF;
  
  -- Create family if none
  IF fam_id IS NULL THEN
    INSERT INTO public.families(name, created_by) VALUES ('Family', COALESCE(parent_user, auth.uid())) RETURNING id INTO fam_id;
    -- Ensure parent member added
    IF parent_user IS NOT NULL THEN
      INSERT INTO public.family_members(family_id, user_id) VALUES (fam_id, parent_user) ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  
  -- Add current user to family
  INSERT INTO public.family_members(family_id, user_id) VALUES (fam_id, auth.uid()) ON CONFLICT DO NOTHING;
  
  -- If user has kid role, create kid record
  IF has_role(auth.uid(), 'kid') THEN
    INSERT INTO public.kids(user_id, name, created_by) 
    SELECT auth.uid(), p.display_name, parent_user
    FROM public.profiles p 
    WHERE p.id = auth.uid()
    ON CONFLICT(user_id) DO NOTHING;
  END IF;
  
  RETURN QUERY SELECT TRUE;
END;$$;

GRANT EXECUTE ON FUNCTION public.claim_family_invitation(TEXT) TO authenticated;