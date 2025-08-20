-- Allow parents to DELETE daily_reports for kids in their family.
-- Existing policies cover: kids (ALL), parents (SELECT, INSERT, UPDATE). Missing: parent DELETE.
-- This migration is idempotent (will not recreate if already exists).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='daily_reports' AND policyname='Parents can delete family reports'
  ) THEN
    CREATE POLICY "Parents can delete family reports" ON public.daily_reports
      FOR DELETE
      USING (
        public.has_role(auth.uid(), 'parent') AND
        public.is_family_member(auth.uid(), kid_id)
      );
  END IF;
END $$;
