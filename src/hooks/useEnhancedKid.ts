import { useEffect, useState } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { EnhancedKid, Prize, PrizeRedemption, ScoringRule } from "@/types/scoreSystem";
import { ScoringEngine } from "@/lib/scoringEngine";

// Convert legacy Kid to EnhancedKid
function migrateToEnhancedKid(legacyKid: any): EnhancedKid {
  return {
    ...legacyKid,
    totalPointsEarned: legacyKid.totalPointsEarned || legacyKid.points || 0,
    scoreHistory: legacyKid.scoreHistory || [],
    availablePrizes: legacyKid.availablePrizes || getDefaultPrizes(),
    prizeRedemptions: legacyKid.prizeRedemptions || [],
    achievements: legacyKid.achievements || [],
    streaks: legacyKid.streaks || {},
    metrics: (legacyKid.metrics || []).map((metric: any) => ({
      ...metric,
      scoringRule: metric.scoringRule || getDefaultScoringRule(metric)
    }))
  };
}

function getDefaultPrizes(): Prize[] {
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

function getDefaultScoringRule(metric: any): ScoringRule {
  const basePoints = metric.unit === "min" ? 1 : 10; // 1 point per minute, 10 points per other unit
  return {
    metricId: metric.id,
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
    entries: Array<{ metricId: string; value: number }>;
  }) => {
    if (!kid) return;

    const report = {
      id: crypto.randomUUID(),
      date: reportData.date,
      createdAt: new Date().toISOString(),
      notes: reportData.notes,
      entries: reportData.entries
    };

    // Process scoring
    const scoreUpdates = ScoringEngine.processDailyReport(kid, reportData.date, reportData.entries);

    updateKid(currentKid => ({
      ...currentKid,
      ...scoreUpdates,
      reports: [...(currentKid.reports || []), report]
    }));
  };

  const addPrize = (prizeData: Omit<Prize, "id" | "createdAt">) => {
    const prize: Prize = {
      ...prizeData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };

    updateKid(currentKid => ({
      ...currentKid,
      availablePrizes: [...currentKid.availablePrizes, prize]
    }));
  };

  const updatePrize = (prizeId: string, updates: Partial<Prize>) => {
    updateKid(currentKid => ({
      ...currentKid,
      availablePrizes: currentKid.availablePrizes.map(p =>
        p.id === prizeId ? { ...p, ...updates } : p
      )
    }));
  };

  const deletePrize = (prizeId: string) => {
    updateKid(currentKid => ({
      ...currentKid,
      availablePrizes: currentKid.availablePrizes.filter(p => p.id !== prizeId)
    }));
  };

  const redeemPrize = (prizeId: string) => {
    if (!kid) return;

    const prize = kid.availablePrizes.find(p => p.id === prizeId);
    if (!prize || kid.points < prize.pointsCost) return;

    const redemption: PrizeRedemption = {
      id: crypto.randomUUID(),
      prizeId: prize.id,
      prizeName: prize.name,
      pointsCost: prize.pointsCost,
      status: "pending",
      requestedAt: new Date().toISOString()
    };

    updateKid(currentKid => ({
      ...currentKid,
      points: currentKid.points - prize.pointsCost,
      prizeRedemptions: [...currentKid.prizeRedemptions, redemption]
    }));
  };

  const updateRedemption = (redemptionId: string, status: PrizeRedemption["status"], notes?: string) => {
    updateKid(currentKid => {
      const redemption = currentKid.prizeRedemptions.find(r => r.id === redemptionId);
      const prize = currentKid.availablePrizes.find(p => p.id === redemption?.prizeId);
      
      // If rejecting a redemption, return the points to the kid
      const pointsToReturn = status === "rejected" && redemption?.status === "pending" && prize 
        ? prize.pointsCost 
        : 0;

      return {
        ...currentKid,
        points: currentKid.points + pointsToReturn,
        prizeRedemptions: currentKid.prizeRedemptions.map(r =>
          r.id === redemptionId 
            ? { ...r, status, processedAt: new Date().toISOString(), notes }
            : r
        )
      };
    });
  };

  const updateMetricScoringRule = (metricId: string, scoringRule: ScoringRule) => {
    updateKid(currentKid => ({
      ...currentKid,
      metrics: currentKid.metrics?.map(m =>
        m.id === metricId ? { ...m, scoringRule } : m
      )
    }));
  };

  return {
    kid,
    updateKid,
    addReport,
    addPrize,
    updatePrize,
    deletePrize,
    redeemPrize,
    updateRedemption,
    updateMetricScoringRule
  };
}