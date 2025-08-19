import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  EnhancedKid,
  Gift,
  GiftRedemption,
  ScoringRule,
} from "@/types/scoreSystem";
import { useEffect, useState } from "react";

// Convert database kid to EnhancedKid format
function convertToEnhancedKid(
  dbKid: {
    id: string;
    name: string;
    current_points: number;
    monthly_goal: number;
    created_at: string;
  },
  activities: Array<{
    id: string;
    name: string;
    current_value: number;
    unit: string | null;
    group_id: string | null;
    plan_type: "daily" | "weekly" | null | string;
    plan_value: number | null;
  }>,
  scoringRules: Array<{
    activity_id: string;
    points: number;
    bonus: number;
    streak: number;
    max_daily: number | null;
  }>,
  reports: Array<{
    id: string;
    date: string;
    created_at: string;
    notes: string | null;
    activities: unknown;
    status: string;
    updated_at: string;
  }>,
  scoreEntries: Array<{
    id: string;
    date: string;
    activity: string;
    points: number;
    reason: string | null;
    approved: boolean;
    created_at: string;
  }>,
  gifts: Array<{
    id: string;
    name: string;
    description: string | null;
    cost: number;
    category: string | null;
    active: boolean;
    created_at: string;
  }>,
  redemptions: Array<{
    id: string;
    gift_id: string;
    status: string;
    created_at: string;
    date_processed: string | null;
    notes: string | null;
    gifts?: { name: string; cost: number };
  }>,
  groups: Array<{ id: string; name: string; type: string }> = []
): EnhancedKid {
  // Convert database activities to enhanced format
  const enhancedActivities = activities.map(activity => {
    // Find scoring rule for this activity
    const scoringRule = scoringRules.find(
      rule => rule.activity_id === activity.id
    );

    return {
      id: activity.id,
      name: activity.name,
      value: activity.current_value || 0,
      unit: activity.unit || undefined,
      groupId: activity.group_id || undefined,
      planType: (activity.plan_type as "daily" | "weekly") || undefined,
      planValue: activity.plan_value || undefined,
      scoringRule: scoringRule
        ? {
            activityId: activity.id,
            basePointsPerUnit: scoringRule.points,
            goalBonusPoints: scoringRule.bonus,
            streakBonusPoints: scoringRule.streak,
            maxDailyPoints: scoringRule.max_daily || 100,
          }
        : undefined,
    };
  });

  // Convert reports
  const enhancedReports = reports.map(report => ({
    id: report.id,
    date: report.date,
    createdAt: report.created_at,
    notes: report.notes || undefined,
    entries: Object.entries(
      (report.activities || {}) as Record<string, number>
    ).map(([activity, value]) => ({
      activityId: activity,
      value: value as number,
    })),
    status: report.status as "pending" | "approved" | "rejected",
    processedAt: report.updated_at,
    processedBy: "parent" as const,
  }));

  // Convert score entries
  const enhancedScoreHistory = scoreEntries.map(entry => ({
    id: entry.id,
    date: entry.date,
    activityId: entry.activity,
    activityName: entry.activity,
    points: entry.points,
    reason: entry.reason,
    approved: entry.approved,
    createdAt: entry.created_at,
  }));

  // Convert gifts
  const enhancedGifts: Gift[] = (gifts || []).map(gift => ({
    id: gift.id,
    name: gift.name,
    description: gift.description || "",
    pointsCost: gift.cost,
    category: (gift.category as Gift["category"]) || "activity",
    isActive: gift.active,
    createdAt: gift.created_at,
  }));

  // Convert redemptions
  const enhancedRedemptions: GiftRedemption[] = (redemptions || []).map(
    redemption => ({
      id: redemption.id,
      giftId: redemption.gift_id,
      giftName: redemption.gifts?.name || "Unknown Gift",
      pointsCost: redemption.gifts?.cost || 0,
      status: redemption.status as
        | "pending"
        | "approved"
        | "rejected"
        | "completed",
      requestedAt: redemption.created_at,
      processedAt: redemption.date_processed,
      notes: redemption.notes,
    })
  );

  // Convert groups
  const enhancedGroups = (groups || []).map(group => ({
    id: group.id,
    name: group.name,
    type: group.type as "project" | "goal",
  }));

  return {
    id: dbKid.id,
    name: dbKid.name,
    points: dbKid.current_points,
    goal: dbKid.monthly_goal,
    color: "262 83% 58%", // Default color
    createdAt: dbKid.created_at,
    totalPointsEarned: enhancedScoreHistory.reduce(
      (sum, entry) => sum + entry.points,
      0
    ),
    activities: enhancedActivities,
    groups: enhancedGroups,
    reports: enhancedReports,
    scoreHistory: enhancedScoreHistory,
    availableGifts: enhancedGifts,
    giftRedemptions: enhancedRedemptions,
    achievements: [], // Placeholder for achievements
    streaks: {}, // Placeholder for streaks
  };
}

export function useEnhancedKidDB(kidId: string) {
  const [kid, setKid] = useState<EnhancedKid | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, userRole, loading: authLoading } = useAuth();

  const loadKidData = async () => {
    try {
      setLoading(true);

      // First, get the kid data
      const { data: kidData, error: kidError } = await supabase
        .from("kids")
        .select("*")
        .eq("id", kidId)
        .single();

      if (kidError) {
        console.error("Error loading kid:", kidError);
        setKid(null);
        return;
      }

      // Access control (frontend safeguard – RLS already enforces this on backend)
      // Parents: allowed to access any kid they have RLS rights to (family membership / creator)
      // Kids: only their own profile
      const canAccess =
        userRole === "parent" || // allow all parents; rely on RLS for actual authorization
        (userRole === "kid" && kidData.user_id === user?.id);

      if (!canAccess) {
        console.error("User doesn't have access to this kid");
        setKid(null);
        return;
      }

      // Load related data in parallel
      const [
        { data: activities = [] },
        { data: scoringRules = [] },
        { data: reports = [] },
        { data: scoreEntries = [] },
        { data: prizes = [] },
        { data: redemptions = [] },
        { data: groups = [] },
      ] = await Promise.all([
        supabase
          .from("activities")
          .select("*")
          .eq("kid_id", kidId)
          .order("name", { ascending: true }),
        supabase.from("scoring_rules").select("*").eq("kid_id", kidId),
        supabase
          .from("daily_reports")
          .select("*")
          .eq("kid_id", kidId)
          .order("date", { ascending: false }),
        supabase
          .from("score_entries")
          .select("*")
          .eq("kid_id", kidId)
          .order("date", { ascending: false }),
        supabase
          .from("gifts")
          .select("*")
          .eq("active", true)
          .order("cost", { ascending: true }),
        supabase
          .from("gift_redemptions")
          .select("*, gifts(name, cost)")
          .eq("kid_id", kidId)
          .order("created_at", { ascending: false }),
        supabase
          .from("groups")
          .select("*")
          .eq("kid_id", kidId)
          .order("name", { ascending: true }),
      ]);

      const enhancedKid = convertToEnhancedKid(
        kidData,
        activities,
        scoringRules,
        reports,
        scoreEntries,
        prizes,
        redemptions,
        groups
      );
      setKid(enhancedKid);
    } catch (error) {
      console.error("Error loading kid data:", error);
      setKid(null);
    } finally {
      setLoading(false);
    }
  };

  // Load kid data from database
  useEffect(() => {
    if (!user || !kidId) {
      setKid(null);
      setLoading(false);
      return;
    }

    // Don't load data until userRole is available (not null)
    if (userRole === null) {
      // Keep loading true while waiting for userRole
      setLoading(true);
      return;
    }

    loadKidData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, kidId, userRole, authLoading]);

  const updateKid = async (updater: (kid: EnhancedKid) => EnhancedKid) => {
    if (!kid || !user) return;

    const updatedKid = updater(kid);
    setKid(updatedKid);

    // Update in database
    try {
      const { error } = await supabase
        .from("kids")
        .update({
          current_points: updatedKid.points,
          monthly_goal: updatedKid.goal,
          updated_at: new Date().toISOString(),
        })
        .eq("id", kidId);

      if (error) {
        console.error("Error updating kid:", error);
        // Revert the optimistic update
        setKid(kid);
        toast({
          variant: "destructive",
          title: "Update failed",
          description: "Could not update kid data. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error updating kid:", error);
      setKid(kid);
    }
  };

  const addReport = async (reportData: {
    date: string;
    notes?: string;
    entries: Array<{ activityId: string; value: number }>;
  }) => {
    if (!kid || !user) return;

    const computePoints = (
      value: number,
      activity?: { planValue?: number; scoringRule?: ScoringRule }
    ) => {
      if (!activity?.scoringRule) return 0;
      const sr = activity.scoringRule;
      const base = Math.floor(value * sr.basePointsPerUnit);
      const meetsGoal = activity.planValue ? value >= activity.planValue : false;
      const goalBonus = meetsGoal ? sr.goalBonusPoints || 0 : 0;
      const subtotal = base + goalBonus;
      return Math.min(subtotal, sr.maxDailyPoints || subtotal);
    };

    try {
      const activities: Record<string, number> = {};
      let totalPoints = 0;

      for (const entry of reportData.entries) {
        activities[entry.activityId] = entry.value;
        const activity = kid.activities?.find(a => a.id === entry.activityId);
        totalPoints += computePoints(entry.value, activity);
      }

      const { error } = await supabase
        .from("daily_reports")
        .insert({
          kid_id: kidId,
          date: reportData.date,
          activities,
          total_points: totalPoints,
          status: "pending",
          notes: reportData.notes,
        });

      if (error) throw error;

      await loadKidData();

      toast({
        title: "Report added",
        description: "Your daily report has been submitted for approval.",
      });
    } catch (error) {
      console.error("Error adding report:", error);
      toast({
        variant: "destructive",
        title: "Failed to add report",
        description: "Could not submit your report. Please try again.",
      });
    }
  };

  const approveReport = async (reportId: string) => {
    if (!kid || !user || userRole !== "parent") return;

    const computePoints = (
      value: number,
      activity?: { planValue?: number; scoringRule?: ScoringRule }
    ) => {
      if (!activity?.scoringRule) return 0;
      const sr = activity.scoringRule;
      const base = Math.floor(value * sr.basePointsPerUnit);
      const meetsGoal = activity.planValue ? value >= activity.planValue : false;
      const goalBonus = meetsGoal ? sr.goalBonusPoints || 0 : 0;
      const subtotal = base + goalBonus;
      return Math.min(subtotal, sr.maxDailyPoints || subtotal);
    };

    try {
      const { error } = await supabase
        .from("daily_reports")
        .update({
          status: "approved",
          updated_at: new Date().toISOString(),
        })
        .eq("id", reportId);

      if (error) throw error;

      const report = kid.reports?.find(r => r.id === reportId);
      if (report) {
        for (const entry of report.entries) {
          const activity = kid.activities?.find(a => a.id === entry.activityId);
          const points = computePoints(entry.value, activity);
          await supabase.from("score_entries").insert({
            kid_id: kidId,
            date: report.date,
            activity: entry.activityId,
            points,
            reason: "Daily report approved",
            approved: true,
            approved_by: user.id,
          });
        }

        const totalReportPoints = report.entries.reduce((sum, entry) => {
          const activity = kid.activities?.find(a => a.id === entry.activityId);
            return sum + computePoints(entry.value, activity);
        }, 0);

        await supabase
          .from("kids")
          .update({
            current_points: kid.points + totalReportPoints,
            updated_at: new Date().toISOString(),
          })
          .eq("id", kidId);
      }

      await loadKidData();

      toast({
        title: "Report approved",
        description: "The daily report has been approved and points awarded.",
      });
    } catch (error) {
      console.error("Error approving report:", error);
      toast({
        variant: "destructive",
        title: "Failed to approve report",
        description: "Could not approve the report. Please try again.",
      });
    }
  };

  const rejectReport = async (reportId: string) => {
    if (!kid || !user || userRole !== "parent") return;

    try {
      const { error } = await supabase
        .from("daily_reports")
        .update({
          status: "rejected",
          updated_at: new Date().toISOString(),
        })
        .eq("id", reportId);

      if (error) throw error;

      await loadKidData();

      toast({
        title: "Report rejected",
        description: "The daily report has been rejected.",
      });
    } catch (error) {
      console.error("Error rejecting report:", error);
      toast({
        variant: "destructive",
        title: "Failed to reject report",
        description: "Could not reject the report. Please try again.",
      });
    }
  };

  const updateReport = async (
    reportId: string,
    updates: { date?: string; notes?: string; entries?: Array<{ activityId: string; value: number }>; }
  ) => {
    if (!kid || !user) return;

    const computePoints = (
      value: number,
      activity?: { planValue?: number; scoringRule?: ScoringRule }
    ) => {
      if (!activity?.scoringRule) return 0;
      const sr = activity.scoringRule;
      const base = Math.floor(value * sr.basePointsPerUnit);
      const meetsGoal = activity.planValue ? value >= activity.planValue : false;
      const goalBonus = meetsGoal ? sr.goalBonusPoints || 0 : 0;
      const subtotal = base + goalBonus;
      return Math.min(subtotal, sr.maxDailyPoints || subtotal);
    };

    try {
      const updateData: Record<string, unknown> = {};
      if (updates.date) updateData.date = updates.date;
      if (updates.notes !== undefined) updateData.notes = updates.notes;

      if (updates.entries) {
        const activities: Record<string, number> = {};
        let totalPoints = 0;
        for (const entry of updates.entries) {
          activities[entry.activityId] = entry.value;
          const activity = kid.activities?.find(a => a.id === entry.activityId);
          totalPoints += computePoints(entry.value, activity);
        }
        updateData.activities = activities;
        updateData.total_points = totalPoints;
        updateData.status = "pending";
      }

      const { error } = await supabase
        .from("daily_reports")
        .update(updateData)
        .eq("id", reportId);

      if (error) throw error;

      await loadKidData();

      toast({
        title: "Report updated",
        description: "The daily report has been updated.",
      });
    } catch (error) {
      console.error("Error updating report:", error);
      toast({
        variant: "destructive",
        title: "Failed to update report",
        description: "Could not update the report. Please try again.",
      });
    }
  };

  const deleteReport = async (reportId: string) => {
    if (!kid || !user) return;

    try {
      const { error } = await supabase
        .from("daily_reports")
        .delete()
        .eq("id", reportId);

      if (error) throw error;

      await loadKidData();

      toast({
        title: "Report deleted",
        description: "The daily report has been deleted.",
      });
    } catch (error) {
      console.error("Error deleting report:", error);
      toast({
        variant: "destructive",
        title: "Failed to delete report",
        description: "Could not delete the report. Please try again.",
      });
    }
  };

  const addGift = async (giftData: Omit<Gift, "id" | "createdAt">) => {
    if (!user || userRole !== "parent") return;

    try {
      // Insert and return new row
      const { data: inserted, error } = await supabase
        .from("gifts")
        .insert({
          name: giftData.name,
          description: giftData.description,
          cost: giftData.pointsCost,
          category: giftData.category,
          active: giftData.isActive,
        })
        .select("*")
        .single();

      if (error) throw error;

      // Optimistically add to local state (no full reload)
      if (inserted) {
        const newGift: Gift = {
          id: inserted.id,
          name: inserted.name,
          description: inserted.description || "",
          pointsCost: inserted.cost,
          category: (inserted.category as Gift["category"]) || "treat",
          isActive: inserted.active,
          createdAt: inserted.created_at,
        };
        setKid(prev =>
          prev
            ? { ...prev, availableGifts: [...prev.availableGifts, newGift] }
            : prev
        );
      }

      toast({
        title: "Gift added",
        description: `${giftData.name} has been added to the gift shop.`,
      });
    } catch (error) {
      console.error("Error adding gift:", error);
      toast({
        variant: "destructive",
        title: "Failed to add gift",
        description: "Could not add the gift. Please try again.",
      });
    }
  };

  const updateGift = async (giftId: string, updates: Partial<Gift>) => {
    if (!user || userRole !== "parent" || !kid) return;

    // Prepare optimistic state
    const prevKid = kid;
    const optimisticGifts = kid.availableGifts.map(g =>
      g.id === giftId ? { ...g, ...updates } : g
    );
    setKid({ ...kid, availableGifts: optimisticGifts });

    try {
      const updateData: Record<string, unknown> = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined)
        updateData.description = updates.description;
      if (updates.pointsCost !== undefined)
        updateData.cost = updates.pointsCost;
      if (updates.category !== undefined)
        updateData.category = updates.category;
      if (updates.isActive !== undefined) updateData.active = updates.isActive;

      const { error } = await supabase
        .from("gifts")
        .update(updateData)
        .eq("id", giftId);

      if (error) throw error;

      toast({
        title: "Gift updated",
        description: "The gift has been updated.",
      });
    } catch (error) {
      console.error("Error updating gift:", error);
      // Rollback
      setKid(prevKid);
      toast({
        variant: "destructive",
        title: "Failed to update gift",
        description: "Could not update the gift. Please try again.",
      });
    }
  };

  const deleteGift = async (giftId: string) => {
    if (!user || userRole !== "parent" || !kid) return;

    const prevKid = kid;
    // Optimistically mark inactive
    setKid({
      ...kid,
      availableGifts: kid.availableGifts.map(g =>
        g.id === giftId ? { ...g, isActive: false } : g
      ),
    });

    try {
      const { error } = await supabase
        .from("gifts")
        .update({ active: false })
        .eq("id", giftId);

      if (error) throw error;

      toast({
        title: "Gift removed",
        description: "The gift has been removed from the shop.",
      });
    } catch (error) {
      console.error("Error removing gift:", error);
      // Rollback
      setKid(prevKid);
      toast({
        variant: "destructive",
        title: "Failed to remove gift",
        description: "Could not remove the gift. Please try again.",
      });
    }
  };

  const redeemGift = async (giftId: string) => {
    if (!kid || !user) return;

    const gift = kid.availableGifts.find(g => g.id === giftId);
    if (!gift || kid.points < gift.pointsCost) return;

    try {
      // Create redemption request
      const { error: redemptionError } = await supabase
        .from("gift_redemptions")
        .insert({
          kid_id: kidId,
          gift_id: giftId,
          status: "pending",
        });

      if (redemptionError) throw redemptionError;

      // Deduct points
      const { error: pointsError } = await supabase
        .from("kids")
        .update({
          current_points: kid.points - gift.pointsCost,
          updated_at: new Date().toISOString(),
        })
        .eq("id", kidId);

      if (pointsError) throw pointsError;

      await loadKidData();

      toast({
        title: "Gift redeemed!",
        description: `You've redeemed ${gift.name} for ${gift.pointsCost} points.`,
      });
    } catch (error) {
      console.error("Error redeeming gift:", error);
      toast({
        variant: "destructive",
        title: "Failed to redeem gift",
        description: "Could not redeem the gift. Please try again.",
      });
    }
  };

  const updateRedemption = async (
    redemptionId: string,
    status: GiftRedemption["status"],
    notes?: string
  ) => {
    if (!user || userRole !== "parent") return;

    try {
      const { error } = await supabase
        .from("gift_redemptions")
        .update({
          status,
          date_processed: new Date().toISOString(),
          notes,
          processed_by: user.id,
        })
        .eq("id", redemptionId);

      if (error) throw error;

      // If rejecting, return points to kid
      if (status === "rejected") {
        const redemption = kid?.giftRedemptions.find(
          r => r.id === redemptionId
        );
        if (redemption && kid) {
          await supabase
            .from("kids")
            .update({
              current_points: kid.points + redemption.pointsCost,
              updated_at: new Date().toISOString(),
            })
            .eq("id", kidId);
        }
      }

      await loadKidData();

      toast({
        title: `Redemption ${status}`,
        description: `The gift redemption has been ${status}.`,
      });
    } catch (error) {
      console.error("Error updating redemption:", error);
      toast({
        variant: "destructive",
        title: "Failed to update redemption",
        description: "Could not update the redemption. Please try again.",
      });
    }
  };

  const updateActivityScoringRule = async (
    activityId: string,
    scoringRule: ScoringRule
  ) => {
    if (!user) return;

    try {
      const { error } = await supabase.from("scoring_rules").upsert(
        {
          kid_id: kidId,
          activity_id: activityId,
          points: scoringRule.basePointsPerUnit,
          bonus: scoringRule.goalBonusPoints,
          streak: scoringRule.streakBonusPoints,
          max_daily: scoringRule.maxDailyPoints,
        },
        {
          onConflict: "kid_id,activity_id",
        }
      );

      if (error) throw error;

      // Optimistic local merge
      setKid(prev =>
        prev
          ? {
              ...prev,
              activities: prev.activities?.map(a =>
                a.id === activityId
                  ? {
                      ...a,
                      scoringRule: {
                        activityId: activityId,
                        basePointsPerUnit: scoringRule.basePointsPerUnit,
                        goalBonusPoints: scoringRule.goalBonusPoints,
                        streakBonusPoints: scoringRule.streakBonusPoints,
                        maxDailyPoints: scoringRule.maxDailyPoints,
                      },
                    }
                  : a
              ),
            }
          : prev
      );

      toast({
        title: "Scoring rule updated",
        description: "The activity scoring rule has been updated.",
      });
    } catch (error) {
      console.error("Error updating scoring rule:", error);
      toast({
        variant: "destructive",
        title: "Failed to update scoring rule",
        description: "Could not update the scoring rule. Please try again.",
      });
    }
  };

  const addGroup = async (groupData: {
    name: string;
    type: "project" | "goal";
  }) => {
    if (!user || !kid) return;

    try {
      const { data, error } = await supabase
        .from("groups")
        .insert({
          kid_id: kidId,
          name: groupData.name,
          type: groupData.type,
        })
        .select()
        .single();

      if (error) throw error;

      // Optimistically add to local state
      if (data) {
        const newGroup = {
          id: data.id,
          name: data.name,
          type: data.type as "project" | "goal",
        };
        setKid(prev =>
          prev ? { ...prev, groups: [...prev.groups, newGroup] } : prev
        );
      }

      toast({
        title: "Group added",
        description: `${groupData.name} group has been added.`,
      });
    } catch (error) {
      console.error("Error adding group:", error);
      toast({
        variant: "destructive",
        title: "Failed to add group",
        description: "Could not add the group. Please try again.",
      });
    }
  };

  const removeGroup = async (groupId: string) => {
    if (!user || !kid) return;

    try {
      const { error } = await supabase
        .from("groups")
        .delete()
        .eq("id", groupId);

      if (error) throw error;

      // Optimistically remove from local state
      setKid(prev =>
        prev
          ? {
              ...prev,
              groups: prev.groups.filter(g => g.id !== groupId),
              activities: prev.activities?.map(a =>
                a.groupId === groupId ? { ...a, groupId: undefined } : a
              ),
            }
          : prev
      );

      toast({
        title: "Group removed",
        description: "The group has been removed.",
      });
    } catch (error) {
      console.error("Error removing group:", error);
      toast({
        variant: "destructive",
        title: "Failed to remove group",
        description: "Could not remove the group. Please try again.",
      });
    }
  };

  const addActivity = async (
    activityData: {
      name: string;
      unit?: string;
      groupId?: string;
      planType?: "daily" | "weekly";
      planValue?: number;
    },
    scoringRule: ScoringRule
  ) => {
    if (!user || !kid) return;

    try {
      // Insert activity and scoring rule in a single transaction-like flow
      const { data: activityResult, error: activityError } = await supabase
        .from("activities")
        .insert({
          kid_id: kidId,
          name: activityData.name,
          unit: activityData.unit,
          group_id: activityData.groupId || null,
          plan_type: activityData.planType,
          plan_value: activityData.planValue,
          current_value: 0,
          category: "custom",
        })
        .select()
        .single();

      if (activityError) throw activityError;

      const { error: scoringError } = await supabase
        .from("scoring_rules")
        .insert({
          kid_id: kidId,
          activity_id: activityResult.id,
          points: scoringRule.basePointsPerUnit,
          bonus: scoringRule.goalBonusPoints,
          streak: scoringRule.streakBonusPoints,
          max_daily: scoringRule.maxDailyPoints,
        });

      if (scoringError) throw scoringError;

      // Optimistically merge into local state instead of full reload
      setKid(prev =>
        prev
          ? {
              ...prev,
              activities: [
                ...(prev.activities || []),
                {
                  id: activityResult.id,
                  name: activityResult.name,
                  value: 0,
                  unit: activityResult.unit || undefined,
                  groupId: activityResult.group_id || undefined,
                  planType: activityResult.plan_type || undefined,
                  planValue: activityResult.plan_value || undefined,
                  scoringRule: {
                    activityId: activityResult.id,
                    basePointsPerUnit: scoringRule.basePointsPerUnit,
                    goalBonusPoints: scoringRule.goalBonusPoints,
                    streakBonusPoints: scoringRule.streakBonusPoints,
                    maxDailyPoints: scoringRule.maxDailyPoints,
                  },
                },
              ],
            }
          : prev
      );

      toast({
        title: "Activity added",
        description: `${activityData.name} has been added.`,
      });
    } catch (error) {
      console.error("Error adding activity:", error);
      toast({
        variant: "destructive",
        title: "Failed to add activity",
        description: "Could not add the activity. Please try again.",
      });
    }
  };

  const updateActivity = async (
    activityId: string,
    updates: {
      name?: string;
      unit?: string;
      groupId?: string;
      planType?: "daily" | "weekly";
      planValue?: number;
      scoringRule?: ScoringRule;
    }
  ) => {
    if (!user || !kid) return;

    try {
      const updateData: { [k: string]: unknown } = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.unit !== undefined) updateData.unit = updates.unit;
      if (updates.groupId !== undefined)
        updateData.group_id = updates.groupId || null;
      if (updates.planType !== undefined)
        updateData.plan_type = updates.planType || null;
      if (updates.planValue !== undefined)
        updateData.plan_value = updates.planValue || null;

      // Perform activity update
      if (Object.keys(updateData).length) {
        const { error } = await supabase
          .from("activities")
          .update(updateData)
          .eq("id", activityId);
        if (error) throw error;
      }

      // Upsert scoring rule if provided
      if (updates.scoringRule) {
        const sr = updates.scoringRule;
        const { error: srError } = await supabase.from("scoring_rules").upsert(
          {
            kid_id: kidId,
            activity_id: activityId,
            points: sr.basePointsPerUnit,
            bonus: sr.goalBonusPoints,
            streak: sr.streakBonusPoints,
            max_daily: sr.maxDailyPoints,
          },
          { onConflict: "kid_id,activity_id" }
        );
        if (srError) throw srError;
      }

      // Optimistic local merge
      setKid(prev =>
        prev
          ? {
              ...prev,
              activities: prev.activities?.map(a =>
                a.id === activityId
                  ? {
                      ...a,
                      name: updates.name !== undefined ? updates.name : a.name,
                      unit: updates.unit !== undefined ? updates.unit : a.unit,
                      groupId:
                        updates.groupId !== undefined
                          ? updates.groupId
                          : a.groupId,
                      planType:
                        updates.planType !== undefined
                          ? updates.planType
                          : a.planType,
                      planValue:
                        updates.planValue !== undefined
                          ? updates.planValue
                          : a.planValue,
                      scoringRule: updates.scoringRule
                        ? {
                            activityId: activityId,
                            basePointsPerUnit:
                              updates.scoringRule.basePointsPerUnit,
                            goalBonusPoints:
                              updates.scoringRule.goalBonusPoints,
                            streakBonusPoints:
                              updates.scoringRule.streakBonusPoints,
                            maxDailyPoints: updates.scoringRule.maxDailyPoints,
                          }
                        : a.scoringRule,
                    }
                  : a
              ),
            }
          : prev
      );

      toast({
        title: "Activity updated",
        description: "The activity has been updated.",
      });
    } catch (error) {
      console.error("Error updating activity:", error);
      toast({
        variant: "destructive",
        title: "Failed to update activity",
        description: "Could not update the activity. Please try again.",
      });
    }
  };

  const removeActivity = async (activityId: string) => {
    if (!user || !kid) return;

    const prevKid = kid; // for revert on failure
    const activity = kid.activities?.find(a => a.id === activityId);
    if (!activity) return;

    // Optimistic update: remove from local state immediately
    setKid(prev =>
      prev
        ? {
            ...prev,
            activities: prev.activities?.filter(a => a.id !== activityId) || [],
          }
        : prev
    );

    try {
      const { error } = await supabase
        .from("activities")
        .delete()
        .eq("id", activityId);

      if (error) throw error;

      toast({
        title: "Activity removed",
        description: `${activity.name} has been removed.`,
      });
    } catch (error) {
      console.error("Error removing activity:", error);
      // Revert optimistic update
      setKid(prevKid);
      toast({
        variant: "destructive",
        title: "Failed to remove activity",
        description: "Could not remove the activity. Please try again.",
      });
    }
  };

  // Legacy alias for compatibility
  const updateMetricScoringRule = updateActivityScoringRule;

  // Combined loading state: loading if either auth is loading OR kid data is loading
  const isLoading = authLoading || loading;

  return {
    kid,
    loading: isLoading,
    updateKid,
    addReport,
    approveReport,
    rejectReport,
    updateReport,
    deleteReport,
    addActivity,
    updateActivity,
    removeActivity,
    addGift,
    updateGift,
    deleteGift,
    redeemGift,
    updateRedemption,
    updateMetricScoringRule,
    updateActivityScoringRule,
    addGroup,
    removeGroup,
  };
}
