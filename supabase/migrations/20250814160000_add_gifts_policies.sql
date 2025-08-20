-- Add proper RLS policies for gifts (renamed from prizes) so parents can insert/update/delete

-- Replace old view policy (name referenced prizes) with gifts wording
DROP POLICY IF EXISTS "Authenticated users can view prizes" ON public.gifts;
CREATE POLICY "Authenticated users can view gifts" ON public.gifts
  FOR SELECT TO authenticated USING (true);

-- Allow parents full management (insert/update/delete/select) of gifts
DROP POLICY IF EXISTS "Parents can manage gifts" ON public.gifts; -- idempotent if re-run
CREATE POLICY "Parents can manage gifts" ON public.gifts
  FOR ALL USING (public.has_role(auth.uid(), 'parent'))
  WITH CHECK (public.has_role(auth.uid(), 'parent'));

-- (Optional) If you later want kids to view gifts without auth role check, keep the above select policy only.

-- Note: No kid insert/update/delete policy; only parents manage catalog.
