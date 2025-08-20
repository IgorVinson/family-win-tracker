-- Fix claim_kid_invitation to set families.created_by (NOT NULL)
-- and safely derive parent creator id.

-- Backfill kids.created_by where possible (optional heuristic)
-- If a kid has created_by NULL but has an invitation, use invitation.created_by.
UPDATE public.kids k
SET created_by = ki.created_by
FROM public.kid_invitations ki
WHERE k.id = ki.kid_id AND k.created_by IS NULL AND ki.created_by IS NOT NULL;

-- Recreate function
CREATE OR REPLACE FUNCTION public.claim_kid_invitation(_token TEXT)
RETURNS TABLE(kid_id UUID) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  inv RECORD;
  fam_id UUID;
  parent_user UUID;
BEGIN
  IF NOT has_role(auth.uid(),'kid') THEN
    RAISE EXCEPTION 'must be kid role';
  END IF;
  SELECT * INTO inv FROM public.kid_invitations WHERE token=_token AND accepted_at IS NULL AND expires_at > now();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid or expired token';
  END IF;
  -- Determine parent / creator user
  SELECT created_by INTO parent_user FROM public.kids WHERE id = inv.kid_id;
  IF parent_user IS NULL THEN
    parent_user := inv.created_by; -- from invitation
  END IF;
  -- Attach user to kid if unclaimed
  UPDATE public.kids SET user_id = auth.uid(), created_by = COALESCE(parent_user, created_by) WHERE id = inv.kid_id AND user_id IS NULL;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'kid already claimed';
  END IF;
  UPDATE public.kid_invitations SET accepted_at = now() WHERE id = inv.id;
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
  -- Add kid user to family
  INSERT INTO public.family_members(family_id, user_id) VALUES (fam_id, auth.uid()) ON CONFLICT DO NOTHING;
  RETURN QUERY SELECT inv.kid_id;
END;$$;

GRANT EXECUTE ON FUNCTION public.claim_kid_invitation(TEXT) TO authenticated;