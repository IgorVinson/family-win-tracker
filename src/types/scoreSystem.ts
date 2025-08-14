// Score and Prize System Types

export interface ScoreEntry {
  id: string;
  date: string; // YYYY-MM-DD
  activityId: string;
  activityName: string;
  points: number;
  reason: string; // e.g., "Base points", "Bonus: exceeded goal", "Streak bonus"
  createdAt: string;
}

export interface Prize {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  category: "privilege" | "treat" | "activity" | "item";
  isActive: boolean;
  createdAt: string;
  imageUrl?: string;
}

export interface PrizeRedemption {
  id: string;
  prizeId: string;
  prizeName: string;
  pointsCost: number;
  status: "pending" | "approved" | "rejected" | "completed";
  requestedAt: string;
  processedAt?: string;
  notes?: string;
}

export interface ScoringRule {
  activityId: string;
  basePointsPerUnit: number; // Points per unit of activity value
  goalBonusPoints?: number; // Extra points when meeting planValue
  streakBonusPoints?: number; // Extra points for consecutive days
  maxDailyPoints?: number; // Cap on points per day for this activity
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  pointsReward: number;
  type: "streak" | "milestone" | "consistency" | "excellence";
  requirement: string; // JSON string describing requirement
  unlockedAt?: string;
}

// Enhanced Kid type with score system
export interface EnhancedKid {
  id: string;
  name: string;
  points: number;
  totalPointsEarned: number; // Lifetime points earned
  goal: number;
  color: string;
  createdAt: string;
  notes?: string;
  metrics?: Array<{
    id: string;
    name: string;
    value: number;
    unit?: string;
    groupId?: string;
    planType?: "daily" | "weekly";
    planValue?: number;
    scoringRule?: ScoringRule;
  }>;
  groups?: Array<{
    id: string;
    name: string;
    type: "project" | "goal";
  }>;
  reports?: Array<{
    id: string;
    date: string;
    createdAt: string;
    notes?: string;
    entries: Array<{ activityId: string; value: number }>;
    status: "pending" | "approved" | "rejected";
    processedAt?: string;
    processedBy?: "parent" | "system";
  }>;
  scoreHistory: ScoreEntry[];
  availablePrizes: Prize[];
  prizeRedemptions: PrizeRedemption[];
  achievements: Achievement[];
  streaks: Record<string, number>; // activityId -> consecutive days
}