import { EnhancedKid, ScoreEntry, ScoringRule, Achievement } from "@/types/scoreSystem";
import { format, subDays, parseISO } from "date-fns";

export class ScoringEngine {
  
  // Calculate points for a daily report
  static calculateDailyPoints(
    kid: EnhancedKid, 
    reportDate: string, 
    entries: Array<{ activityId: string; value: number }>
  ): ScoreEntry[] {
    const scoreEntries: ScoreEntry[] = [];
    const now = new Date().toISOString();

    entries.forEach(entry => {
      const activity = kid.activities?.find(a => a.id === entry.activityId);
      if (!activity || !activity.scoringRule) return;

      const rule = activity.scoringRule;
      let totalPoints = 0;
      const reasons: string[] = [];

      // Base points calculation
      const basePoints = Math.floor(entry.value * rule.basePointsPerUnit);
      totalPoints += basePoints;
      if (basePoints > 0) {
        reasons.push(`Base: ${entry.value} ${activity.unit || 'units'} × ${rule.basePointsPerUnit} pts`);
      }

      // Goal bonus
      if (rule.goalBonusPoints && activity.planValue && entry.value >= activity.planValue) {
        totalPoints += rule.goalBonusPoints;
        reasons.push(`Goal bonus: +${rule.goalBonusPoints} pts`);
      }

      // Streak bonus
      const streakDays = kid.streaks[entry.activityId] || 0;
      if (rule.streakBonusPoints && streakDays >= 2) {
        const streakBonus = Math.min(rule.streakBonusPoints * Math.floor(streakDays / 2), rule.streakBonusPoints * 5);
        totalPoints += streakBonus;
        reasons.push(`${streakDays}-day streak: +${streakBonus} pts`);
      }

      // Apply daily cap
      if (rule.maxDailyPoints) {
        totalPoints = Math.min(totalPoints, rule.maxDailyPoints);
      }

      if (totalPoints > 0) {
        scoreEntries.push({
          id: crypto.randomUUID(),
          date: reportDate,
          activityId: entry.activityId,
          activityName: activity.name,
          points: totalPoints,
          reason: reasons.join(", "),
          createdAt: now
        });
      }
    });

    return scoreEntries;
  }

  // Update streaks based on daily report
  static updateStreaks(
    kid: EnhancedKid, 
    reportDate: string, 
    entries: Array<{ activityId: string; value: number }>
  ): Record<string, number> {
    const newStreaks = { ...kid.streaks };
    const yesterday = format(subDays(parseISO(reportDate + "T00:00:00"), 1), "yyyy-MM-dd");
    
    // Check each activity in the report
    entries.forEach(entry => {
      const activity = kid.activities?.find(a => a.id === entry.activityId);
      if (!activity || !activity.planValue) return;

      const metGoal = entry.value >= activity.planValue;
      
      if (metGoal) {
        // Check if they had a streak yesterday
        const hadYesterdayStreak = this.checkStreakOnDate(kid, entry.activityId, yesterday);
        newStreaks[entry.activityId] = hadYesterdayStreak ? (newStreaks[entry.activityId] || 0) + 1 : 1;
      } else {
        // Reset streak if goal not met
        newStreaks[entry.activityId] = 0;
      }
    });

    return newStreaks;
  }

  // Check if an activity goal was met on a specific date
  private static checkStreakOnDate(kid: EnhancedKid, activityId: string, date: string): boolean {
    const report = kid.reports?.find(r => r.date === date);
    if (!report) return false;

    const entry = report.entries.find(e => e.activityId === activityId);
    if (!entry) return false;

    const activity = kid.activities?.find(a => a.id === activityId);
    if (!activity || !activity.planValue) return false;

    return entry.value >= activity.planValue;
  }

  // Check for new achievements
  static checkAchievements(kid: EnhancedKid): Achievement[] {
    const newAchievements: Achievement[] = [];
    const unlockedIds = new Set(kid.achievements.map(a => a.id));

    // Streak achievements
    Object.entries(kid.streaks).forEach(([activityId, streakDays]) => {
      const activity = kid.activities?.find(a => a.id === activityId);
      if (!activity) return;

      const streakAchievements = [
        { days: 7, name: "Week Warrior", description: `7 days in a row of ${activity.name}!`, points: 50 },
        { days: 14, name: "Two Week Champion", description: `14 days in a row of ${activity.name}!`, points: 100 },
        { days: 30, name: "Monthly Master", description: `30 days in a row of ${activity.name}!`, points: 200 }
      ];

      streakAchievements.forEach(achievement => {
        const achievementId = `streak_${activityId}_${achievement.days}`;
        if (streakDays >= achievement.days && !unlockedIds.has(achievementId)) {
          newAchievements.push({
            id: achievementId,
            name: achievement.name,
            description: achievement.description,
            icon: "trophy",
            pointsReward: achievement.points,
            type: "streak",
            requirement: JSON.stringify({ activityId, streakDays: achievement.days }),
            unlockedAt: new Date().toISOString()
          });
        }
      });
    });

    // Point milestones
    const pointMilestones = [100, 250, 500, 1000, 2500, 5000];
    pointMilestones.forEach(milestone => {
      const achievementId = `points_${milestone}`;
      if (kid.totalPointsEarned >= milestone && !unlockedIds.has(achievementId)) {
        newAchievements.push({
          id: achievementId,
          name: `${milestone} Point Club`,
          description: `Earned ${milestone} total points!`,
          icon: "star",
          pointsReward: Math.floor(milestone * 0.1),
          type: "milestone",
          requirement: JSON.stringify({ totalPoints: milestone }),
          unlockedAt: new Date().toISOString()
        });
      }
    });

    return newAchievements;
  }

  // Process a daily report and update all scoring data
  static processDailyReport(
    kid: EnhancedKid, 
    reportDate: string, 
    entries: Array<{ activityId: string; value: number }>
  ): Partial<EnhancedKid> {
    // Calculate new points
    const newScoreEntries = this.calculateDailyPoints(kid, reportDate, entries);
    const pointsEarned = newScoreEntries.reduce((sum, entry) => sum + entry.points, 0);

    // Update streaks
    const newStreaks = this.updateStreaks(kid, reportDate, entries);

    // Check for achievements
    const newAchievements = this.checkAchievements({ 
      ...kid, 
      streaks: newStreaks,
      totalPointsEarned: kid.totalPointsEarned + pointsEarned 
    });

    // Add achievement points
    const achievementPoints = newAchievements.reduce((sum, achievement) => sum + achievement.pointsReward, 0);

    return {
      points: kid.points + pointsEarned + achievementPoints,
      totalPointsEarned: kid.totalPointsEarned + pointsEarned + achievementPoints,
      scoreHistory: [...kid.scoreHistory, ...newScoreEntries],
      streaks: newStreaks,
      achievements: [...kid.achievements, ...newAchievements]
    };
  }
}