import { useEffect, useMemo, useState, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Save, Edit, Trash2, BarChart3, Users, Calendar, Target, Gift, Award, Coins, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEnhancedKidDB } from "@/hooks/useEnhancedKidDB";
import { AuthGuard } from "@/components/auth/AuthGuard";
import DailyReportForm from "@/components/kid/DailyReportForm";
import EditActivityModal from "@/components/kid/EditActivityModal";
import { ReportApprovalCard } from "@/components/kid/ReportApprovalCard";
import { EditReportModal } from "@/components/kid/EditReportModal";
import { ReviewReportModal } from "@/components/kid/ReviewReportModal";
import { ScoreDashboard } from "@/components/score/ScoreDashboard";
import { PrizeShop } from "@/components/prize/PrizeShop";
import { PrizeManagement } from "@/components/prize/PrizeManagement";

// Legacy types for compatibility (UPDATED FOR ACTIVITIES)
export type Activity = { id: string; name: string; value: number; unit?: string; groupId?: string; planType?: "daily" | "weekly"; planValue?: number };
export type Group = { id: string; name: string; type: "project" | "goal" };
export type DailyReportEntry = { activityId: string; value: number };
export type DailyReport = { id: string; date: string; createdAt: string; notes?: string; entries: DailyReportEntry[]; status?: "pending" | "approved" | "rejected"; processedAt?: string; processedBy?: "parent" | "system" };

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
  const { 
    kid, 
    loading,
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
    updateKid,
    updateActivityScoringRule
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
  const [editingActivity, setEditingActivity] = useState<any>(null);
  const [editingReport, setEditingReport] = useState<any>(null);
  const [reviewingReport, setReviewingReport] = useState<any>(null);
  const [deletingReport, setDeletingReport] = useState<any>(null);

  const [openAddGroup, setOpenAddGroup] = useState(false);
  const [openAddActivity, setOpenAddActivity] = useState(false);
  const [openAddReport, setOpenAddReport] = useState(false);
  const reportSaveRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    document.title = kid ? `${kid.name} Dashboard – Kids Tracker` : "Kid Dashboard – Kids Tracker";
  }, [kid]);

  // Keep the legacy updateKid function for existing metric/group operations - now using database
  const updateKidLegacy = async (updater: (k: any) => any) => {
    if (!kid) return;
    
    // For now, activities and groups will be handled locally until we add them to database
    // Since we don't have direct setKid access, we'll use the updateKid function
    const updatedKid = updater(kid);
    
    // Use the database updateKid function to persist changes
    await updateKid(() => updatedKid);
  };

  const addActivity = async () => {
    if (!activityName.trim()) return;
    const activity: any = {
      id: crypto.randomUUID(),
      name: activityName,
      value: 0,
      unit: activityUnit || undefined,
      groupId: activityGroupId || undefined,
      planType,
      planValue: planValue ? parseInt(planValue) : undefined,
    };
    
    // Create scoring rule for the new activity
    const scoringRule = {
      activityId: activity.id,
      basePointsPerUnit: Math.max(0, Number(newBasePointsPerUnit) || 1),
      goalBonusPoints: Math.max(0, Number(newGoalBonusPoints) || 0),
      streakBonusPoints: Math.max(0, Number(newStreakBonusPoints) || 0),
      maxDailyPoints: Math.max(1, Number(newMaxDailyPoints) || 50),
    };
    
    updateKidLegacy((k) => ({ ...k, activities: [...(k.activities ?? []), activity] }));
    
    // Add scoring rule to database
    if (updateActivityScoringRule) {
      await updateActivityScoringRule(activity.id, scoringRule);
    }
    
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
    toast({ title: "Activity added", description: `${activityName} has been added.` });
  };

  const updateActivity = (updatedActivity: any) => {
    updateKidLegacy((k) => ({
      ...k,
      activities: k.activities?.map((a) => (a.id === updatedActivity.id ? updatedActivity : a)),
    }));
    toast({ title: "Activity updated", description: `${updatedActivity.name} has been updated.` });
  };

  const removeActivity = (activityId: string) => {
    const activityName = kid?.activities?.find((a) => a.id === activityId)?.name || "";
    updateKidLegacy((k) => ({ ...k, activities: k.activities?.filter((a) => a.id !== activityId) }));
    toast({ title: "Activity removed", description: `${activityName} has been removed.` });
  };

  const addGroup = () => {
    if (!groupName.trim()) return;
    const group: any = { id: crypto.randomUUID(), name: groupName, type: groupType };
    updateKidLegacy((k) => ({ ...k, groups: [...(k.groups ?? []), group] }));
    setGroupName("");
    setOpenAddGroup(false);
    toast({ title: "Group added", description: `${groupName} group has been added.` });
  };

  const removeGroup = (groupId: string) => {
    const groupName = kid?.groups?.find((g) => g.id === groupId)?.name || "";
    updateKidLegacy((k) => ({
      ...k,
      groups: k.groups?.filter((g) => g.id !== groupId),
      activities: k.activities?.map((a) => (a.groupId === groupId ? { ...a, groupId: undefined } : a)),
    }));
    toast({ title: "Group removed", description: `${groupName} group has been removed.` });
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
      const groupActivities = kid.activities?.filter(a => a.groupId === group.id) || [];
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
  const pendingRedemptions = kid?.prizeRedemptions?.filter(r => r.status === "pending").length || 0;

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Loading dashboard data...</p>
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Kids
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{kid.name}</h1>
            <p className="text-muted-foreground">{kid.points} / {kid.goal} points • {kid.totalPointsEarned} total earned</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setOpenAddGroup(true)} variant="outline">
            <Plus className="mr-2 h-4 w-4" /> Add group
          </Button>
          <Button onClick={() => setOpenAddActivity(true)} variant="outline">
            <Plus className="mr-2 h-4 w-4" /> Add activity
          </Button>
          <Button 
            onClick={() => setOpenAddReport(true)} 
            variant="outline"
            className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
          >
            <FileText className="mr-2 h-4 w-4" /> Add report
          </Button>
          <Button 
            onClick={() => setShowManagement(true)} 
            variant="outline" 
            className="relative bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
          >
            <Coins className="mr-2 h-4 w-4" /> Manage Prizes
            {pendingRedemptions > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs animate-pulse"
              >
                {pendingRedemptions}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Points</CardTitle>
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
            <CardTitle className="text-sm font-medium">Achievements</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kid.achievements?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Badges earned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Streaks</CardTitle>
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
            <CardTitle className="text-sm font-medium">Pending Reports</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingReports.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="metrics" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="metrics">Activities</TabsTrigger>
          <TabsTrigger value="reports">
            Reports
            {pendingReports.length > 0 && (
              <Badge variant="destructive" className="ml-1 text-xs">
                {pendingReports.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="shop">Prize Shop</TabsTrigger>
        </TabsList>

        <TabsContent value="shop">
          <PrizeShop kid={kid} onRedeemPrize={redeemPrize} />
        </TabsContent>

        <TabsContent value="metrics" className="space-y-6">
          {/* Metrics Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!kid.activities || kid.activities.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No activities configured. Add an activity to start tracking progress.
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
                            <Badge variant={group.type === "goal" ? "default" : "secondary"}>
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
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                        <TableBody>
                          {activities.map((activity) => {
                            // Get scoring rule from activity or use default
                            const scoringRule = activity.scoringRule || {
                              activityId: activity.id,
                              basePointsPerUnit: 1,
                              goalBonusPoints: 5,
                              streakBonusPoints: 2,
                              maxDailyPoints: 50
                            };
                            
                            const pointsDisplay = `${scoringRule.basePointsPerUnit}${activity.unit ? ` per ${activity.unit}` : ''} (+${scoringRule.goalBonusPoints} goal)`;
                            
                            return (
                            <TableRow key={activity.id}>
                              <TableCell className="font-medium">{activity.name}</TableCell>
                              <TableCell>
                                {activity.value} {activity.unit || ""}
                              </TableCell>
                              <TableCell>
                                {activity.planValue ? (
                                  <Badge variant="outline">
                                    {activity.planValue} {activity.unit || ""} {activity.planType}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground">No plan</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div className="font-medium text-primary">{pointsDisplay}</div>
                                  <div className="text-xs text-muted-foreground">
                                    +{scoringRule.streakBonusPoints} streak • max {scoringRule.maxDailyPoints}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditingActivity(activity)}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeActivity(activity.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                      {group !== groupedActivities[groupedActivities.length - 1]?.group && <Separator className="mt-4" />}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          {/* Report Approval */}
          {pendingReports.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Report Approval
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingReports.map((report) => (
                    <ReportApprovalCard
                      key={report.id}
                      report={report}
                      kid={kid}
                      onReview={(reportId) => {
                        const report = kid.reports?.find(r => r.id === reportId);
                        setReviewingReport(report);
                      }}
                      onEdit={(reportId) => {
                        const report = kid.reports?.find(r => r.id === reportId);
                        setEditingReport(report);
                      }}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Reports */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Recent Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!kid.reports || kid.reports.filter(r => r.status !== "pending").length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No processed reports yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {kid.reports
                    .filter(report => report.status !== "pending")
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 5)
                    .map((report) => (
                      <div key={report.id} className={`p-4 border rounded-lg ${report.status === "pending" ? "bg-muted/30" : ""}`}>
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
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeletingReport(report)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        {report.notes && (
                          <p className="text-sm text-muted-foreground mb-2">{report.notes}</p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {report.entries.map((entry) => {
                            const activity = kid.activities?.find((a) => a.id === entry.activityId);
                            return activity ? (
                              <Badge key={entry.activityId} variant="secondary">
                                {activity.name}: {entry.value} {activity.unit || ""}
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
      </Tabs>

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
              <Input id="m-name" value={activityName} onChange={(e) => setActivityName(e.target.value)} placeholder="e.g., Reading minutes" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="m-unit">Unit (optional)</Label>
              <Input id="m-unit" value={activityUnit} onChange={(e) => setActivityUnit(e.target.value)} placeholder="e.g., min, pages" />
            </div>
            <div className="grid gap-2">
              <Label>Plan type</Label>
              <Select value={planType} onValueChange={(v) => setPlanType(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="m-plan">Plan value</Label>
              <Input id="m-plan" type="number" min={0} value={planValue} onChange={(e) => setPlanValue(e.target.value)} placeholder="e.g., 30" />
            </div>
            <div className="grid gap-2">
              <Label>Group</Label>
              <Select value={activityGroupId || "none"} onValueChange={(v) => setActivityGroupId(v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {(kid.groups || []).map((g) => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                   ))}
                  </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium text-sm">Scoring Rules</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <Label htmlFor="new-base-points" className="text-xs text-muted-foreground">Base Points per {activityUnit || 'unit'}</Label>
                  <Input
                    id="new-base-points"
                    type="number"
                    min="0"
                    value={newBasePointsPerUnit}
                    onChange={(e) => setNewBasePointsPerUnit(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="new-goal-bonus" className="text-xs text-muted-foreground">Goal Bonus Points</Label>
                  <Input
                    id="new-goal-bonus"
                    type="number"
                    min="0"
                    value={newGoalBonusPoints}
                    onChange={(e) => setNewGoalBonusPoints(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="new-streak-bonus" className="text-xs text-muted-foreground">Streak Bonus Points</Label>
                  <Input
                    id="new-streak-bonus"
                    type="number"
                    min="0"
                    value={newStreakBonusPoints}
                    onChange={(e) => setNewStreakBonusPoints(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="new-max-daily" className="text-xs text-muted-foreground">Max Daily Points</Label>
                  <Input
                    id="new-max-daily"
                    type="number"
                    min="1"
                    value={newMaxDailyPoints}
                    onChange={(e) => setNewMaxDailyPoints(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Complete your {planType} goal of {planValue} {activityUnit || 'units'} to earn the goal bonus. 
                Maintain streaks for additional points!
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
              <Input id="g-name" value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="e.g., Reading Goals" />
            </div>
            <div className="grid gap-2">
              <Label>Type</Label>
              <Select value={groupType} onValueChange={(v) => setGroupType(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
                activities: kid.activities?.map(({ id, name, unit, groupId }) => ({ id, name, unit, groupId })) || [], 
                groups: kid.groups || [] 
              }}
              onSave={(report) => {
                addReport({
                  date: report.date,
                  notes: report.notes,
                  entries: report.entries
                });
                setOpenAddReport(false);
              }}
              onSaveRef={reportSaveRef}
            />
          </div>
          <DialogFooter>
            <Button onClick={() => reportSaveRef.current?.()}><Save className="mr-2 h-4 w-4" /> Save Report</Button>
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
        onReject={(reportId) => {
          rejectReport(reportId);
          setReviewingReport(null);
        }}
        onSave={(reportId, updates) => {
          updateReport(reportId, updates);
          setReviewingReport(null);
        }}
      />

      {/* Edit Report Modal */}
      <EditReportModal
        report={editingReport}
        kid={kid}
        isOpen={!!editingReport}
        onClose={() => setEditingReport(null)}
        onSave={updateReport}
      />

      {/* Delete Report Confirmation Dialog */}
      <Dialog open={!!deletingReport} onOpenChange={() => setDeletingReport(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Report</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this report from {deletingReport?.date}? This action cannot be undone.
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
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Prize Management</DialogTitle>
          </DialogHeader>
          <PrizeManagement 
            kid={kid}
            onAddPrize={addPrize}
            onUpdatePrize={updatePrize}
            onDeletePrize={deletePrize}
            onUpdateRedemption={updateRedemption}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
