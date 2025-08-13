import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Save, Edit } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import DailyReportForm from "@/components/kid/DailyReportForm";
import EditMetricModal from "@/components/kid/EditMetricModal";

// Types mirrored from Index page, extended with optional notes and metrics
export type Metric = { id: string; name: string; value: number; unit?: string; groupId?: string; planType?: "daily" | "weekly"; planValue?: number };
export type Group = { id: string; name: string; type: "project" | "goal" };
export type DailyReportEntry = { metricId: string; value: number };
export type DailyReport = { id: string; date: string; createdAt: string; notes?: string; entries: DailyReportEntry[] };
export type Kid = {
  id: string;
  name: string;
  points: number;
  goal: number;
  color: string; // hsl string
  createdAt: string;
  notes?: string;
  metrics?: Metric[];
  groups?: Group[];
  reports?: DailyReport[];
};

const KidDashboard = () => {
  const { id } = useParams();
  const [kids, setKids] = useLocalStorage<Kid[]>("family-kids", []);
  const kid = useMemo(() => kids.find((k) => k.id === id), [kids, id]);
  console.log("KidDashboard render", { routeId: id, kidFound: !!kid, metrics: kid?.metrics?.length ?? 0, groups: kid?.groups?.length ?? 0 });

  const [noteDraft, setNoteDraft] = useState<string>(kid?.notes ?? "");
  const [metricName, setMetricName] = useState("");
  const [metricUnit, setMetricUnit] = useState("");
  const [metricPlanType, setMetricPlanType] = useState<"" | "daily" | "weekly">("");
  const [metricPlanValue, setMetricPlanValue] = useState<string>("");
  const [groupName, setGroupName] = useState("");
  const [groupType, setGroupType] = useState<"project" | "goal">("project");
  const [metricGroupId, setMetricGroupId] = useState<string>("");
  const [editingMetric, setEditingMetric] = useState<Metric | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    document.title = kid ? `${kid.name} Dashboard – Kids Tracker` : "Kid Dashboard – Kids Tracker";
  }, [kid]);

  useEffect(() => {
    // keep textarea in sync if kid changes
    setNoteDraft(kid?.notes ?? "");
  }, [kid?.notes]);

  const updateKid = (updater: (k: Kid) => Kid) => {
    if (!kid) return;
    setKids((prev) => prev.map((k) => (k.id === kid.id ? updater(k) : k)));
  };

  const saveNotes = () => {
    updateKid((k) => ({ ...k, notes: noteDraft }));
    toast({ title: "Notes saved", description: "Your notes were saved for this kid." });
  };

  const addGroup = () => {
    const name = groupName.trim();
    if (!name) return;
    updateKid((k) => ({
      ...k,
      groups: [
        ...(k.groups ?? []),
        { id: crypto.randomUUID(), name, type: groupType },
      ],
    }));
    setGroupName("");
    setGroupType("project");
  };

  const addMetric = () => {
    const name = metricName.trim();
    if (!name) return;
    const planValNum = Number(metricPlanValue);
    updateKid((k) => ({
      ...k,
      metrics: [
        ...(k.metrics ?? []),
        {
          id: crypto.randomUUID(),
          name,
          value: 0,
          unit: metricUnit.trim() || undefined,
          groupId: metricGroupId || undefined,
          planType: metricPlanType || undefined,
          planValue: Number.isFinite(planValNum) && planValNum > 0 ? planValNum : undefined,
        },
      ],
    }));
    setMetricName("");
    setMetricUnit("");
    setMetricPlanType("");
    setMetricPlanValue("");
    setMetricGroupId("");
  };

  const updateMetric = (updatedMetric: Metric) => {
    updateKid((k) => ({
      ...k,
      metrics: (k.metrics ?? []).map((m) => (m.id === updatedMetric.id ? updatedMetric : m)),
    }));
    toast({ title: "Metric updated", description: "Your metric has been updated successfully." });
  };

  const editMetric = (metric: Metric) => {
    setEditingMetric(metric);
    setIsEditModalOpen(true);
  };


  const removeMetric = (mid: string) => {
    updateKid((k) => ({ ...k, metrics: (k.metrics ?? []).filter((m) => m.id !== mid) }));
  };

  if (!kid) {
    return (
      <main className="container py-8">
        <Button asChild variant="ghost">
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back Home
          </Link>
        </Button>
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Kid not found</CardTitle>
          </CardHeader>
          <CardContent>
            The kid you are looking for doesn't exist. Please return to the home page.
          </CardContent>
        </Card>
      </main>
    );
  }

  const metrics = kid.metrics ?? [];
  const groups = kid.groups ?? [];
  const sections = useMemo(() => {
    const ungrouped = (metrics).filter((m) => !m.groupId);
    const result = [] as { id: string; title: string; items: typeof metrics }[];
    if (ungrouped.length > 0) result.push({ id: "__ungrouped__", title: "Ungrouped", items: ungrouped });
    for (const g of groups) {
      const items = metrics.filter((m) => m.groupId === g.id);
      if (items.length > 0) result.push({ id: g.id, title: `${g.name} (${g.type})`, items });
    }
    return result;
  }, [metrics, groups]);

  return (
    <main className="container py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kid Dashboard: {kid.name}</h1>
          <p className="text-muted-foreground mt-1">Track custom metrics, daily reports, and keep notes.</p>
        </div>
        <Button asChild variant="outline">
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" /> Home
          </Link>
        </Button>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3 mb-4 items-end">
              <div className="grid gap-2">
                <Label htmlFor="m-name">Metric name</Label>
                <Input id="m-name" value={metricName} onChange={(e) => setMetricName(e.target.value)} placeholder="e.g., Reading minutes" className="w-56" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="m-unit">Unit (optional)</Label>
                <Input id="m-unit" value={metricUnit} onChange={(e) => setMetricUnit(e.target.value)} placeholder="e.g., min, pages" className="w-40" />
              </div>
              <div className="grid gap-2">
                <Label>Plan type</Label>
                <Select value={metricPlanType || "none"} onValueChange={(v) => setMetricPlanType(v === "none" ? "" : (v as any))}>
                  <SelectTrigger className="w-32"><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="m-plan">Plan value</Label>
                <Input id="m-plan" type="number" min={0} value={metricPlanValue} onChange={(e) => setMetricPlanValue(e.target.value)} placeholder="e.g., 30" className="w-28" />
              </div>
              <div className="grid gap-2">
                <Label>Group</Label>
                <Select value={metricGroupId || "none"} onValueChange={(v) => setMetricGroupId(v === "none" ? "" : v)}>
                  <SelectTrigger className="w-44"><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="self-end">
                <Button onClick={addMetric}><Plus className="mr-2 h-4 w-4" /> Add metric</Button>
              </div>
              <Separator orientation="vertical" className="h-8" />
              <div className="grid gap-2">
                <Label htmlFor="g-name">New group</Label>
                <Input id="g-name" value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="e.g., Reading Goals" className="w-56" />
              </div>
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select value={groupType} onValueChange={(v) => setGroupType(v as any)}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="project">Project</SelectItem>
                    <SelectItem value="goal">Goal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="self-end">
                <Button variant="secondary" onClick={addGroup}><Plus className="mr-2 h-4 w-4" /> Add group</Button>
              </div>
            </div>

            {metrics.length === 0 ? (
              <p className="text-muted-foreground">No metrics yet. Add your first custom metric above.</p>
            ) : (
              <div className="space-y-6">
                {sections.map((section) => (
                  <div key={section.id}>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">{section.title}</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead className="w-32">Value</TableHead>
                          <TableHead className="w-24">Unit</TableHead>
                          <TableHead className="w-28">Plan</TableHead>
                          <TableHead className="w-40">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {section.items.map((m) => (
                          <TableRow key={m.id}>
                            <TableCell className="font-medium">{m.name}</TableCell>
                            <TableCell>{m.value}</TableCell>
                            <TableCell>{m.unit ?? "-"}</TableCell>
                            <TableCell>{m.planValue && m.planType ? `${m.planValue}/${m.planType === "daily" ? "day" : "week"}` : "—"}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button size="sm" variant="outline" onClick={() => editMetric(m)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="destructive">Delete</Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete metric?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the metric "{m.name}".
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => removeMetric(m.id)}>Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} placeholder="Write notes, highlights, or reminders..." className="min-h-[220px]" />
            <div className="mt-3 flex justify-end">
              <Button onClick={saveNotes}><Save className="mr-2 h-4 w-4" /> Save Notes</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily Report</CardTitle>
          </CardHeader>
          <CardContent>
            <DailyReportForm
              kid={{ id: kid.id, name: kid.name, metrics: metrics.map(({ id, name, unit, groupId }) => ({ id, name, unit, groupId })), groups }}
              onSave={(report) => updateKid((k) => ({ ...k, reports: [...(k.reports ?? []), report] }))}
            />
          </CardContent>
        </Card>
      </section>

      <Separator className="my-8" />

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            <p>
              Points: <span className="font-medium text-foreground">{kid.points}</span> · Goal: {kid.goal > 0 ? kid.goal : "—"}
            </p>
            <p className="mt-1">Created: {new Date(kid.createdAt).toLocaleString()}</p>
          </CardContent>
        </Card>
      </section>

      <EditMetricModal
        metric={editingMetric}
        groups={groups}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingMetric(null);
        }}
        onSave={updateMetric}
      />
    </main>
  );
};

export default KidDashboard;
