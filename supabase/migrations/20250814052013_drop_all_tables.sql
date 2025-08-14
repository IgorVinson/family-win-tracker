-- Drop all existing tables and start fresh
DROP TABLE IF EXISTS public.prize_redemptions CASCADE;
DROP TABLE IF EXISTS public.prizes CASCADE;
DROP TABLE IF EXISTS public.score_entries CASCADE;
DROP TABLE IF EXISTS public.daily_reports CASCADE;
DROP TABLE IF EXISTS public.scoring_rules CASCADE;
DROP TABLE IF EXISTS public.activities CASCADE;
DROP TABLE IF EXISTS public.kids CASCADE;
DROP TABLE IF EXISTS public.family_members CASCADE;
DROP TABLE IF EXISTS public.families CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.update_updated_at_column();
DROP FUNCTION IF EXISTS public.has_role(UUID, app_role);
DROP FUNCTION IF EXISTS public.is_family_member(UUID, UUID);

-- Drop enum type
DROP TYPE IF EXISTS public.app_role;