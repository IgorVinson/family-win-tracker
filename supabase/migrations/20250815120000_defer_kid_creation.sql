-- filepath: supabase/migrations/20250815120000_defer_kid_creation.sql
-- Defer kid creation until invitation claim.
-- 1. Relax kid_invitations.kid_id constraint to allow NULL (unclaimed invites)
ALTER TABLE public.kid_invitations ALTER COLUMN kid_id DROP NOT NULL;

-- 2. Add planned fields to store initial kid data prior to claim
ALTER TABLE public.kid_invitations ADD COLUMN IF NOT EXISTS planned_name TEXT;
ALTER TABLE public.kid_invitations ADD COLUMN IF NOT EXISTS planned_goal INTEGER; -- monthly goal

-- 3. New function: create_kid_invitation (no kid row yet)
CREATE OR REPLACE FUNCTION public.create_kid_invitation(_name TEXT, _invited_email TEXT)
RETURNS TABLE(token TEXT) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  new_token TEXT;
BEGIN
  IF NOT has_role(auth.uid(),'parent') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  new_token := encode(gen_random_bytes(16),'hex');
  INSERT INTO public.kid_invitations(kid_id, token, invited_email, created_by, planned_name, planned_goal)
    VALUES (NULL, new_token, _invited_email, auth.uid(), _name, 50);
  RETURN QUERY SELECT new_token;
END;$$;
GRANT EXECUTE ON FUNCTION public.create_kid_invitation(TEXT, TEXT) TO authenticated;

-- 4. Update claim_kid_invitation to create kid row if missing
CREATE OR REPLACE FUNCTION public.claim_kid_invitation(_token TEXT)
RETURNS TABLE(kid_id UUID) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  inv RECORD;
  fam_id UUID;
  new_kid UUID;
  parent_user UUID;
BEGIN
  IF NOT has_role(auth.uid(),'kid') THEN
    RAISE EXCEPTION 'must be kid role';
  END IF;
  SELECT * INTO inv FROM public.kid_invitations WHERE token=_token AND accepted_at IS NULL AND expires_at > now();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid or expired token';
  END IF;

  -- Create kid if not yet created
  IF inv.kid_id IS NULL THEN
    INSERT INTO public.kids(name, current_points, monthly_goal, created_by)
      VALUES (COALESCE(inv.planned_name,'Kid'),0,COALESCE(inv.planned_goal,50), inv.created_by)
      RETURNING id INTO new_kid;
    UPDATE public.kid_invitations SET kid_id = new_kid WHERE id = inv.id;
  ELSE
    new_kid := inv.kid_id;
  END IF;

  -- Attach user to kid if free
  UPDATE public.kids SET user_id = auth.uid() WHERE id = new_kid AND user_id IS NULL;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'kid already claimed';
  END IF;

  UPDATE public.kid_invitations SET accepted_at = now() WHERE id = inv.id;

  -- Determine parent user (creator of kid or invitation)
  SELECT created_by INTO parent_user FROM public.kids WHERE id = new_kid;
  IF parent_user IS NULL THEN
    parent_user := inv.created_by;
  END IF;

  -- Find or create family
  IF parent_user IS NOT NULL THEN
    SELECT fm.family_id INTO fam_id FROM public.family_members fm WHERE fm.user_id = parent_user LIMIT 1;
  END IF;
  IF fam_id IS NULL THEN
    INSERT INTO public.families(name, created_by) VALUES ('Family', COALESCE(parent_user, auth.uid())) RETURNING id INTO fam_id;
    IF parent_user IS NOT NULL THEN
      INSERT INTO public.family_members(family_id, user_id) VALUES (fam_id, parent_user) ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  INSERT INTO public.family_members(family_id, user_id) VALUES (fam_id, auth.uid()) ON CONFLICT DO NOTHING;
  RETURN QUERY SELECT new_kid;
END;$$;
GRANT EXECUTE ON FUNCTION public.claim_kid_invitation(TEXT) TO authenticated;

-- 5. Additional policy to allow parents to manage invitations they created even before kid exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='kid_invitations' AND policyname='Parents manage new invitations'
  ) THEN
    CREATE POLICY "Parents manage new invitations" ON public.kid_invitations
      FOR ALL USING (has_role(auth.uid(),'parent') AND created_by = auth.uid())
      WITH CHECK (has_role(auth.uid(),'parent') AND created_by = auth.uid());
  END IF;
END $$;

-- 6. (Optional) Deprecate old create_kid_with_invite function; leave for now.
COMMENT ON FUNCTION public.create_kid_with_invite(TEXT, TEXT) IS 'Deprecated: use create_kid_invitation instead (deferred kid creation)';
