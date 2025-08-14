# Simple Rename Plan: "Prize" to "Gift" Terminology

## Overview
Just rename all existing "prize" terminology to "gift" without creating any new functionality or per-kid logic. Keep all existing behavior exactly the same.

## Phase 1: Database Schema Rename
1. **Rename tables**:
   - `prizes` ’ `gifts`
   - `prize_redemptions` ’ `gift_redemptions`
2. **Rename columns**:
   - `prize_redemptions.prize_id` ’ `gift_redemptions.gift_id`
   - Update foreign key constraints accordingly
3. **Update Supabase types** to reflect new table/column names

## Phase 2: Code Entity Rename  
1. **TypeScript interfaces** (`src/types/scoreSystem.ts`):
   - `Prize` ’ `Gift`
   - `PrizeRedemption` ’ `GiftRedemption`
   - Update all property references (e.g., `prizeId` ’ `giftId`)

## Phase 3: Component Structure Rename
1. **Rename directories**:
   - `src/components/prize/` ’ `src/components/gift/`
2. **Rename files**:
   - `PrizeShop.tsx` ’ `GiftShop.tsx`
   - `PrizeManagement.tsx` ’ `GiftManagement.tsx`

## Phase 4: Code References Update
1. **Update all imports and exports** in affected files:
   - Hook files that reference prizes (6 files found)
   - Component files
   - Type imports
2. **Update function/variable names**:
   - `onRedeemPrize` ’ `onRedeemGift`
   - `availablePrizes` ’ `availableGifts`
   - `prizeRedemptions` ’ `giftRedemptions`

## Phase 5: UI Text Updates
1. **Update all user-facing text**:
   - "Prize Shop" ’ "Gift Shop"
   - "Redeem Prize" ’ "Redeem Gift" 
   - "Prize requested!" ’ "Gift requested!"
   - All other UI labels and messages

## Result
-  Complete terminology change from "prize" to "gift"
-  Zero functional changes - all logic stays identical
-  Same global gift system (no per-kid changes yet)
-  Clean foundation for future per-kid gift features