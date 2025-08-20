# Kid Onboarding Streamlining Plan

## Current Issues
- Kid clicks invitation link but has to manually navigate to auth
- Role selection is open (should be locked to "kid" for invitations)
- Multi-step process with manual navigation between pages
- No clear indication that email confirmation is required
- No automatic redirection after signup

## Proposed Solution

### 1. Enhanced Accept Invitation Page (`/accept-invite?token=xxx`)
- **Detect if user is not authenticated** ’ show embedded signup form directly on this page
- **Pre-fill role as "kid"** and make it read-only (no selection dropdown)
- **Show clear messaging** about email confirmation requirement
- **Auto-redirect** to kid dashboard after successful signup + email confirmation

### 2. Signup Flow Modifications
- **Add invitation context** to Auth.tsx to handle invitation-specific signup
- **Store invitation token** during signup process
- **Auto-claim invitation** after email confirmation and login
- **Show progress indicators** (signup ’ email confirmation ’ access granted)

### 3. User Experience Improvements
- **Single page experience** - no manual navigation needed
- **Clear messaging** about next steps after signup
- **Automatic progression** through the flow
- **Error handling** for invalid/expired tokens

## Implementation Steps

1. **Modify AcceptInvite.tsx** to include embedded signup form when user is not authenticated
2. **Update Auth.tsx** to accept invitation context and handle invitation-specific signup
3. **Enhance token validation** and automatic claiming after authentication
4. **Add URL parameter handling** for seamless invitation context passing
5. **Improve messaging and UX** throughout the flow
6. **Test the complete end-to-end flow**

## Expected Result
Kid clicks invitation link ’ sees signup form with pre-filled kid role ’ signs up ’ confirms email ’ automatically enters system as that kid profile.

Single streamlined flow with clear progress indicators and no manual navigation required.