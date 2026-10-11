# KidsRise

## Goal

KidsRise is a mobile app for one household. Kids mark chores done by submitting a photo. A parent approves or rejects that submission in one tap. Approved chores award points. Kids spend points in a reward store.

The app runs on separate devices for each parent and each kid. Data is shared through Firebase, not through a shared login.

## Phase 1

Phase 1 is one family:

- 4 kids
- 2 parents
- each person on their own device
- chores verified with an AI reading of the submitted photo
- one-tap parent approval or rejection
- a points balance per kid
- a reward store the kid can redeem from, with a parent able to see the redemption

Phase 1 does not include a second family, public signup for kids, or removal of the legacy Vite app.

## Product rules that bind phase 1

- A kid cannot create an email/password account.
- A parent creates the family and the kid profiles.
- Only a parent approves a chore or adjusts points outside the normal award path.
- The photo check runs in Cloud Functions. The vision provider key never ships in the app.
- Firestore and Storage access is limited to that family's members.

## What is already in the repo

The existing Vite, React, and Supabase tree is Family Win Tracker. It stays until a later phase removes it. KidsRise code does not start in this setup phase.
