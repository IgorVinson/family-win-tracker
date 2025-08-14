import { useEffect, useState } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { EnhancedKid, Gift, GiftRedemption, ScoringRule } from "@/types/scoreSystem";
import { ScoringEngine } from "@/lib/scoringEngine";

// Convert legacy Kid to EnhancedKid
function migrateToEnhancedKid(legacyKid: any): EnhancedKid {
  return {
    ...legacyKid,
    totalPointsEarned: legacyKid.totalPointsEarned || legacyKid.points || 0,
    scoreHistory: legacyKid.scoreHistory || [],
    availableGifts: legacyKid.availableGifts || legacyKid.availablePrizes || getDefaultGifts(),
    giftRedemptions: legacyKid.giftRedemptions || legacyKid.prizeRedemptions || [],
    achievements: legacyKid.achievements || [],
    streaks: legacyKid.streaks || {},
    activities: (legacyKid.metrics || legacyKid.activities || []).map((activity: any) => ({
      ...activity,
      scoringRule: activity.scoringRule || getDefaultScoringRule(activity)
    }))
  };
}

function getDefaultGifts(): Gift[] {
  return [
    {
      id: crypto.randomUUID(),
      name: "Extra Screen Time",
      description: "30 minutes of additional screen time",
      pointsCost: 50,
      category: "privilege",
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      name: "Choose Dinner",
      description: "Pick what the family has for dinner",
      pointsCost: 75,
      category: "privilege",
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      name: "Ice Cream",
      description: "A special ice cream treat",
      pointsCost: 25,
      category: "treat",
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      name: "Movie Night",
      description: "Family movie night with your choice",
      pointsCost: 100,
      category: "activity",
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      name: "Small Toy",
      description: "A small toy from the store ($10 limit)",
      pointsCost: 200,
      category: "item",
      isActive: true,
      createdAt: new Date().toISOString()
    }
  ];
}

function getDefaultScoringRule(activity: any): ScoringRule {
  const basePoints = activity.unit === "min" ? 1 : 10; // 1 point per minute, 10 points per other unit
  return {
    activityId: activity.id,
    basePointsPerUnit: basePoints,
    goalBonusPoints: 20,
    streakBonusPoints: 10,
    maxDailyPoints: 100
  };
}

export function useEnhancedKid(kidId: string) {
  const [kids, setKids] = useLocalStorage<any[]>("family-kids", []);
  const [kid, setKid] = useState<EnhancedKid | null>(null);

  useEffect(() => {
    const foundKid = kids.find((k: any) => k.id === kidId);
    if (foundKid) {
      setKid(migrateToEnhancedKid(foundKid));
    } else {
      setKid(null);
    }
  }, [kidId, kids]);

  const updateKid = (updater: (kid: EnhancedKid) => EnhancedKid) => {
    if (!kid) return;
    
    const updatedKid = updater(kid);
    setKid(updatedKid);
    
    // Update in localStorage
    setKids(currentKids => 
      currentKids.map(k => k.id === kidId ? updatedKid : k)
    );
  };

  const addReport = (reportData: {
    date: string;
    notes?: string;
    entries: Array<{ activityId: string; value: number }>;
  }) => {
    if (!kid) return;

    const report = {
      id: crypto.randomUUID(),
      date: reportData.date,
      createdAt: new Date().toISOString(),
      notes: reportData.notes,
      entries: reportData.entries,
      status: "pending" as const,
    };

    // Don't process scoring yet - wait for parent approval
    updateKid(currentKid => ({
      ...currentKid,
      reports: [...(currentKid.reports || []), report]
    }));
  };

  const approveReport = (reportId: string) => {
    if (!kid) return;

    const report = kid.reports?.find(r => r.id === reportId);
    if (!report || report.status !== "pending") return;

    // Process scoring for approved report
    const scoreUpdates = ScoringEngine.processDailyReport(kid, report.date, report.entries);

    updateKid(currentKid => ({
      ...currentKid,
      ...scoreUpdates,
      reports: currentKid.reports?.map(r =>
        r.id === reportId
          ? { ...r, status: "approved" as const, processedAt: new Date().toISOString(), processedBy: "parent" as const }
          : r
      ) || []
    }));
  };

  const rejectReport = (reportId: string) => {
    if (!kid) return;

    updateKid(currentKid => ({
      ...currentKid,
      reports: currentKid.reports?.map(r =>
        r.id === reportId
          ? { ...r, status: "rejected" as const, processedAt: new Date().toISOString(), processedBy: "parent" as const }
          : r
      ) || []
    }));
  };

  const updateReport = (reportId: string, updates: {
    date?: string;
    notes?: string;
    entries?: Array<{ activityId: string; value: number }>;
  }) => {
    if (!kid) return;

    updateKid(currentKid => ({
      ...currentKid,
      reports: currentKid.reports?.map(r =>
        r.id === reportId
          ? { ...r, ...updates, status: r.status === "approved" ? "pending" as const : r.status }
          : r
      ) || []
    }));
  };

  const deleteReport = (reportId: string) => {
    if (!kid) return;

    updateKid(currentKid => ({
      ...currentKid,
      reports: currentKid.reports?.filter(r => r.id !== reportId) || []
    }));
  };

  const addGift = (giftData: Omit<Gift, "id" | "createdAt">) => {
    const gift: Gift = {
      ...giftData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };

    updateKid(currentKid => ({
      ...currentKid,
      availableGifts: [...currentKid.availableGifts, gift]
    }));
  };

  const updateGift = (giftId: string, updates: Partial<Gift>) => {
    updateKid(currentKid => ({
      ...currentKid,
      availableGifts: currentKid.availableGifts.map(p =>
        p.id === giftId ? { ...p, ...updates } : p
      )
    }));
  };

  const deleteGift = (giftId: string) => {
    updateKid(currentKid => ({
      ...currentKid,
      availableGifts: currentKid.availableGifts.filter(p => p.id !== giftId)
    }));
  };

  const redeemGift = (giftId: string) => {
    if (!kid) return;

    const gift = kid.availableGifts.find(p => p.id === giftId);
    if (!gift || kid.points < gift.pointsCost) return;

    const redemption: GiftRedemption = {
      id: crypto.randomUUID(),
      giftId: gift.id,
      giftName: gift.name,
      pointsCost: gift.pointsCost,
      status: "pending",
      requestedAt: new Date().toISOString()
    };

    updateKid(currentKid => ({
      ...currentKid,
      points: currentKid.points - gift.pointsCost,
      giftRedemptions: [...currentKid.giftRedemptions, redemption]
    }));
  };

  const updateRedemption = (redemptionId: string, status: GiftRedemption["status"], notes?: string) => {
    updateKid(currentKid => {
      const redemption = currentKid.giftRedemptions.find(r => r.id === redemptionId);
      const gift = currentKid.availableGifts.find(p => p.id === redemption?.giftId);
      
      // If rejecting a redemption, return the points to the kid
      const pointsToReturn = status === "rejected" && redemption?.status === "pending" && gift 
        ? gift.pointsCost 
        : 0;

      return {
        ...currentKid,
        points: currentKid.points + pointsToReturn,
        giftRedemptions: currentKid.giftRedemptions.map(r =>
          r.id === redemptionId 
            ? { ...r, status, processedAt: new Date().toISOString(), notes }
            : r
        )
      };
    });
  };

  const updateActivityScoringRule = (activityId: string, scoringRule: ScoringRule) => {
    updateKid(currentKid => ({
      ...currentKid,
      activities: currentKid.activities?.map(a =>
        a.id === activityId ? { ...a, scoringRule } : a
      )
    }));
  };

  // Legacy alias for compatibility
  const updateMetricScoringRule = updateActivityScoringRule;

  return {
    kid,
    updateKid,
    addReport,
    approveReport,
    rejectReport,
    updateReport,
    deleteReport,
    addGift,
    updateGift,
    deleteGift,
    redeemGift,
    updateRedemption,
    updateMetricScoringRule,
    updateActivityScoringRule
  };
}