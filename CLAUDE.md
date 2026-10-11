# CLAUDE.md

This file describes the legacy Vite + Supabase app. KidsRise work follows `AGENTS.md` and `docs/plan`. Do not extend this legacy app, and do not delete it until a plan phase says to remove it.

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Family Win Tracker is a React-based gamified family management system where kids earn points for completing activities and can redeem prizes. The application supports both local storage (demo mode) and Supabase (authenticated mode) for data persistence.

## Development Commands

- `npm run dev` - Start development server with Vite
- `npm run build` - Production build  
- `npm run build:dev` - Development build
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Architecture

### Core Technologies
- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL database, auth, real-time)
- **State Management**: React Query + local state
- **Routing**: React Router DOM

### Database Schema (Supabase)
Key tables:
- `kids` - Child profiles with points and streaks
- `daily_reports` - Daily activity submissions 
- `score_entries` - Individual point earning records
- `prizes` - Available rewards
- `prize_redemptions` - Prize purchase history
- `scoring_rules` - Point calculation rules per activity
- `families` - Family groupings
- `profiles` - User profiles linked to Supabase auth

### Data Flow Architecture

The app operates in two modes:

**Demo Mode (Unauthenticated)**:
- Data stored in localStorage via `useLocalStorage` hook
- Mock data seeded via `src/lib/seed.ts`
- Direct state management

**Authenticated Mode**: 
- Data migration from localStorage to Supabase on first login
- Real-time data sync via Supabase
- Multi-user family support

### Key Components Structure

**Pages** (`src/pages/`):
- `IndexWrapper.tsx` - Auth-aware routing wrapper
- `Index.tsx` - Main dashboard 
- `KidDashboard.tsx` - Individual kid view
- `Auth.tsx` - Authentication forms

**Core Business Logic** (`src/lib/`):
- `scoringEngine.ts` - Point calculation, streak tracking, achievements
- `dataMigration.ts` - localStorage ↔ Supabase migration
- `scoringUtils.ts` - Utility functions for score calculations

**Hooks** (`src/hooks/`):
- `useAuth.ts` - Authentication state management
- `useEnhancedKid.ts` - Kid data with scoring logic (localStorage)
- `useEnhancedKidDB.ts` - Kid data with Supabase integration

**Components by Domain**:
- `components/auth/` - Authentication components
- `components/kid/` - Kid management (reports, activities, modals)
- `components/prize/` - Prize shop and management
- `components/score/` - Scoring dashboard
- `components/ui/` - shadcn/ui component library

### Scoring System

The scoring engine (`src/lib/scoringEngine.ts`) handles:
- Base points per activity unit
- Goal bonus points for meeting targets
- Streak bonuses for consecutive days
- Daily point caps per activity
- Achievement unlocking (streaks, milestones)

### Authentication & Roles

Two user roles via Supabase:
- `parent` - Full management access
- `kid` - Limited view/interaction

Auth flow managed by `useAuth` hook with automatic migration on first login.