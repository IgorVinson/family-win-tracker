-- Phase 1: Rename kid_invitations to family_invitations and simplify structure

-- Drop existing policies from kid_invitations table
DROP POLICY IF EXISTS "Parents can manage kid invitations" ON public.kid_invitations;
DROP POLICY IF EXISTS "Users can view invitations created for them" ON public.kid_invitations;
DROP POLICY IF EXISTS "Parents manage invitations" ON public.kid_invitations;
DROP POLICY IF EXISTS "Kid can view own invitation" ON public.kid_invitations;

-- Drop the claim function temporarily
DROP FUNCTION IF EXISTS public.claim_kid_invitation(TEXT);

-- Rename table
ALTER TABLE public.kid_invitations RENAME TO family_invitations;

-- Drop any policies that might exist on the renamed table
DROP POLICY IF EXISTS "Parents manage invitations" ON public.family_invitations;
DROP POLICY IF EXISTS "Kid can view own invitation" ON public.family_invitations;

-- Remove kid-specific columns
ALTER TABLE public.family_invitations DROP COLUMN IF EXISTS kid_id;
ALTER TABLE public.family_invitations DROP COLUMN IF EXISTS planned_name;
ALTER TABLE public.family_invitations DROP COLUMN IF EXISTS planned_goal;

-- Update RLS policies for renamed table
CREATE POLICY "Parents can manage family invitations" ON public.family_invitations
  FOR ALL USING (public.has_role(auth.uid(), 'parent'));

CREATE POLICY "Users can view invitations created for them" ON public.family_invitations
  FOR SELECT USING (
    invited_email = auth.email() OR 
    public.has_role(auth.uid(), 'parent')
  );

-- Add comment for documentation
COMMENT ON TABLE public.family_invitations IS 'Universal family member invitations - users choose role during registration';