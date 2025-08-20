-- Real kid accounts migration
-- 1. Add created_by to kids
ALTER TABLE public.kids ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id);
UPDATE public.kids SET created_by = COALESCE(created_by, auth.uid()) WHERE created_by IS NULL; -- will be null in migration context (auth.uid() null) so leave; manual backfill later via script

-- 2. Invitation table
CREATE TABLE IF NOT EXISTS public.kid_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id UUID NOT NULL REFERENCES public.kids(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  invited_email TEXT,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id)
);
ALTER TABLE public.kid_invitations ENABLE ROW LEVEL SECURITY;

-- 3. Improve is_family_member to include creator relationship
CREATE OR REPLACE FUNCTION public.is_family_member(_user_id UUID, _kid_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER AS $$
  -- A user is family member if: shares a family, or is creator of kid, or is the kid's own user
  SELECT EXISTS (
    -- existing family link
    SELECT 1 FROM public.family_members fm1
    JOIN public.family_members fm2 ON fm1.family_id = fm2.family_id
    JOIN public.kids k2 ON k2.user_id = fm2.user_id
    WHERE fm1.user_id = _user_id AND k2.id = _kid_id
  )
  OR EXISTS (
    SELECT 1 FROM public.kids k WHERE k.id = _kid_id AND k.created_by = _user_id
  )
  OR EXISTS (
    SELECT 1 FROM public.kids k WHERE k.id = _kid_id AND k.user_id = _user_id
  );
$$;

-- 4. Policies for kid_invitations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='kid_invitations' AND policyname='Parents manage invitations'
  ) THEN
    CREATE POLICY "Parents manage invitations" ON public.kid_invitations
      FOR ALL USING (
        has_role(auth.uid(),'parent') AND EXISTS (
          SELECT 1 FROM public.kids k WHERE k.id = kid_invitations.kid_id AND k.created_by = auth.uid()
        )
      ) WITH CHECK (
        has_role(auth.uid(),'parent') AND EXISTS (
          SELECT 1 FROM public.kids k WHERE k.id = kid_invitations.kid_id AND k.created_by = auth.uid()
        )
      );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='kid_invitations' AND policyname='Kid can view own invitation'
  ) THEN
    CREATE POLICY "Kid can view own invitation" ON public.kid_invitations
      FOR SELECT USING (
        has_role(auth.uid(),'kid') AND EXISTS (
          SELECT 1 FROM public.kids k WHERE k.id = kid_invitations.kid_id AND k.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- 5. Function to create kid + invitation
CREATE OR REPLACE FUNCTION public.create_kid_with_invite(_name TEXT, _invited_email TEXT)
RETURNS TABLE(kid_id UUID, token TEXT) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  new_kid UUID;
  new_token TEXT;
BEGIN
  -- parent only
  IF NOT has_role(auth.uid(),'parent') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  INSERT INTO public.kids(name, current_points, monthly_goal, created_by)
    VALUES (_name,0,50, auth.uid()) RETURNING id INTO new_kid;
  new_token := encode(gen_random_bytes(16),'hex');
  INSERT INTO public.kid_invitations(kid_id, token, invited_email, created_by)
    VALUES (new_kid, new_token, _invited_email, auth.uid());
  RETURN QUERY SELECT new_kid, new_token;
END;$$;

-- 6. Function to claim invitation
CREATE OR REPLACE FUNCTION public.claim_kid_invitation(_token TEXT)
RETURNS TABLE(kid_id UUID) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  inv RECORD;
  fam_id UUID;
BEGIN
  IF NOT has_role(auth.uid(),'kid') THEN
    RAISE EXCEPTION 'must be kid role';
  END IF;
  SELECT * INTO inv FROM public.kid_invitations WHERE token=_token AND accepted_at IS NULL AND expires_at > now();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid or expired token';
  END IF;
  -- attach user to kid if free
  UPDATE public.kids SET user_id = auth.uid() WHERE id = inv.kid_id AND user_id IS NULL;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'kid already claimed';
  END IF;
  UPDATE public.kid_invitations SET accepted_at = now() WHERE id = inv.id;
  -- ensure a family exists linking parent creator and kid
  SELECT fm.family_id INTO fam_id FROM public.family_members fm
    JOIN public.kids k ON k.created_by = fm.user_id
    WHERE k.id = inv.kid_id LIMIT 1;
  IF fam_id IS NULL THEN
    INSERT INTO public.families(name) VALUES ('Family') RETURNING id INTO fam_id;
    -- add parent creator
    INSERT INTO public.family_members(family_id,user_id)
      SELECT fam_id, created_by FROM public.kids WHERE id = inv.kid_id ON CONFLICT DO NOTHING;
  END IF;
  -- add kid user
  INSERT INTO public.family_members(family_id,user_id) VALUES (fam_id, auth.uid()) ON CONFLICT DO NOTHING;
  RETURN QUERY SELECT inv.kid_id;
END;$$;

-- 7. Policies for new functions (allow rpc execution to authenticated users)
GRANT EXECUTE ON FUNCTION public.create_kid_with_invite(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_kid_invitation(TEXT) TO authenticated;
