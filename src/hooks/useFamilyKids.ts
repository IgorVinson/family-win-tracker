import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

// Simple Kid type for the main dashboard (lightweight)
export type DailyReportLite = {
  id: string;
  date: string;
  status: string | null;
  created_at?: string; // raw from DB
  createdAt?: string; // mapped for UI
};
export type GiftRedemptionLite = {
  id: string;
  status: string | null;
};
export type Kid = {
  id: string;
  name: string;
  points: number;
  goal: number;
  color: string;
  createdAt: string;
  reports?: DailyReportLite[];
  metrics?: never[]; // not loaded here
  giftRedemptions?: GiftRedemptionLite[];
};

export function useFamilyKids() {
  const [kids, setKids] = useState<Kid[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, userRole, isAuthenticated, loading: authLoading } = useAuth();

  // Load kids data from database
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setKids([]);
      setLoading(false);
      return;
    }

    if (userRole === null) {
      setLoading(true);
      return;
    }

    loadKidsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userRole, isAuthenticated]);

  // Return early for non-authenticated users to avoid any database operations
  if (!isAuthenticated) {
    return {
      kids: [],
      loading: false,
      addKid: async () => {},
      updatePoints: async () => {},
      setGoal: async () => {},
      resetKid: async () => {},
      refresh: async () => {},
    };
  }

  const loadKidsData = async () => {
    try {
      setLoading(true);

      let query = supabase.from("kids").select(`
        id, name, current_points, monthly_goal, created_at,
        daily_reports(id, date, status, created_at),
        gift_redemptions(id, status)
      `);

      // If user is a kid, only show their own profile
      if (userRole === "kid") {
        query = query.eq("user_id", user?.id);
      }
      // For parents (and other roles), rely on RLS to scope visibility. Removing previous filter that excluded claimed kid accounts.

      const { data: kidsData, error } = await query.order("created_at", {
        ascending: true,
      });

      if (error) {
        console.error("Error loading kids:", error);
        setKids([]);
        return;
      }

      // Convert database format to Kid format
      const convertedKids: Kid[] = (kidsData || []).map((kid, index) => {
        type ReportRow = {
          id: string;
          date: string;
          status: string | null;
          created_at?: string;
        };
        type GiftRow = { id: string; status: string | null };
        const reports: DailyReportLite[] = (
          (kid.daily_reports || []) as ReportRow[]
        ).map(r => ({
          id: r.id,
          date: r.date,
          status: r.status,
          created_at: r.created_at,
          createdAt: r.created_at,
        }));
        return {
          id: kid.id,
          name: kid.name,
          points: kid.current_points || 0,
          goal: kid.monthly_goal || 50,
          color: getPastelColor(index),
          createdAt: kid.created_at,
          reports,
          giftRedemptions: ((kid.gift_redemptions || []) as GiftRow[]).map(
            g => ({ id: g.id, status: g.status })
          ),
        };
      });

      setKids(convertedKids);
    } catch (error) {
      console.error("Error loading kids data:", error);
      setKids([]);
    } finally {
      setLoading(false);
    }
  };

  const addKid = async (name: string, goal: number) => {
    if (!user || !isAuthenticated) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please sign in to add kids.",
      });
      return;
    }

    if (userRole !== "parent") {
      toast({
        variant: "destructive",
        title: "Permission denied",
        description: "Only parents can create kid profiles.",
      });
      return;
    }

    try {
      console.log("Adding kid with user role:", userRole, "user id:", user.id);

      const { data, error } = await supabase
        .from("kids")
        .insert({
          name: name.trim(),
          monthly_goal: Math.max(0, goal),
          current_points: 0,
          // user_id intentionally not set when parent creates placeholder kid account
        })
        .select()
        .single();

      if (error) {
        console.error("Database error:", error);

        if (error.code === "42501") {
          toast({
            variant: "destructive",
            title: "Permission denied",
            description:
              "You don't have permission to create kids. Please contact your administrator.",
          });
          return;
        }

        throw error;
      }

      // Refresh the kids list
      await loadKidsData();

      toast({
        title: "Kid added",
        description: `${name} joined the leaderboard!`,
      });
    } catch (error) {
      console.error("Error adding kid:", error);
      toast({
        variant: "destructive",
        title: "Failed to add kid",
        description: "Could not add the kid. Please try again.",
      });
    }
  };

  const updatePoints = async (kidId: string, delta: number) => {
    if (!user || !isAuthenticated) return;

    try {
      const kid = kids.find(k => k.id === kidId);
      if (!kid) return;

      const newPoints = Math.max(0, kid.points + delta);

      const { error } = await supabase
        .from("kids")
        .update({
          current_points: newPoints,
          updated_at: new Date().toISOString(),
        })
        .eq("id", kidId);

      if (error) throw error;

      // Update local state optimistically
      setKids(prev =>
        prev.map(k => (k.id === kidId ? { ...k, points: newPoints } : k))
      );

      // Check for goal achievement
      const before = kid.points;
      const after = newPoints;
      if (before < kid.goal && after >= kid.goal && kid.goal > 0) {
        toast({
          title: "Goal reached!",
          description: `${kid.name} hit their goal of ${kid.goal} points 🎉`,
        });
      }
    } catch (error) {
      console.error("Error updating points:", error);
      toast({
        variant: "destructive",
        title: "Failed to update points",
        description: "Could not update points. Please try again.",
      });
      // Refresh data to revert optimistic update
      loadKidsData();
    }
  };

  const setGoal = async (kidId: string, goal: number) => {
    if (!user || !isAuthenticated) return;

    try {
      const { error } = await supabase
        .from("kids")
        .update({
          monthly_goal: goal,
          updated_at: new Date().toISOString(),
        })
        .eq("id", kidId);

      if (error) throw error;

      // Update local state optimistically
      setKids(prev => prev.map(k => (k.id === kidId ? { ...k, goal } : k)));
    } catch (error) {
      console.error("Error setting goal:", error);
      toast({
        variant: "destructive",
        title: "Failed to set goal",
        description: "Could not update goal. Please try again.",
      });
      // Refresh data to revert optimistic update
      loadKidsData();
    }
  };

  const resetKid = async (kidId: string) => {
    if (!user || !isAuthenticated) return;

    try {
      const { error } = await supabase
        .from("kids")
        .update({
          current_points: 0,
          updated_at: new Date().toISOString(),
        })
        .eq("id", kidId);

      if (error) throw error;

      // Update local state optimistically
      setKids(prev =>
        prev.map(k => (k.id === kidId ? { ...k, points: 0 } : k))
      );
    } catch (error) {
      console.error("Error resetting kid:", error);
      toast({
        variant: "destructive",
        title: "Failed to reset points",
        description: "Could not reset points. Please try again.",
      });
      // Refresh data to revert optimistic update
      loadKidsData();
    }
  };

  // Combined loading state: loading if either auth is loading OR kids data is loading
  const isLoading = authLoading || loading;

  return {
    kids,
    loading: isLoading,
    addKid,
    updatePoints,
    setGoal,
    resetKid,
    refresh: loadKidsData,
  };
}

// Helper function to get pastel colors (matching the original Index.tsx)
const pastelHues = [
  "262 83% 58%",
  "200 90% 45%",
  "28 92% 54%",
  "150 60% 45%",
  "330 70% 55%",
];

function getPastelColor(index: number): string {
  return pastelHues[index % pastelHues.length];
}
