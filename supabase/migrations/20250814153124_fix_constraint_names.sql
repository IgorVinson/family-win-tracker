-- Fix remaining constraint names from prize to gift
ALTER TABLE gift_redemptions DROP CONSTRAINT prize_redemptions_kid_id_fkey;
ALTER TABLE gift_redemptions DROP CONSTRAINT prize_redemptions_processed_by_fkey;

ALTER TABLE gift_redemptions ADD CONSTRAINT gift_redemptions_kid_id_fkey 
  FOREIGN KEY (kid_id) REFERENCES kids(id);
ALTER TABLE gift_redemptions ADD CONSTRAINT gift_redemptions_processed_by_fkey 
  FOREIGN KEY (processed_by) REFERENCES profiles(id);