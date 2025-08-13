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
import { ArrowLeft, Plus, Save, Edit, Trash2, BarChart3, Users, Calendar, Target, Gift, Award, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEnhancedKid } from "@/hooks/useEnhancedKid";
import DailyReportForm from "@/components/kid/DailyReportForm";
import EditMetricModal from "@/components/kid/EditMetricModal";
import { ScoreDashboard } from "@/components/score/ScoreDashboard";
import { PrizeShop } from "@/components/prize/PrizeShop";
import { PrizeManagement } from "@/components/prize/PrizeManagement";

// Legacy types for compatibility
export type Metric = { id: string; name: string; value: number; unit?: string; groupId?: string; planType?: "daily" | "weekly"; planValue?: number };
export type Group = { id: string; name: string; type: "project" | "goal" };
export type DailyReportEntry = { metricId: string; value: number };
export type DailyReport = { id: string; date: string; createdAt: string; notes?: string; entries: DailyReportEntry[] };

export default function KidDashboard() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { 
    kid, 
    addReport, 
    addPrize, 
    updatePrize, 
    deletePrize, 
    redeemPrize, 
    updateRedemption,
    updateKid 
  } = useEnhancedKid(id || "");

  const [metricName, setMetricName] = useState("");
  const [metricUnit, setMetricUnit] = useState("");
  const [planType, setPlanType] = useState<"daily" | "weekly">("daily");
  const [planValue, setPlanValue] = useState("");
  const [metricGroupId, setMetricGroupId] = useState<string>("");
  const [groupName, setGroupName] = useState("");
  const [groupType, setGroupType] = useState<"project" | "goal">("goal");
  const [showManagement, setShowManagement] = useState(false);
  const [editingMetric, setEditingMetric] = useState<any>(null);

  const [openAddGroup, setOpenAddGroup] = useState(false);
  const [openAddMetric, setOpenAddMetric] = useState(false);
  const [openAddReport, setOpenAddReport] = useState(false);
  const reportSaveRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    document.title = kid ? `${kid.name} Dashboard – Kids Tracker` : "Kid Dashboard – Kids Tracker";
  }, [kid]);

  // Keep the legacy updateKid function for existing metric/group operations
  const updateKidLegacy = (updater: (k: any) => any) => {
    if (!kid) return;
    updateKid(updater);
  };

  const addMetric = () => {
    if (!metricName.trim()) return;
    const metric: any = {
      id: crypto.randomUUID(),
      name: metricName,
      value: 0,
      unit: metricUnit || undefined,
      groupId: metricGroupId || undefined,
      planType,
      planValue: planValue ? parseInt(planValue) : undefined,
    };
    updateKidLegacy((k) => ({ ...k, metrics: [...(k.metrics ?? []), metric] }));
    setMetricName("");
    setMetricUnit("");
    setPlanValue("");
    setMetricGroupId("");
    setOpenAddMetric(false);
    toast({ title: "Metric added", description: `${metricName} has been added.` });
  };

  const updateMetric = (updatedMetric: any) => {
    updateKidLegacy((k) => ({
      ...k,
      metrics: k.metrics?.map((m) => (m.id === updatedMetric.id ? updatedMetric : m)),
    }));
    toast({ title: "Metric updated", description: `${updatedMetric.name} has been updated.` });
  };

  const removeMetric = (metricId: string) => {
    const metricName = kid?.metrics?.find((m) => m.id === metricId)?.name || "";
    updateKidLegacy((k) => ({ ...k, metrics: k.metrics?.filter((m) => m.id !== metricId) }));
    toast({ title: "Metric removed", description: `${metricName} has been removed.` });
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
      metrics: k.metrics?.map((m) => (m.groupId === groupId ? { ...m, groupId: undefined } : m)),
    }));
    toast({ title: "Group removed", description: `${groupName} group has been removed.` });
  };

  const groupedMetrics = useMemo(() => {
    if (!kid?.metrics) return [];
    const groups = kid.groups || [];
    const ungrouped = kid.metrics.filter(m => !m.groupId);
    const result = [];
    
    if (ungrouped.length > 0) {
      result.push({ group: null, metrics: ungrouped });
    }
    
    groups.forEach(group => {
      const groupMetrics = kid.metrics?.filter(m => m.groupId === group.id) || [];
      if (groupMetrics.length > 0) {
        result.push({ group, metrics: groupMetrics });
      }
    });
    
    return result;
  }, [kid?.metrics, kid?.groups]);

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
          <Button onClick={() => setShowManagement(true)} variant="outline">
            <Settings className="mr-2 h-4 w-4" /> Manage Prizes
          </Button>
          <Button onClick={() => setOpenAddGroup(true)} variant="outline">
            <Plus className="mr-2 h-4 w-4" /> Add group
          </Button>
          <Button onClick={() => setOpenAddMetric(true)} variant="outline">
            <Plus className="mr-2 h-4 w-4" /> Add metric
          </Button>
          <Button onClick={() => setOpenAddReport(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add report
          </Button>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="scores">Scores</TabsTrigger>
          <TabsTrigger value="shop">Prize Shop</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kid.totalPointsEarned || 0}</div>
                <p className="text-xs text-muted-foreground">Lifetime points</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="scores">
          <ScoreDashboard kid={kid} />
        </TabsContent>

        <TabsContent value="shop">
          <PrizeShop kid={kid} onRedeemPrize={redeemPrize} />
        </TabsContent>

        <TabsContent value="metrics" className="space-y-6">
          {/* Metrics Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!kid.metrics || kid.metrics.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No metrics configured. Add a metric to start tracking progress.
                </p>
              ) : (
                <div className="space-y-6">
                  {groupedMetrics.map(({ group, metrics }) => (
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
                            <TableHead>Metric</TableHead>
                            <TableHead>Current</TableHead>
                            <TableHead>Plan</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {metrics.map((metric) => (
                            <TableRow key={metric.id}>
                              <TableCell className="font-medium">{metric.name}</TableCell>
                              <TableCell>
                                {metric.value} {metric.unit || ""}
                              </TableCell>
                              <TableCell>
                                {metric.planValue ? (
                                  <Badge variant="outline">
                                    {metric.planValue} {metric.unit || ""} {metric.planType}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground">No plan</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditingMetric(metric)}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeMetric(metric.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {group !== groupedMetrics[groupedMetrics.length - 1]?.group && <Separator className="mt-4" />}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          {/* Recent Reports */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Recent Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!kid.reports || kid.reports.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No reports yet. Add a report to start tracking daily progress.
                </p>
              ) : (
                <div className="space-y-3">
                  {kid.reports
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 5)
                    .map((report) => (
                      <div key={report.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{report.date}</h4>
                          <Badge variant="outline">
                            {report.entries.length} metrics
                          </Badge>
                        </div>
                        {report.notes && (
                          <p className="text-sm text-muted-foreground mb-2">{report.notes}</p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {report.entries.map((entry) => {
                            const metric = kid.metrics?.find((m) => m.id === entry.metricId);
                            return metric ? (
                              <Badge key={entry.metricId} variant="secondary">
                                {metric.name}: {entry.value} {metric.unit || ""}
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
      <Dialog open={openAddMetric} onOpenChange={setOpenAddMetric}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Metric</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="m-name">Metric name</Label>
              <Input id="m-name" value={metricName} onChange={(e) => setMetricName(e.target.value)} placeholder="e.g., Reading minutes" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="m-unit">Unit (optional)</Label>
              <Input id="m-unit" value={metricUnit} onChange={(e) => setMetricUnit(e.target.value)} placeholder="e.g., min, pages" />
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
              <Select value={metricGroupId || "none"} onValueChange={(v) => setMetricGroupId(v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {(kid.groups || []).map((g) => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                   ))}
                 </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={addMetric}>Save</Button>
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
                metrics: kid.metrics?.map(({ id, name, unit, groupId }) => ({ id, name, unit, groupId })) || [], 
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
      <EditMetricModal
        metric={editingMetric}
        groups={kid.groups || []}
        isOpen={!!editingMetric}
        onClose={() => setEditingMetric(null)}
        onSave={updateMetric}
      />

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
