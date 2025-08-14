import { ScoringRule } from "@/types/scoreSystem";

export interface ScoringDisplay {
  basePoints: string;
  goalBonus: string;
  streakBonus: string;
  maxDaily: string;
  summary: string;
}

/**
 * Get default scoring rule for an activity
 */
export function getDefaultScoringRule(activity: any): ScoringRule {
  return {
    activityId: activity.id,
    basePointsPerUnit: 1,
    goalBonusPoints: 5,
    streakBonusPoints: 2,
    maxDailyPoints: 50
  };
}

/**
 * Format scoring rule for display
 */
export function formatScoringRule(scoringRule: ScoringRule, unit?: string): ScoringDisplay {
  const unitDisplay = unit ? ` per ${unit}` : '';
  
  return {
    basePoints: `${scoringRule.basePointsPerUnit}${unitDisplay}`,
    goalBonus: `+${scoringRule.goalBonusPoints} goal bonus`,
    streakBonus: `+${scoringRule.streakBonusPoints} streak bonus`,
    maxDaily: `${scoringRule.maxDailyPoints} daily max`,
    summary: `${scoringRule.basePointsPerUnit}${unitDisplay} (${scoringRule.goalBonusPoints} goal + ${scoringRule.streakBonusPoints} streak)`
  };
}

/**
 * Calculate points for a given value and scoring rule
 */
export function calculatePoints(
  value: number, 
  scoringRule: ScoringRule, 
  hasGoalBonus: boolean = false, 
  hasStreakBonus: boolean = false
): number {
  const basePoints = Math.floor(value * scoringRule.basePointsPerUnit);
  const goalBonus = hasGoalBonus ? scoringRule.goalBonusPoints : 0;
  const streakBonus = hasStreakBonus ? scoringRule.streakBonusPoints : 0;
  
  const total = basePoints + goalBonus + streakBonus;
  return Math.min(total, scoringRule.maxDailyPoints);
}

/**
 * Calculate potential points preview for daily report
 */
export function calculatePointsPreview(
  value: number,
  scoringRule: ScoringRule,
  planValue?: number
): { points: number; breakdown: string[] } {
  if (value <= 0) return { points: 0, breakdown: [] };
  
  const basePoints = Math.floor(value * scoringRule.basePointsPerUnit);
  const meetsGoal = planValue ? value >= planValue : false;
  const goalBonus = meetsGoal ? scoringRule.goalBonusPoints : 0;
  
  const breakdown: string[] = [];
  breakdown.push(`${basePoints} base points`);
  
  if (meetsGoal) {
    breakdown.push(`+${goalBonus} goal bonus`);
  }
  
  breakdown.push(`+${scoringRule.streakBonusPoints} possible streak bonus`);
  
  const totalBeforeCap = basePoints + goalBonus + scoringRule.streakBonusPoints;
  const finalPoints = Math.min(basePoints + goalBonus, scoringRule.maxDailyPoints);
  
  if (totalBeforeCap > scoringRule.maxDailyPoints) {
    breakdown.push(`(capped at ${scoringRule.maxDailyPoints})`);
  }
  
  return { points: finalPoints, breakdown };
}