import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { EnhancedKid, Prize, PrizeRedemption, ScoringRule } from "@/types/scoreSystem";
import { ScoringEngine } from "@/lib/scoringEngine";
import { toast } from "@/hooks/use-toast";

// Convert database kid to EnhancedKid format
function convertToEnhancedKid(dbKid: any, activities: any[], reports: any[], scoreEntries: any[], prizes: any[], redemptions: any[]): EnhancedKid {
  // Convert database activities to enhanced format
  const enhancedActivities = activities.map(activity => ({
    id: activity.activity,
    name: activity.activity,
    value: 0, // This would be calculated from recent reports
    scoringRule: {
      activityId: activity.activity,
      basePointsPerUnit: activity.points,
      goalBonusPoints: activity.bonus,
      streakBonusPoints: activity.streak,
      maxDailyPoints: activity.max_daily || 100
    }
  }));

  // Convert reports
  const enhancedReports = reports.map(report => ({
    id: report.id,
    date: report.date,
    createdAt: report.created_at,
    notes: report.notes,
    entries: Object.entries(report.activities || {}).map(([activity, value]) => ({
      activityId: activity,
      value: value as number
    })),
    status: report.status as "pending" | "approved" | "rejected",
    processedAt: report.updated_at,
    processedBy: "parent" as const
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
    createdAt: entry.created_at
  }));

  // Convert prizes
  const enhancedPrizes: Prize[] = prizes.map(prize => ({
    id: prize.id,
    name: prize.name,
    description: prize.description || "",
    pointsCost: prize.cost,
    category: prize.category || "general",
    isActive: prize.active,
    createdAt: prize.created_at
  }));

  // Convert redemptions
  const enhancedRedemptions: PrizeRedemption[] = redemptions.map(redemption => ({
    id: redemption.id,
    prizeId: redemption.prize_id,
    prizeName: redemption.prizes?.name || "Unknown Prize",
    pointsCost: redemption.prizes?.cost || 0,
    status: redemption.status as "pending" | "approved" | "rejected" | "completed",
    requestedAt: redemption.created_at,
    processedAt: redemption.date_processed,
    notes: redemption.notes
  }));

  return {
    id: dbKid.id,
    name: dbKid.name,
    points: dbKid.current_points,
    goal: dbKid.monthly_goal,
    color: "262 83% 58%", // Default color
    createdAt: dbKid.created_at,
    totalPointsEarned: enhancedScoreHistory.reduce((sum, entry) => sum + entry.points, 0),
    activities: enhancedActivities,
    groups: [], // We don't have groups in the database yet
    reports: enhancedReports,
    scoreHistory: enhancedScoreHistory,
    availablePrizes: enhancedPrizes,
    prizeRedemptions: enhancedRedemptions,
    achievements: [], // Placeholder for achievements
    streaks: {} // Placeholder for streaks
  };
}

export function useEnhancedKidDB(kidId: string) {
  const [kid, setKid] = useState<EnhancedKid | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, userRole } = useAuth();

  // Load kid data from database
  useEffect(() => {
    if (!user || !kidId) {
      setKid(null);
      setLoading(false);
      return;
    }

    loadKidData();
  }, [user, kidId, userRole]);

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

      // Check if user has access to this kid
      const canAccess = userRole === 'parent' || kidData.user_id === user?.id;
      
      if (!canAccess) {
        console.error("User doesn't have access to this kid");
        setKid(null);
        return;
      }

      // Load related data in parallel
      const [
        { data: activities = [] },
        { data: reports = [] },
        { data: scoreEntries = [] },
        { data: prizes = [] },
        { data: redemptions = [] }
      ] = await Promise.all([
        supabase.from("scoring_rules").select("*").eq("kid_id", kidId),
        supabase.from("daily_reports").select("*").eq("kid_id", kidId).order("date", { ascending: false }),
        supabase.from("score_entries").select("*").eq("kid_id", kidId).order("date", { ascending: false }),
        supabase.from("prizes").select("*").eq("active", true).order("cost", { ascending: true }),
        supabase.from("prize_redemptions").select("*, prizes(name, cost)").eq("kid_id", kidId).order("created_at", { ascending: false })
      ]);

      const enhancedKid = convertToEnhancedKid(kidData, activities, reports, scoreEntries, prizes, redemptions);
      setKid(enhancedKid);
    } catch (error) {
      console.error("Error loading kid data:", error);
      setKid(null);
    } finally {
      setLoading(false);
    }
  };

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
          updated_at: new Date().toISOString()
        })
        .eq("id", kidId);

      if (error) {
        console.error("Error updating kid:", error);
        // Revert the optimistic update
        setKid(kid);
        toast({
          variant: "destructive",
          title: "Update failed",
          description: "Could not update kid data. Please try again."
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

    try {
      // Convert entries to activities object
      const activities: Record<string, number> = {};
      let totalPoints = 0;

      for (const entry of reportData.entries) {
        activities[entry.activityId] = entry.value;
        // Calculate points based on scoring rules
        const activity = kid.activities?.find(a => a.id === entry.activityId);
        if (activity?.scoringRule) {
          totalPoints += entry.value * activity.scoringRule.basePointsPerUnit;
        }
      }

      const { data, error } = await supabase
        .from("daily_reports")
        .insert({
          kid_id: kidId,
          date: reportData.date,
          activities,
          total_points: totalPoints,
          status: "pending",
          notes: reportData.notes
        })
        .select()
        .single();

      if (error) throw error;

      // Refresh data
      await loadKidData();
      
      toast({
        title: "Report added",
        description: "Your daily report has been submitted for approval."
      });
    } catch (error) {
      console.error("Error adding report:", error);
      toast({
        variant: "destructive",
        title: "Failed to add report",
        description: "Could not submit your report. Please try again."
      });
    }
  };

  const approveReport = async (reportId: string) => {
    if (!kid || !user || userRole !== 'parent') return;

    try {
      const { error } = await supabase
        .from("daily_reports")
        .update({
          status: "approved",
          updated_at: new Date().toISOString()
        })
        .eq("id", reportId);

      if (error) throw error;

      // Find the report and create score entries
      const report = kid.reports?.find(r => r.id === reportId);
      if (report) {
        for (const entry of report.entries) {
          const activity = kid.activities?.find(a => a.id === entry.activityId);
          const points = activity?.scoringRule ? entry.value * activity.scoringRule.basePointsPerUnit : entry.value * 10;

          await supabase
            .from("score_entries")
            .insert({
              kid_id: kidId,
              date: report.date,
              activity: entry.activityId,
              points,
              reason: "Daily report approved",
              approved: true,
              approved_by: user.id
            });
        }

        // Update kid's current points
        const totalReportPoints = report.entries.reduce((sum, entry) => {
          const activity = kid.activities?.find(a => a.id === entry.activityId);
          const points = activity?.scoringRule ? entry.value * activity.scoringRule.basePointsPerUnit : entry.value * 10;
          return sum + points;
        }, 0);

        await supabase
          .from("kids")
          .update({
            current_points: kid.points + totalReportPoints,
            updated_at: new Date().toISOString()
          })
          .eq("id", kidId);
      }

      await loadKidData();
      
      toast({
        title: "Report approved",
        description: "The daily report has been approved and points awarded."
      });
    } catch (error) {
      console.error("Error approving report:", error);
      toast({
        variant: "destructive",
        title: "Failed to approve report",
        description: "Could not approve the report. Please try again."
      });
    }
  };

  const rejectReport = async (reportId: string) => {
    if (!kid || !user || userRole !== 'parent') return;

    try {
      const { error } = await supabase
        .from("daily_reports")
        .update({
          status: "rejected",
          updated_at: new Date().toISOString()
        })
        .eq("id", reportId);

      if (error) throw error;

      await loadKidData();
      
      toast({
        title: "Report rejected",
        description: "The daily report has been rejected."
      });
    } catch (error) {
      console.error("Error rejecting report:", error);
      toast({
        variant: "destructive",
        title: "Failed to reject report",
        description: "Could not reject the report. Please try again."
      });
    }
  };

  const updateReport = async (reportId: string, updates: {
    date?: string;
    notes?: string;
    entries?: Array<{ activityId: string; value: number }>;
  }) => {
    if (!kid || !user) return;

    try {
      const updateData: any = {};
      
      if (updates.date) updateData.date = updates.date;
      if (updates.notes !== undefined) updateData.notes = updates.notes;
      
      if (updates.entries) {
        const activities: Record<string, number> = {};
        let totalPoints = 0;

        for (const entry of updates.entries) {
          activities[entry.activityId] = entry.value;
          const activity = kid.activities?.find(a => a.id === entry.activityId);
          if (activity?.scoringRule) {
            totalPoints += entry.value * activity.scoringRule.basePointsPerUnit;
          }
        }

        updateData.activities = activities;
        updateData.total_points = totalPoints;
        updateData.status = "pending"; // Reset to pending if entries changed
      }

      const { error } = await supabase
        .from("daily_reports")
        .update(updateData)
        .eq("id", reportId);

      if (error) throw error;

      await loadKidData();
      
      toast({
        title: "Report updated",
        description: "The daily report has been updated."
      });
    } catch (error) {
      console.error("Error updating report:", error);
      toast({
        variant: "destructive",
        title: "Failed to update report",
        description: "Could not update the report. Please try again."
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
        description: "The daily report has been deleted."
      });
    } catch (error) {
      console.error("Error deleting report:", error);
      toast({
        variant: "destructive",
        title: "Failed to delete report",
        description: "Could not delete the report. Please try again."
      });
    }
  };

  const addPrize = async (prizeData: Omit<Prize, "id" | "createdAt">) => {
    if (!user || userRole !== 'parent') return;

    try {
      const { error } = await supabase
        .from("prizes")
        .insert({
          name: prizeData.name,
          description: prizeData.description,
          cost: prizeData.pointsCost,
          category: prizeData.category,
          active: prizeData.isActive
        });

      if (error) throw error;

      await loadKidData();
      
      toast({
        title: "Prize added",
        description: `${prizeData.name} has been added to the prize shop.`
      });
    } catch (error) {
      console.error("Error adding prize:", error);
      toast({
        variant: "destructive",
        title: "Failed to add prize",
        description: "Could not add the prize. Please try again."
      });
    }
  };

  const updatePrize = async (prizeId: string, updates: Partial<Prize>) => {
    if (!user || userRole !== 'parent') return;

    try {
      const updateData: any = {};
      if (updates.name) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.pointsCost !== undefined) updateData.cost = updates.pointsCost;
      if (updates.category) updateData.category = updates.category;
      if (updates.isActive !== undefined) updateData.active = updates.isActive;

      const { error } = await supabase
        .from("prizes")
        .update(updateData)
        .eq("id", prizeId);

      if (error) throw error;

      await loadKidData();
      
      toast({
        title: "Prize updated",
        description: "The prize has been updated."
      });
    } catch (error) {
      console.error("Error updating prize:", error);
      toast({
        variant: "destructive",
        title: "Failed to update prize",
        description: "Could not update the prize. Please try again."
      });
    }
  };

  const deletePrize = async (prizeId: string) => {
    if (!user || userRole !== 'parent') return;

    try {
      const { error } = await supabase
        .from("prizes")
        .update({ active: false })
        .eq("id", prizeId);

      if (error) throw error;

      await loadKidData();
      
      toast({
        title: "Prize removed",
        description: "The prize has been removed from the shop."
      });
    } catch (error) {
      console.error("Error removing prize:", error);
      toast({
        variant: "destructive",
        title: "Failed to remove prize",
        description: "Could not remove the prize. Please try again."
      });
    }
  };

  const redeemPrize = async (prizeId: string) => {
    if (!kid || !user) return;

    const prize = kid.availablePrizes.find(p => p.id === prizeId);
    if (!prize || kid.points < prize.pointsCost) return;

    try {
      // Create redemption request
      const { error: redemptionError } = await supabase
        .from("prize_redemptions")
        .insert({
          kid_id: kidId,
          prize_id: prizeId,
          status: "pending"
        });

      if (redemptionError) throw redemptionError;

      // Deduct points
      const { error: pointsError } = await supabase
        .from("kids")
        .update({
          current_points: kid.points - prize.pointsCost,
          updated_at: new Date().toISOString()
        })
        .eq("id", kidId);

      if (pointsError) throw pointsError;

      await loadKidData();
      
      toast({
        title: "Prize redeemed!",
        description: `You've redeemed ${prize.name} for ${prize.pointsCost} points.`
      });
    } catch (error) {
      console.error("Error redeeming prize:", error);
      toast({
        variant: "destructive",
        title: "Failed to redeem prize",
        description: "Could not redeem the prize. Please try again."
      });
    }
  };

  const updateRedemption = async (redemptionId: string, status: PrizeRedemption["status"], notes?: string) => {
    if (!user || userRole !== 'parent') return;

    try {
      const { error } = await supabase
        .from("prize_redemptions")
        .update({
          status,
          date_processed: new Date().toISOString(),
          notes,
          processed_by: user.id
        })
        .eq("id", redemptionId);

      if (error) throw error;

      // If rejecting, return points to kid
      if (status === "rejected") {
        const redemption = kid?.prizeRedemptions.find(r => r.id === redemptionId);
        if (redemption && kid) {
          await supabase
            .from("kids")
            .update({
              current_points: kid.points + redemption.pointsCost,
              updated_at: new Date().toISOString()
            })
            .eq("id", kidId);
        }
      }

      await loadKidData();
      
      toast({
        title: `Redemption ${status}`,
        description: `The prize redemption has been ${status}.`
      });
    } catch (error) {
      console.error("Error updating redemption:", error);
      toast({
        variant: "destructive",
        title: "Failed to update redemption",
        description: "Could not update the redemption. Please try again."
      });
    }
  };

  const updateActivityScoringRule = async (activityId: string, scoringRule: ScoringRule) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("scoring_rules")
        .upsert({
          kid_id: kidId,
          activity: activityId,
          points: scoringRule.basePointsPerUnit,
          bonus: scoringRule.goalBonusPoints,
          streak: scoringRule.streakBonusPoints,
          max_daily: scoringRule.maxDailyPoints
        }, {
          onConflict: 'kid_id,activity'
        });

      if (error) throw error;

      await loadKidData();
      
      toast({
        title: "Scoring rule updated",
        description: "The activity scoring rule has been updated."
      });
    } catch (error) {
      console.error("Error updating scoring rule:", error);
      toast({
        variant: "destructive",
        title: "Failed to update scoring rule",
        description: "Could not update the scoring rule. Please try again."
      });
    }
  };

  // Legacy alias for compatibility
  const updateMetricScoringRule = updateActivityScoringRule;

  return {
    kid,
    loading,
    updateKid,
    addReport,
    approveReport,
    rejectReport,
    updateReport,
    deleteReport,
    addPrize,
    updatePrize,
    deletePrize,
    redeemPrize,
    updateRedemption,
    updateMetricScoringRule,
    updateActivityScoringRule
  };
}