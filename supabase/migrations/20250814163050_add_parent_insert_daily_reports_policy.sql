-- Allow parents to INSERT (create) daily_reports for kids in their family.
-- Existing policies:
--  - Kids can manage their own reports (FOR ALL) -> covers kid-owned inserts.
--  - Parents can view family reports (SELECT)
--  - Parents can approve family reports (UPDATE)
-- Missing: parent INSERT. This adds it.
CREATE POLICY "Parents can create family reports" ON public.daily_reports
  FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'parent') AND
    public.is_family_member(auth.uid(), kid_id)
  );
