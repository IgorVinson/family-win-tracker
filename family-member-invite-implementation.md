# Family Member Invite System Implementation Plan

## Overview
Transform the current kid-specific invitation system into a universal family member invite system where users choose their role during registration.

## 1. Database Changes ✅ COMPLETED
- **Rename `kid_invitations` → `family_invitations`** ✅
- **Simplify table structure**: ✅
  - Remove: `planned_name`, `planned_goal`, `kid_id` ✅
  - Keep: `id`, `family_id`, `token`, `invited_email`, `expires_at`, `accepted_at`, `created_by` ✅
- **Update RLS policies** for the renamed table ✅

**Migration Applied:** `20250821000000_rename_kid_invitations_to_family_invitations.sql`

## 2. Backend Functions ✅ COMPLETED
- **Rename `claim_kid_invitation()` → `claim_family_invitation()`** ✅
- **Update logic**: Remove kid-specific processing, just add user to family ✅
- **Keep invite generation**: Support both email and token-only options ✅
- **Update helper functions** and references ✅

**Migration Applied:** `20250821000001_create_claim_family_invitation.sql`

## 3. Frontend Updates
- **Rename components**: Kid invite → Family invite
- **Simplify invite form**: Just email field (optional) + generate token
- **Update invite acceptance**: Let user choose role during registration
- **Family management**: Show "Invite Family Member" instead of "Add Kid"

## 4. Registration Flow
- **Keep role selection checkbox** in signup
- **No pre-filled data** from invitation
- **User decides**: Parent or Kid role during registration
- **Invite links user** to family after signup completion

## 5. Migration Strategy
- **Rename existing table** and update all references
- **Update existing functions** to work with new generic approach
- **Maintain backward compatibility** for existing kid invitations

## 6. Update Remote Database
- **Apply migration** to rename table and update functions
- **Update RLS policies** on production database
- **Test invite flows** with existing data
- **Verify backward compatibility** with current invitations

## 7. Deploy
- **Deploy frontend changes** with updated components
- **Update environment variables** if needed
- **Test full invite flow** in production
- **Monitor for any issues** with existing family workflows
- **Update documentation** for new invite system

## Benefits
- **Unified system**: One invite type for all family members
- **User choice**: Members decide their own role during signup
- **Flexibility**: Support both email and token-based invites
- **Cleaner code**: Remove role-specific logic from invitations
- **Future-proof**: Easy to extend for additional family roles