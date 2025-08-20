-- Add / fix daily_reports kid INSERT capability with WITH CHECK.
-- If the original policy exists we ALTER it; otherwise we CREATE it.
-- Also (re)create parent policies if missing.
DO $$
BEGIN
  -- Kids policy: allow full manage (SELECT, INSERT, UPDATE, DELETE) on own kid's reports.
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='daily_reports' AND policyname='Kids can manage their own reports'
  ) THEN
    EXECUTE '
      ALTER POLICY "Kids can manage their own reports" ON public.daily_reports
        USING (
          EXISTS (SELECT 1 FROM public.kids WHERE id = kid_id AND user_id = auth.uid())
        )
        WITH CHECK (
          EXISTS (SELECT 1 FROM public.kids WHERE id = kid_id AND user_id = auth.uid())
        );
    ';
  ELSE
    CREATE POLICY "Kids can manage their own reports" ON public.daily_reports
      FOR ALL
      USING (
        EXISTS (SELECT 1 FROM public.kids WHERE id = kid_id AND user_id = auth.uid())
      )
      WITH CHECK (
        EXISTS (SELECT 1 FROM public.kids WHERE id = kid_id AND user_id = auth.uid())
      );
  END IF;

  -- Parent SELECT policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='daily_reports' AND policyname='Parents can view family reports'
  ) THEN
    CREATE POLICY "Parents can view family reports" ON public.daily_reports
      FOR SELECT
      USING (
        public.has_role(auth.uid(), 'parent') AND
        public.is_family_member(auth.uid(), kid_id)
      );
  END IF;

  -- Parent UPDATE (approve) policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='daily_reports' AND policyname='Parents can approve family reports'
  ) THEN
    CREATE POLICY "Parents can approve family reports" ON public.daily_reports
      FOR UPDATE
      USING (
        public.has_role(auth.uid(), 'parent') AND
        public.is_family_member(auth.uid(), kid_id)
      );
  END IF;
END $$;
