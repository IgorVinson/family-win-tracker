import { AuthGuard } from "@/components/auth/AuthGuard";
import { GiftManagement } from "@/components/gift/GiftManagement";
import { GiftShop } from "@/components/gift/GiftShop";
import DailyReportForm from "@/components/kid/DailyReportForm";
import EditActivityModal from "@/components/kid/EditActivityModal";
import { EditReportModal } from "@/components/kid/EditReportModal";
import { ReportApprovalCard } from "@/components/kid/ReportApprovalCard";
import { ReviewReportModal } from "@/components/kid/ReviewReportModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useEnhancedKidDB } from "@/hooks/useEnhancedKidDB";
import { supabase } from "@/integrations/supabase/client";
import { EnhancedKid, ScoringRule } from "@/types/scoreSystem";
import {
  ArrowLeft,
  Award,
  BarChart3,
  Calendar,
  Coins,
  Edit,
  FileText,
  Loader2,
  Plus,
  Save,
  Target,
  Trash2,
  Trophy,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";

// Legacy types for compatibility (UPDATED FOR ACTIVITIES)
export type Activity = {
  id: string;
  name: string;
  value: number;
  unit?: string;
  groupId?: string;
  planType?: "daily" | "weekly";
  planValue?: number;
  scoringRule?: ScoringRule; // added optional scoring rule for typing
};
export type Group = { id: string; name: string; type: "project" | "goal" };
export type DailyReportEntry = { activityId: string; value: number };
export type DailyReport = {
  id: string;
  date: string;
  createdAt: string;
  notes?: string;
  entries: DailyReportEntry[];
  status?: "pending" | "approved" | "rejected";
  processedAt?: string;
  processedBy?: "parent" | "system";
};

// Create a proper Report type alias
export type Report = {
  id: string;
  date: string;
  createdAt: string;
  notes?: string;
  entries: Array<{ activityId: string; value: number }>;
  status: "pending" | "approved" | "rejected";
  processedAt?: string;
  processedBy?: "parent" | "system";
};

export default function KidDashboard() {
  return (
    <AuthGuard requireAuth={true}>
      <KidDashboardContent />
    </AuthGuard>
  );
}

function KidDashboardContent() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { loading: authLoading, userRole } = useAuth();
  const {
    kid,
    loading,
    addReport,
    approveReport,
    rejectReport,
    updateReport,
    deleteReport,
    addActivity: addActivityDB,
    updateActivity: updateActivityDB,
    removeActivity: removeActivityDB,
    addGift,
    updateGift,
    deleteGift,
    redeemGift,
    updateRedemption,
    updateKid,
    updateActivityScoringRule,
    addGroup: addGroupDB,
    removeGroup: removeGroupDB,
  } = useEnhancedKidDB(id || "");

  const [activityName, setActivityName] = useState("");
  const [activityUnit, setActivityUnit] = useState("");
  const [planType, setPlanType] = useState<"daily" | "weekly">("daily");
  const [planValue, setPlanValue] = useState("");
  const [activityGroupId, setActivityGroupId] = useState<string>("");

  // Scoring rule states for new activities
  const [newBasePointsPerUnit, setNewBasePointsPerUnit] = useState("1");
  const [newGoalBonusPoints, setNewGoalBonusPoints] = useState("5");
  const [newStreakBonusPoints, setNewStreakBonusPoints] = useState("2");
  const [newMaxDailyPoints, setNewMaxDailyPoints] = useState("50");
  const [groupName, setGroupName] = useState("");
  const [groupType, setGroupType] = useState<"project" | "goal">("goal");
  const [showManagement, setShowManagement] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [reviewingReport, setReviewingReport] = useState<Report | null>(null);
  const [deletingReport, setDeletingReport] = useState<Report | null>(null);
  const [deletingActivity, setDeletingActivity] = useState<Activity | null>(
    null
  );

  const [openAddGroup, setOpenAddGroup] = useState(false);
  const [openAddActivity, setOpenAddActivity] = useState(false);
  const [openAddReport, setOpenAddReport] = useState(false);
  const reportSaveRef = useRef<(() => void) | null>(null);
  // NEW: active section for sidebar nav
  const [activeTab, setActiveTab] = useState("metrics");
  // kid leaderboard state
  const [leaderboardKids, setLeaderboardKids] = useState<
    Array<{ id: string; name: string; points: number; goal: number }>
  >([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  const headerContainerCls =
    "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4";
  const overviewGridCls =
    "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8";
  const mainLayoutCls = "flex flex-col md:flex-row gap-6";
  const sidebarWidthCls = "md:w-48 lg:w-56 shrink-0";
  const tabsListMobileCls = "grid w-full grid-cols-3 md:hidden";
  const scoringRulesBoxCls = "space-y-3 p-4 bg-muted/50 rounded-lg";
  const giftDialogContentCls = "max-w-4xl max-h-[80vh] overflow-y-auto";
  const addReportBtnGradient =
    "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200";
  const manageGiftsBtnGradient =
    "relative bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200";

  useEffect(() => {
    document.title = kid
      ? `${kid.name} Dashboard – Kids Tracker`
      : "Kid Dashboard – Kids Tracker";
  }, [kid]);

  useEffect(() => {
    if (userRole === "kid") {
      (async () => {
        setLeaderboardLoading(true);
        try {
          type Row = {
            id: string;
            name: string;
            current_points: number | null;
            monthly_goal: number | null;
          };
          const { data } = await supabase
            .from("kids")
            .select("id,name,current_points,monthly_goal")
            .order("current_points", { ascending: false });
          setLeaderboardKids(
            ((data as Row[]) || []).map(k => ({
              id: k.id,
              name: k.name,
              points: k.current_points || 0,
              goal: k.monthly_goal || 0,
            }))
          );
        } finally {
          setLeaderboardLoading(false);
        }
      })();
    }
  }, [userRole]);

  // Keep the legacy updateKid function for existing metric/group operations - now using database
  const updateKidLegacy = async (updater: (k: EnhancedKid) => EnhancedKid) => {
    if (!kid) return;

    // For now, activities and groups will be handled locally until we add them to database
    // Since we don't have direct setKid access, we'll use the updateKid function
    const updatedKid = updater(kid);

    // Use the database updateKid function to persist changes
    await updateKid(() => updatedKid);
  };

  const addActivity = async () => {
    if (!activityName.trim()) return;

    // Create scoring rule for the new activity
    const scoringRule = {
      activityId: crypto.randomUUID(), // This will be replaced by the actual activity ID
      basePointsPerUnit: Math.max(0, Number(newBasePointsPerUnit) || 1),
      goalBonusPoints: Math.max(0, Number(newGoalBonusPoints) || 0),
      streakBonusPoints: Math.max(0, Number(newStreakBonusPoints) || 0),
      maxDailyPoints: Math.max(1, Number(newMaxDailyPoints) || 50),
    };

    await addActivityDB(
      {
        name: activityName,
        unit: activityUnit || undefined,
        groupId: activityGroupId || undefined,
        planType,
        planValue: planValue ? parseInt(planValue) : undefined,
      },
      scoringRule
    );

    // Reset form
    setActivityName("");
    setActivityUnit("");
    setPlanValue("");
    setActivityGroupId("");
    setNewBasePointsPerUnit("1");
    setNewGoalBonusPoints("5");
    setNewStreakBonusPoints("2");
    setNewMaxDailyPoints("50");
    setOpenAddActivity(false);
  };

  const updateActivity = async (updatedActivity: Activity) => {
    await updateActivityDB(updatedActivity.id, {
      name: updatedActivity.name,
      unit: updatedActivity.unit,
      groupId: updatedActivity.groupId,
      planType: updatedActivity.planType,
      planValue: updatedActivity.planValue,
    });
  };

  const removeActivity = async (activityId: string) => {
    await removeActivityDB(activityId);
  };

  const addGroup = async () => {
    if (!groupName.trim()) return;

    await addGroupDB({
      name: groupName,
      type: groupType,
    });

    setGroupName("");
    setOpenAddGroup(false);
  };

  const removeGroup = async (groupId: string) => {
    await removeGroupDB(groupId);
  };

  const groupedActivities = useMemo(() => {
    if (!kid?.activities) return [];
    const groups = kid.groups || [];
    const ungrouped = kid.activities.filter(a => !a.groupId);
    const result = [];

    if (ungrouped.length > 0) {
      result.push({ group: null, activities: ungrouped });
    }

    groups.forEach(group => {
      const groupActivities =
        kid.activities?.filter(a => a.groupId === group.id) || [];
      if (groupActivities.length > 0) {
        result.push({ group, activities: groupActivities });
      }
    });

    return result;
  }, [kid?.activities, kid?.groups]);

  const pendingReports = (kid?.reports || [])
    .filter(report => report.status === "pending")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Count pending redemptions for notification badge
  const pendingRedemptions =
    kid?.giftRedemptions?.filter(r => r.status === "pending").length || 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="card-elevated">
          <CardContent className="flex items-center gap-4 p-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <div>
              <p className="font-medium">Loading...</p>
              <p className="text-sm text-muted-foreground">
                Loading kid dashboard
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!kid) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Kid not found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The kid you are looking for doesn't exist.</p>
            <Link to="/">
              <Button className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Kids
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Main Content with Sidebar */}
      <div className={mainLayoutCls}>
        {/* Sidebar */}
        <aside className={sidebarWidthCls}>
          <div>
            <h1 className="text-3xl font-bold mb-4">{kid.name}</h1>
          </div>
          <nav className="space-y-1 sticky top-4">
            <SidebarNavItem
              label="Activities"
              icon={BarChart3}
              active={activeTab === "metrics"}
              onClick={() => setActiveTab("metrics")}
            />
            <SidebarNavItem
              label="Reports"
              icon={Calendar}
              active={activeTab === "reports"}
              onClick={() => setActiveTab("reports")}
              badge={
                pendingReports.length > 0 ? pendingReports.length : undefined
              }
              badgeVariant="destructive"
            />
            <SidebarNavItem
              label="Gift Shop"
              icon={Coins}
              active={activeTab === "shop"}
              onClick={() => setActiveTab("shop")}
            />
            {userRole === "kid" && (
              <SidebarNavItem
                label="Leaderboard"
                icon={Trophy}
                active={activeTab === "leaderboard"}
                onClick={() => setActiveTab("leaderboard")}
              />
            )}
          </nav>
        </aside>

        {/* Section Content */}
        <div className="flex-1 space-y-6">
          {/* Header */}
          <div className={headerContainerCls}>
            <div className="flex items-center gap-4">
              {userRole !== "kid" && (
                <Link to="/">
                  <Button variant="outline" size="sm">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Kids
                  </Button>
                </Link>
              )}
            </div>
            <div className="flex gap-2">
              {userRole === "parent" && (
                <>
                  <Button
                    onClick={() => setOpenAddGroup(true)}
                    variant="outline"
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add group
                  </Button>
                  <Button
                    onClick={() => setOpenAddActivity(true)}
                    variant="outline"
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add activity
                  </Button>
                </>
              )}
              <Button
                onClick={() => setOpenAddReport(true)}
                variant="outline"
                className={addReportBtnGradient}
              >
                <FileText className="mr-2 h-4 w-4" /> Add report
              </Button>
              {userRole === "parent" && (
                <Button
                  onClick={() => setShowManagement(true)}
                  variant="outline"
                  className={manageGiftsBtnGradient}
                >
                  <Coins className="mr-2 h-4 w-4" /> Manage Gifts
                  {pendingRedemptions > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs animate-pulse"
                    >
                      {pendingRedemptions}
                    </Badge>
                  )}
                </Button>
              )}
            </div>
          </div>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className={tabsListMobileCls}>
              <TabsTrigger value="metrics">Activities</TabsTrigger>
              <TabsTrigger value="reports">
                Reports
                {pendingReports.length > 0 && (
                  <Badge variant="destructive" className="ml-1 text-xs">
                    {pendingReports.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="shop">Gift Shop</TabsTrigger>
            </TabsList>

            <TabsContent value="shop">
              <GiftShop kid={kid} onRedeemGift={redeemGift} />
            </TabsContent>

            <TabsContent value="metrics" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" /> Activities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!kid.activities || kid.activities.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No activities configured. Add an activity to start
                      tracking progress.
                    </p>
                  ) : (
                    <div className="space-y-6">
                      {groupedActivities.map(({ group, activities }) => (
                        <div key={group?.id || "ungrouped"}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">
                                {group?.name || "Ungrouped"}
                              </h3>
                              {group && (
                                <Badge
                                  variant={
                                    group.type === "goal"
                                      ? "default"
                                      : "secondary"
                                  }
                                >
                                  {group.type}
                                </Badge>
                              )}
                            </div>
                            {group && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeGroup(group.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Activity</TableHead>
                                <TableHead>Current</TableHead>
                                <TableHead>Plan</TableHead>
                                <TableHead>Points</TableHead>
                                {userRole === "parent" && (
                                  <TableHead>Actions</TableHead>
                                )}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {activities.map(activity => {
                                const scoringRule: ScoringRule =
                                  activity.scoringRule || {
                                    activityId: activity.id,
                                    basePointsPerUnit: 1,
                                    goalBonusPoints: 5,
                                    streakBonusPoints: 2,
                                    maxDailyPoints: 50,
                                  };
                                const pointsDisplay = `${
                                  scoringRule.basePointsPerUnit
                                }${
                                  activity.unit ? ` per ${activity.unit}` : ""
                                } (+${scoringRule.goalBonusPoints} goal)`;
                                return (
                                  <TableRow key={activity.id}>
                                    <TableCell className="font-medium">
                                      {activity.name}
                                    </TableCell>
                                    <TableCell>
                                      {activity.value} {activity.unit || ""}
                                    </TableCell>
                                    <TableCell>
                                      {activity.planValue ? (
                                        <Badge variant="outline">
                                          {activity.planValue}{" "}
                                          {activity.unit || ""}{" "}
                                          {activity.planType}
                                        </Badge>
                                      ) : (
                                        <span className="text-muted-foreground">
                                          No plan
                                        </span>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <div className="text-sm">
                                        <div className="font-medium text-primary">
                                          {pointsDisplay}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          +{scoringRule.streakBonusPoints}{" "}
                                          streak • max{" "}
                                          {scoringRule.maxDailyPoints}
                                        </div>
                                      </div>
                                    </TableCell>
                                    {userRole === "parent" && (
                                      <TableCell>
                                        <div className="flex gap-1">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                              setEditingActivity(activity)
                                            }
                                          >
                                            <Edit className="h-3 w-3" />
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                              setDeletingActivity(activity)
                                            }
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </TableCell>
                                    )}
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                          {group !==
                            groupedActivities[groupedActivities.length - 1]
                              ?.group && <Separator className="mt-4" />}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reports" className="space-y-6">
              {pendingReports.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" /> Report Approval
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {pendingReports.map(report => (
                        <ReportApprovalCard
                          key={report.id}
                          report={report}
                          kid={kid}
                          onReview={rid => {
                            const r = kid.reports?.find(rr => rr.id === rid);
                            setReviewingReport(r || null);
                          }}
                          onEdit={rid => {
                            const r = kid.reports?.find(rr => rr.id === rid);
                            setEditingReport(r || null);
                          }}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" /> Recent Reports
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!kid.reports ||
                  kid.reports.filter(r => r.status !== "pending").length ===
                    0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No processed reports yet.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {kid.reports
                        .filter(r => r.status !== "pending")
                        .sort(
                          (a, b) =>
                            new Date(b.date).getTime() -
                            new Date(a.date).getTime()
                        )
                        .slice(0, 5)
                        .map(report => (
                          <div
                            key={report.id}
                            className={`p-4 border rounded-lg ${
                              report.status === "pending" ? "bg-muted/30" : ""
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">{report.date}</h4>
                              <div className="flex gap-2">
                                {report.status === "approved" && (
                                  <Badge variant="default">approved</Badge>
                                )}
                                {report.status === "rejected" && (
                                  <Badge variant="destructive">rejected</Badge>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditingReport(report)}
                                  disabled={
                                    userRole === "kid" &&
                                    report.status === "approved"
                                  }
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setDeletingReport(report)}
                                  disabled={
                                    userRole === "kid" &&
                                    report.status === "approved"
                                  }
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            {report.notes && (
                              <p className="text-sm text-muted-foreground mb-2">
                                {report.notes}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-2">
                              {report.entries.map(entry => {
                                const activity = kid.activities?.find(
                                  a => a.id === entry.activityId
                                );
                                return activity ? (
                                  <Badge
                                    key={entry.activityId}
                                    variant="secondary"
                                  >
                                    {activity.name}: {entry.value}{" "}
                                    {activity.unit || ""}
                                  </Badge>
                                ) : null;
                              })}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            {activeTab === "leaderboard" && userRole === "kid" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" /> Leaderboard
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {leaderboardLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading
                      leaderboard...
                    </div>
                  ) : leaderboardKids.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      No data yet.
                    </p>
                  ) : (
                    <ul className="divide-y">
                      {leaderboardKids.map((k, i) => (
                        <li
                          key={k.id}
                          className="py-2 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            {(() => {
                              const rankCircleCls =
                                "h-8 w-8 rounded-full border flex items-center justify-center text-xs font-medium bg-muted/40"; // extracted to avoid linter complaining inline
                              return (
                                <div className={rankCircleCls}>{i + 1}</div>
                              );
                            })()}
                            <span className="font-medium">{k.name}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {k.points} pts{" "}
                            {k.goal ? (
                              <span className="ml-1">/ {k.goal}</span>
                            ) : null}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            )}
          </Tabs>
          {/* Overview Cards */}
          <div className={overviewGridCls}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Current Points
                </CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kid.points}</div>
                <p className="text-xs text-muted-foreground">
                  {kid.goal - kid.points} left to goal
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Achievements
                </CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {kid.achievements?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">Badges earned</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Streaks
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Object.values(kid.streaks || {}).filter(s => s > 0).length}
                </div>
                <p className="text-xs text-muted-foreground">Current streaks</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Reports
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {pendingReports.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Awaiting approval
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modals */}
      {/* Add Metric Dialog */}
      <Dialog open={openAddActivity} onOpenChange={setOpenAddActivity}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Activity</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="m-name">Activity name</Label>
              <Input
                id="m-name"
                value={activityName}
                onChange={e => setActivityName(e.target.value)}
                placeholder="e.g., Reading minutes"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="m-unit">Unit (optional)</Label>
              <Input
                id="m-unit"
                value={activityUnit}
                onChange={e => setActivityUnit(e.target.value)}
                placeholder="e.g., min, pages"
              />
            </div>
            <div className="grid gap-2">
              <Label>Plan type</Label>
              <Select
                value={planType}
                onValueChange={v => setPlanType(v as "daily" | "weekly")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="m-plan">Plan value</Label>
              <Input
                id="m-plan"
                type="number"
                min={0}
                value={planValue}
                onChange={e => setPlanValue(e.target.value)}
                placeholder="e.g., 30"
              />
            </div>
            <div className="grid gap-2">
              <Label>Group</Label>
              <Select
                value={activityGroupId || "none"}
                onValueChange={v => setActivityGroupId(v === "none" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {(kid.groups || []).map(g => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className={scoringRulesBoxCls}>
              <h4 className="font-medium text-sm">Scoring Rules</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <Label
                    htmlFor="new-base-points"
                    className="text-xs text-muted-foreground"
                  >
                    Base Points per {activityUnit || "unit"}
                  </Label>
                  <Input
                    id="new-base-points"
                    type="number"
                    min="0"
                    value={newBasePointsPerUnit}
                    onChange={e => setNewBasePointsPerUnit(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="new-goal-bonus"
                    className="text-xs text-muted-foreground"
                  >
                    Goal Bonus Points
                  </Label>
                  <Input
                    id="new-goal-bonus"
                    type="number"
                    min="0"
                    value={newGoalBonusPoints}
                    onChange={e => setNewGoalBonusPoints(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="new-streak-bonus"
                    className="text-xs text-muted-foreground"
                  >
                    Streak Bonus Points
                  </Label>
                  <Input
                    id="new-streak-bonus"
                    type="number"
                    min="0"
                    value={newStreakBonusPoints}
                    onChange={e => setNewStreakBonusPoints(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="new-max-daily"
                    className="text-xs text-muted-foreground"
                  >
                    Max Daily Points
                  </Label>
                  <Input
                    id="new-max-daily"
                    type="number"
                    min="1"
                    value={newMaxDailyPoints}
                    onChange={e => setNewMaxDailyPoints(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Complete your {planType} goal of {planValue}{" "}
                {activityUnit || "units"} to earn the goal bonus. Maintain
                streaks for additional points!
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={addActivity}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Group Dialog */}
      <Dialog open={openAddGroup} onOpenChange={setOpenAddGroup}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="g-name">Name</Label>
              <Input
                id="g-name"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                placeholder="e.g., Reading Goals"
              />
            </div>
            <div className="grid gap-2">
              <Label>Type</Label>
              <Select
                value={groupType}
                onValueChange={v => setGroupType(v as "project" | "goal")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="project">Project</SelectItem>
                  <SelectItem value="goal">Goal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={addGroup}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Report Dialog */}
      <Dialog open={openAddReport} onOpenChange={setOpenAddReport}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Daily Report</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <DailyReportForm
              kid={{
                id: kid.id,
                name: kid.name,
                activities:
                  kid.activities?.map(({ id, name, unit, groupId }) => ({
                    id,
                    name,
                    unit,
                    groupId,
                  })) || [],
                groups: kid.groups || [],
              }}
              onSave={report => {
                addReport({
                  date: report.date,
                  notes: report.notes,
                  entries: report.entries,
                });
                setOpenAddReport(false);
              }}
              onSaveRef={reportSaveRef}
            />
          </div>
          <DialogFooter>
            <Button onClick={() => reportSaveRef.current?.()}>
              <Save className="mr-2 h-4 w-4" /> Save Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Metric Modal */}
      <EditActivityModal
        activity={editingActivity}
        groups={kid.groups || []}
        isOpen={!!editingActivity}
        onClose={() => setEditingActivity(null)}
        onSave={updateActivity}
        kidId={id || ""}
      />

      {/* Review Report Modal */}
      <ReviewReportModal
        report={reviewingReport}
        kid={kid}
        isOpen={!!reviewingReport}
        onClose={() => setReviewingReport(null)}
        onApprove={(reportId, updates) => {
          if (updates) {
            updateReport(reportId, updates);
          }
          approveReport(reportId);
          setReviewingReport(null);
        }}
        onReject={reportId => {
          rejectReport(reportId);
          setReviewingReport(null);
        }}
        onSave={(reportId, updates) => {
          updateReport(reportId, updates);
          setReviewingReport(null);
        }}
        userRole={userRole}
      />

      {/* Edit Report Modal */}
      <EditReportModal
        report={editingReport}
        kid={kid}
        isOpen={!!editingReport}
        onClose={() => setEditingReport(null)}
        onSave={updateReport}
      />

      {/* Delete Activity Confirmation Dialog */}
      <Dialog
        open={!!deletingActivity}
        onOpenChange={() => setDeletingActivity(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Activity</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the activity "
              {deletingActivity?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingActivity(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deletingActivity) {
                  removeActivity(deletingActivity.id);
                  setDeletingActivity(null);
                }
              }}
            >
              Delete Activity
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Report Confirmation Dialog */}
      <Dialog
        open={!!deletingReport}
        onOpenChange={() => setDeletingReport(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Report</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this report from{" "}
              {deletingReport?.date}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingReport(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deletingReport) {
                  deleteReport(deletingReport.id);
                  setDeletingReport(null);
                }
              }}
            >
              Delete Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Prize Management Dialog */}
      <Dialog open={showManagement} onOpenChange={setShowManagement}>
        <DialogContent className={giftDialogContentCls}>
          <DialogHeader>
            <DialogTitle>Gift Management</DialogTitle>
          </DialogHeader>
          <GiftManagement
            kid={kid}
            onAddGift={addGift}
            onUpdateGift={updateGift}
            onDeleteGift={deleteGift}
            onUpdateRedemption={updateRedemption}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// NEW SidebarItem component (inline for simplicity)
function SidebarNavItem({
  label,
  icon: Icon,
  active,
  onClick,
  badge,
  badgeVariant,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
  onClick?: () => void;
  badge?: number;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md text-sm border transition-colors ${
        active
          ? "bg-primary text-primary-foreground border-primary shadow"
          : "hover:bg-muted border-transparent"
      }`}
    >
      <span className="flex items-center gap-2">
        <Icon className="h-4 w-4" /> {label}
      </span>
      {badge !== undefined && badge > 0 && (
        <Badge variant={badgeVariant || "default"} className="ml-auto">
          {badge}
        </Badge>
      )}
    </button>
  );
}
