-- Migration: Enhance activities table to support both general and kid-specific activities
-- This migration adds columns to store kid-specific activity data and updates scoring_rules

-- 1. Enhance activities table
ALTER TABLE activities 
ADD COLUMN kid_id UUID REFERENCES kids(id) ON DELETE CASCADE,
ADD COLUMN group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
ADD COLUMN unit TEXT,
ADD COLUMN plan_type TEXT CHECK (plan_type IN ('daily', 'weekly')),
ADD COLUMN plan_value INTEGER,
ADD COLUMN current_value INTEGER DEFAULT 0,
ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add trigger for updated_at
CREATE TRIGGER update_activities_updated_at 
    BEFORE UPDATE ON activities 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_activities_kid_id ON activities(kid_id);
CREATE INDEX IF NOT EXISTS idx_activities_group_id ON activities(group_id);
CREATE INDEX IF NOT EXISTS idx_activities_category ON activities(category);

-- 2. Update scoring_rules table structure
-- Add new activity_id column
ALTER TABLE scoring_rules ADD COLUMN activity_id UUID;

-- Create temporary function to migrate data
CREATE OR REPLACE FUNCTION migrate_scoring_rules_activities() 
RETURNS void AS $$
DECLARE
    rule_record RECORD;
    found_activity_id UUID;
BEGIN
    FOR rule_record IN 
        SELECT id, kid_id, activity FROM scoring_rules WHERE activity_id IS NULL
    LOOP
        -- Try to find existing activity for this kid with this name
        SELECT id INTO found_activity_id 
        FROM activities 
        WHERE name = rule_record.activity 
        AND kid_id = rule_record.kid_id;
        
        -- If not found, create a new activity for this kid
        IF found_activity_id IS NULL THEN
            INSERT INTO activities (name, kid_id, category)
            VALUES (rule_record.activity, rule_record.kid_id, 'custom')
            RETURNING id INTO found_activity_id;
        END IF;
        
        -- Update the scoring rule with the activity_id
        UPDATE scoring_rules 
        SET activity_id = found_activity_id 
        WHERE id = rule_record.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Run the migration
SELECT migrate_scoring_rules_activities();

-- Drop the temporary function
DROP FUNCTION migrate_scoring_rules_activities();

-- Make activity_id required and add foreign key
ALTER TABLE scoring_rules 
ALTER COLUMN activity_id SET NOT NULL,
ADD CONSTRAINT fk_scoring_rules_activity_id 
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE;

-- Create index on the new foreign key
CREATE INDEX IF NOT EXISTS idx_scoring_rules_activity_id ON scoring_rules(activity_id);

-- Drop the old activity column
ALTER TABLE scoring_rules DROP COLUMN activity;

-- Add RLS policies for activities
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Policy for parents to manage all activities
CREATE POLICY "Parents can manage all activities" ON activities
  FOR ALL USING (has_role(auth.uid(), 'parent'));

-- Policy for kids to read their own activities and general activities
CREATE POLICY "Kids can read own and general activities" ON activities
  FOR SELECT USING (
    has_role(auth.uid(), 'kid') AND 
    (kid_id IS NULL OR kid_id IN (
      SELECT id FROM kids WHERE user_id = auth.uid()
    ))
  );

-- Add comments for documentation
COMMENT ON TABLE activities IS 'Activities for kids - supports both general activities (kid_id=NULL) and kid-specific activities';
COMMENT ON COLUMN activities.kid_id IS 'NULL for general activities, specific kid_id for kid-specific activities';
COMMENT ON COLUMN activities.group_id IS 'Optional grouping for organizing activities';
COMMENT ON COLUMN activities.unit IS 'Unit of measurement (e.g., minutes, pages, times)';
COMMENT ON COLUMN activities.plan_type IS 'Daily or weekly planning type';
COMMENT ON COLUMN activities.plan_value IS 'Target value for the plan';
COMMENT ON COLUMN activities.current_value IS 'Current progress value';