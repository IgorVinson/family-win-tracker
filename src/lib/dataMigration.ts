import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Types for localStorage data structure
type LocalStorageKid = {
  id: string;
  name: string;
  points: number;
  goal: number;
  color: string;
  createdAt: string;
  reports?: LocalStorageReport[];
  metrics?: LocalStorageMetric[];
  giftRedemptions?: LocalStorageGiftRedemption[];
};

type LocalStorageReport = {
  id: string;
  date: string;
  createdAt: string;
  notes?: string;
  entries: { metricId: string; value: number }[];
  status?: "pending" | "approved" | "rejected";
};

type LocalStorageMetric = {
  id: string;
  name: string;
  unit?: string;
  groupId?: string;
};

type LocalStorageGiftRedemption = {
  id: string;
  giftId: string;
  giftName: string;
  pointsCost: number;
  status: "pending" | "approved" | "rejected" | "completed";
  requestedAt: string;
  processedAt?: string;
  notes?: string;
};

export const checkIfMigrationNeeded = (): boolean => {
  try {
    const kidsData = localStorage.getItem("family-kids");
    if (!kidsData) return false;

    const kids = JSON.parse(kidsData) as LocalStorageKid[];
    return kids.length > 0;
  } catch (error) {
    console.error("Error checking migration need:", error);
    return false;
  }
};

export const migrateLocalStorageToSupabase = async (
  userId: string,
  userRole: "parent" | "kid"
): Promise<boolean> => {
  try {
    // Check if user already has data in database
    const { data: existingKids } = await supabase
      .from("kids")
      .select("id")
      .limit(1);

    if (existingKids && existingKids.length > 0) {
      console.log("User already has data in database, skipping migration");
      return true;
    }

    // Get localStorage data
    const kidsDataStr = localStorage.getItem("family-kids");
    if (!kidsDataStr) {
      console.log("No localStorage data to migrate");
      return true;
    }

    const localKids = JSON.parse(kidsDataStr) as LocalStorageKid[];
    if (localKids.length === 0) {
      console.log("No kids data to migrate");
      return true;
    }

    console.log(
      `Starting migration of ${localKids.length} kids for user ${userId} with role ${userRole}`
    );

    // Create family if user is parent
    let familyId: string;
    if (userRole === "parent") {
      const { data: family, error: familyError } = await supabase
        .from("families")
        .insert({
          name: "My Family",
          created_by: userId,
        })
        .select("id")
        .single();

      if (familyError) throw familyError;
      familyId = family.id;

      // Add parent to family
      const { error: memberError } = await supabase
        .from("family_members")
        .insert({
          family_id: familyId,
          user_id: userId,
        });

      if (memberError) throw memberError;
    } else {
      // For kids, we'll create a temporary family or they'll need to join one later
      const { data: family, error: familyError } = await supabase
        .from("families")
        .insert({
          name: "Temporary Family",
          created_by: userId,
        })
        .select("id")
        .single();

      if (familyError) throw familyError;
      familyId = family.id;

      // Add kid to family
      const { error: memberError } = await supabase
        .from("family_members")
        .insert({
          family_id: familyId,
          user_id: userId,
        });

      if (memberError) throw memberError;
    }

    // Migrate kids data
    for (const localKid of localKids) {
      // For kid role, only migrate their own data
      // For parent role, migrate all kids data
      let kidUserId = userId;
      if (userRole === "parent") {
        // Parents can have multiple kids, so we'll create kid entries linked to the parent's family
        // The kid user_id will be null initially since kids haven't signed up yet
        kidUserId = userId; // Temporarily link to parent
      }

      // Insert kid
      const { data: kid, error: kidError } = await supabase
        .from("kids")
        .insert({
          user_id: userRole === "kid" ? userId : null, // Only link if it's a kid user
          name: localKid.name,
          current_points: localKid.points,
          monthly_goal: localKid.goal,
          current_streak: 0,
          best_streak: 0,
        })
        .select("id")
        .single();

      if (kidError) throw kidError;
      const kidId = kid.id;

      // Add kid to family if parent created them
      if (userRole === "parent") {
        const { error: kidFamilyError } = await supabase
          .from("family_members")
          .insert({
            family_id: familyId,
            user_id: userId, // Link to parent for now
          });

        if (kidFamilyError) {
          console.error("Error adding kid to family:", kidFamilyError);
        }
      }

      // Migrate activities/metrics
      if (localKid.metrics && localKid.metrics.length > 0) {
        for (const metric of localKid.metrics) {
          // Check if activity already exists
          const { data: existingActivity } = await supabase
            .from("activities")
            .select("id")
            .eq("name", metric.name)
            .single();

          if (!existingActivity) {
            const { error: activityError } = await supabase
              .from("activities")
              .insert({
                name: metric.name,
                category: "Custom",
              });

            if (activityError) {
              console.error("Error inserting activity:", activityError);
            }
          }

          // Create scoring rule for this kid and activity
          const { error: scoringError } = await supabase
            .from("scoring_rules")
            .insert({
              kid_id: kidId,
              activity_id: metric.id, // assuming local metric id maps or will create activity elsewhere
              points: 10,
            });

          if (scoringError) {
            console.error("Error creating scoring rule:", scoringError);
          }
        }
      }

      // Migrate reports
      if (localKid.reports && localKid.reports.length > 0) {
        for (const report of localKid.reports) {
          // Convert entries to activities object
          const activities: Record<string, number> = {};
          let totalPoints = 0;

          for (const entry of report.entries) {
            // Find metric name
            const metric = localKid.metrics?.find(m => m.id === entry.metricId);
            if (metric) {
              activities[metric.name] = entry.value;
              totalPoints += entry.value * 10; // Default 10 points per unit
            }
          }

          const { error: reportError } = await supabase
            .from("daily_reports")
            .insert({
              kid_id: kidId,
              date: report.date,
              activities: activities,
              total_points: totalPoints,
              status: report.status || "approved", // Default to approved for migrated data
              notes: report.notes,
            });

          if (reportError) {
            console.error("Error inserting report:", reportError);
          }

          // Create score entries for each activity
          for (const entry of report.entries) {
            const metric = localKid.metrics?.find(m => m.id === entry.metricId);
            if (metric) {
              const { error: scoreError } = await supabase
                .from("score_entries")
                .insert({
                  kid_id: kidId,
                  date: report.date,
                  activity: metric.name,
                  points: entry.value * 10,
                  reason: "Migrated from daily report",
                  approved: true,
                  approved_by: userId,
                });

              if (scoreError) {
                console.error("Error inserting score entry:", scoreError);
              }
            }
          }
        }
      }

      // Migrate gift redemptions (legacy naming was prizeRedemptions)
      if (localKid.giftRedemptions && localKid.giftRedemptions.length > 0) {
        for (const redemption of localKid.giftRedemptions) {
          // Find or create gift (was prize)
          let giftId: string;
          const { data: existingGift } = await supabase
            .from("gifts")
            .select("id")
            .eq("name", redemption.giftName)
            .single();

          if (existingGift) {
            giftId = existingGift.id;
          } else {
            const { data: newGift, error: giftError } = await supabase
              .from("gifts")
              .insert({
                name: redemption.giftName,
                cost: redemption.pointsCost,
                description: "Migrated gift",
                category: "Custom",
                requires_approval: true,
                active: true,
              })
              .select("id")
              .single();

            if (giftError) {
              console.error("Error creating gift:", giftError);
              continue;
            }
            giftId = newGift.id;
          }

          const { error: redemptionError } = await supabase
            .from("gift_redemptions")
            .insert({
              kid_id: kidId,
              gift_id: giftId,
              status: redemption.status,
              date_processed: redemption.processedAt
                ? new Date(redemption.processedAt).toISOString()
                : null,
              notes: redemption.notes,
              processed_by: redemption.status !== "pending" ? userId : null,
            });

          if (redemptionError) {
            console.error("Error inserting gift redemption:", redemptionError);
          }
        }
      }
    }

    console.log("Migration completed successfully");

    // Clear localStorage after successful migration
    localStorage.removeItem("family-kids");

    toast({
      title: "Data migrated successfully!",
      description: "Your existing data has been transferred to your account.",
    });

    return true;
  } catch (error) {
    console.error("Migration failed:", error);
    toast({
      variant: "destructive",
      title: "Migration failed",
      description:
        "There was an error transferring your data. Please contact support.",
    });
    return false;
  }
};

// getUserRole function removed. Use fetchUserRole()/useUserRole instead.
