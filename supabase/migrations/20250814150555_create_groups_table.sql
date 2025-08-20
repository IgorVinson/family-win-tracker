-- Migration: Create groups table
-- This migration creates a groups table to store activity groups for kids

-- Create groups table
CREATE TABLE IF NOT EXISTS groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  kid_id UUID NOT NULL REFERENCES kids(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('project', 'goal')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries by kid_id
CREATE INDEX IF NOT EXISTS idx_groups_kid_id ON groups(kid_id);

-- Create trigger to update updated_at on changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_groups_updated_at 
    BEFORE UPDATE ON groups 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- Policy for parents to manage all groups
CREATE POLICY "Parents can manage all groups" ON groups
  FOR ALL USING (has_role(auth.uid(), 'parent'));

-- Policy for kids to read their own groups
CREATE POLICY "Kids can read own groups" ON groups
  FOR SELECT USING (
    has_role(auth.uid(), 'kid') AND 
    kid_id IN (
      SELECT id FROM kids WHERE user_id = auth.uid()
    )
  );

-- Add comment for documentation
COMMENT ON TABLE groups IS 'Activity groups for organizing kid activities into projects or goals';