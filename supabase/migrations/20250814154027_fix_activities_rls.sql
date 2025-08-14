-- Fix RLS policies for activities table to allow proper access

-- Drop existing policies
DROP POLICY IF EXISTS "Parents can manage all activities" ON activities;
DROP POLICY IF EXISTS "Kids can read own and general activities" ON activities;

-- Create more permissive policies for now
CREATE POLICY "Authenticated users can manage activities" ON activities
  FOR ALL USING (auth.role() = 'authenticated');

-- Add comment
COMMENT ON POLICY "Authenticated users can manage activities" ON activities IS 'Temporary permissive policy - should be refined based on user roles';