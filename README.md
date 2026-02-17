# Family Win Tracker

Family gamification app — track kids' goals, achievements, and rewards with a scoring system.

<!-- Add screenshot here -->

## Overview

Family Win Tracker is a gamification platform designed for families to encourage positive behavior, track goals, and reward achievements. Parents can set up custom objectives for their children, who earn points for completing tasks and reaching milestones. The app includes a reward system where kids can redeem points for agreed-upon prizes, making chores and responsibilities fun and engaging.

## Key Features

- **Kid Dashboard**: Child-friendly interface for tracking personal goals and points
- **Goal Management**: Create, assign, and track progress on custom objectives
- **Point System**: Flexible scoring — assign point values to different achievements
- **Reward Store**: Kids can browse and redeem points for rewards
- **Invite System**: Secure family joining via invite codes
- **Parent Controls**: Full oversight and management of all family activities
- **Real-Time Sync**: Instant updates across all family devices via Supabase
- **Progress Tracking**: Visual indicators show goal completion progress
- **Achievement History**: Complete log of wins and redemptions

## Tech Stack

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-000000?style=for-the-badge)
![TanStack Query](https://img.shields.io/badge/TanStack%20Query-FF4154?style=for-the-badge)

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase project ([Create one free](https://supabase.com/))

### Installation

```bash
# Clone the repository
git clone https://github.com/IgorVinson/family-win-tracker.git
cd family-win-tracker

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Run the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Environment Variables

Create a `.env` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Project Structure

```
family-win-tracker/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── auth/          # Authentication components
│   │   ├── gift/          # Reward/gift components
│   │   ├── kid/           # Kid-specific components
│   │   ├── layout/        # Layout components
│   │   ├── score/         # Scoring components
│   │   └── ui/            # shadcn/ui components
│   ├── contexts/          # React contexts
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility functions
│   ├── pages/             # Application pages
│   │   ├── KidDashboard.tsx
│   │   ├── AcceptInvite.tsx
│   │   └── Auth.tsx
│   ├── services/          # API services
│   └── types/             # TypeScript interfaces
├── public/                # Static assets
└── package.json
```

## How It Works

### For Parents

1. **Create Account**: Sign up and create a family group
2. **Add Kids**: Generate invite codes for each child
3. **Set Goals**: Create objectives with point values
4. **Add Rewards**: Define prizes kids can redeem
5. **Track Progress**: Monitor achievements and approve redemptions

### For Kids

1. **Join Family**: Enter the invite code from parent
2. **View Dashboard**: See current goals and point balance
3. **Complete Tasks**: Mark goals as done to earn points
4. **Redeem Rewards**: Spend points on approved prizes

## Database Schema

### Tables

- **families**: Family groups
- **profiles**: User profiles (parents and kids)
- **goals**: Achievable objectives
- **rewards**: Redeemable prizes
- **completed_goals**: History of achieved objectives
- **redemptions**: Reward redemption history

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build for development
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Features in Detail

### Invite System

Parents generate unique invite codes that kids use to join the family:

```typescript
// Generate invite code
const { data, error } = await supabase
  .from('families')
  .update({ invite_code: generateCode() })
  .eq('id', familyId);
```

### Real-Time Updates

TanStack Query provides instant synchronization:

```typescript
const { data: goals } = useQuery({
  queryKey: ['goals', familyId],
  queryFn: () => fetchGoals(familyId),
});
```

### Responsive Design

Built with Tailwind CSS and shadcn/ui for a polished, accessible interface:
- Mobile-first design for kid-friendly tablet/phone use
- Parent dashboard optimized for desktop management

## Deployment

### Netlify

```bash
npm run build
netlify deploy --prod --dir=dist
```

### Vercel

```bash
npm i -g vercel
vercel --prod
```

## License

MIT
