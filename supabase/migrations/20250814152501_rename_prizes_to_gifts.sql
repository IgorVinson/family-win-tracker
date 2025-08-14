-- Rename tables from prizes to gifts
ALTER TABLE prizes RENAME TO gifts;
ALTER TABLE prize_redemptions RENAME TO gift_redemptions;

-- Rename the prize_id column to gift_id in gift_redemptions
ALTER TABLE gift_redemptions RENAME COLUMN prize_id TO gift_id;

-- Update the foreign key constraint name to match new naming
ALTER TABLE gift_redemptions DROP CONSTRAINT prize_redemptions_prize_id_fkey;
ALTER TABLE gift_redemptions ADD CONSTRAINT gift_redemptions_gift_id_fkey 
  FOREIGN KEY (gift_id) REFERENCES gifts(id);