-- Add RLS policies for gift_redemptions (renamed from prize_redemptions)
-- Kids can create and view their own redemption requests
-- Parents can view and process redemptions for kids in their family

-- Ensure RLS enabled (safe if already enabled)
ALTER TABLE public.gift_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_redemptions FORCE ROW LEVEL SECURITY;

-- Drop any legacy policies that still reference old semantics (defensive)
DROP POLICY IF EXISTS "Kids can manage their own redemptions" ON public.gift_redemptions;
DROP POLICY IF EXISTS "Parents can view family redemptions" ON public.gift_redemptions;
DROP POLICY IF EXISTS "Parents can process family redemptions" ON public.gift_redemptions;

-- Kids: allow select/insert on own rows
CREATE POLICY "Kids can select own gift redemptions" ON public.gift_redemptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.kids k
      WHERE k.id = kid_id AND k.user_id = auth.uid()
    )
  );

CREATE POLICY "Kids can insert gift redemptions" ON public.gift_redemptions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.kids k
      WHERE k.id = kid_id AND k.user_id = auth.uid()
    )
  );

-- (Optional) If kids should be able to cancel/update pending requests themselves, add UPDATE policy constrained to pending status.
CREATE POLICY "Kids can update own pending gift redemptions" ON public.gift_redemptions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.kids k
      WHERE k.id = kid_id AND k.user_id = auth.uid()
    ) AND status = 'pending'
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.kids k
      WHERE k.id = kid_id AND k.user_id = auth.uid()
    ) AND status = 'pending'
  );

-- Parents (role) can view family redemptions
CREATE POLICY "Parents can view family gift redemptions" ON public.gift_redemptions
  FOR SELECT USING (
    public.has_role(auth.uid(), 'parent') AND public.is_family_member(auth.uid(), kid_id)
  );

-- Parents can process (update) family redemptions
CREATE POLICY "Parents can process family gift redemptions" ON public.gift_redemptions
  FOR UPDATE USING (
    public.has_role(auth.uid(), 'parent') AND public.is_family_member(auth.uid(), kid_id)
  ) WITH CHECK (
    public.has_role(auth.uid(), 'parent') AND public.is_family_member(auth.uid(), kid_id)
  );

-- If parents need to insert on behalf of kid (e.g., manual redemption entry), add:
CREATE POLICY "Parents can insert family gift redemptions" ON public.gift_redemptions
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'parent') AND public.is_family_member(auth.uid(), kid_id)
  );
