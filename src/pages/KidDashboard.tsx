import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Minus, Plus, Save } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

// Types mirrored from Index page, extended with optional notes and metrics
export type Metric = { id: string; name: string; value: number; unit?: string };
export type Kid = {
  id: string;
  name: string;
  points: number;
  goal: number;
  color: string; // hsl string
  createdAt: string;
  notes?: string;
  metrics?: Metric[];
};

const KidDashboard = () => {
  const { id } = useParams();
  const [kids, setKids] = useLocalStorage<Kid[]>("family-kids", []);
  const kid = useMemo(() => kids.find((k) => k.id === id), [kids, id]);

  const [noteDraft, setNoteDraft] = useState<string>(kid?.notes ?? "");
  const [metricName, setMetricName] = useState("");
  const [metricUnit, setMetricUnit] = useState("");

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

  const addMetric = () => {
    const name = metricName.trim();
    if (!name) return;
    updateKid((k) => ({
      ...k,
      metrics: [
        ...(k.metrics ?? []),
        { id: crypto.randomUUID(), name, value: 0, unit: metricUnit.trim() || undefined },
      ],
    }));
    setMetricName("");
    setMetricUnit("");
  };

  const changeMetric = (mid: string, delta: number) => {
    updateKid((k) => ({
      ...k,
      metrics: (k.metrics ?? []).map((m) => (m.id === mid ? { ...m, value: Math.max(0, m.value + delta) } : m)),
    }));
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

  return (
    <main className="container py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kid Dashboard: {kid.name}</h1>
          <p className="text-muted-foreground mt-1">Track custom metrics and keep notes.</p>
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
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="grid gap-2">
                <Label htmlFor="m-name">Metric name</Label>
                <Input id="m-name" value={metricName} onChange={(e) => setMetricName(e.target.value)} placeholder="e.g., Reading minutes" className="w-56" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="m-unit">Unit (optional)</Label>
                <Input id="m-unit" value={metricUnit} onChange={(e) => setMetricUnit(e.target.value)} placeholder="e.g., min, pages" className="w-40" />
              </div>
              <div className="self-end">
                <Button onClick={addMetric}><Plus className="mr-2 h-4 w-4" /> Add metric</Button>
              </div>
            </div>

            {metrics.length === 0 ? (
              <p className="text-muted-foreground">No metrics yet. Add your first custom metric above.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="w-32">Value</TableHead>
                    <TableHead className="w-24">Unit</TableHead>
                    <TableHead className="w-56">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.name}</TableCell>
                      <TableCell>{m.value}</TableCell>
                      <TableCell>{m.unit ?? "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="secondary" onClick={() => changeMetric(m.id, -1)}><Minus className="h-4 w-4" /></Button>
                          <Button size="sm" onClick={() => changeMetric(m.id, +1)}><Plus className="h-4 w-4" /></Button>
                          <Button size="sm" variant="outline" onClick={() => removeMetric(m.id)}>Remove</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
    </main>
  );
};

export default KidDashboard;
