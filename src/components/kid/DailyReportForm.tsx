import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

// Local types mirroring pages for minimal coupling
export type DailyReportEntry = { metricId: string; value: number };
export type DailyReport = {
  id: string;
  date: string; // YYYY-MM-DD
  createdAt: string; // ISO timestamp when saved
  notes?: string;
  entries: DailyReportEntry[];
};

export type Metric = { id: string; name: string; unit?: string; groupId?: string };
export type Group = { id: string; name: string; type: "project" | "goal" };

export type KidLike = {
  id: string;
  name: string;
  metrics?: Metric[];
  groups?: Group[];
  reports?: DailyReport[];
};

function formatYMD(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

export function DailyReportForm({ kid, onSave, onSaveRef }: { kid: KidLike; onSave: (report: DailyReport) => void; onSaveRef?: React.MutableRefObject<(() => void) | null> }) {
  const [date, setDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState("");
  const [values, setValues] = useState<Record<string, number>>(() => {
    const v: Record<string, number> = {};
    (kid.metrics ?? []).forEach((m) => (v[m.id] = 0));
    return v;
  });

  const metrics = kid.metrics ?? [];
  const groups = kid.groups ?? [];

  const sections = useMemo(() => {
    const ungrouped = metrics.filter((m) => !m.groupId);
    const result: { id: string; title: string; items: typeof metrics }[] = [];
    if (ungrouped.length > 0) result.push({ id: "__ungrouped__", title: "Ungrouped", items: ungrouped });
    for (const g of groups) {
      const items = metrics.filter((m) => m.groupId === g.id);
      if (items.length > 0) result.push({ id: g.id, title: `${g.name} (${g.type})`, items });
    }
    return result;
  }, [metrics, groups]);

  const handleChange = (metricId: string, val: string) => {
    const n = Math.max(0, Number(val || 0));
    setValues((prev) => ({ ...prev, [metricId]: Number.isFinite(n) ? n : 0 }));
  };

  const handleSave = () => {
    const payload: DailyReport = {
      id: crypto.randomUUID(),
      date: formatYMD(date),
      createdAt: new Date().toISOString(),
      notes: notes.trim() || undefined,
      entries: metrics.map((m) => ({ metricId: m.id, value: Number(values[m.id] ?? 0) })),
    };
    onSave(payload);
    toast({ title: "Report saved", description: `${kid.name}'s daily report was saved.` });
    // reset values after save
    setNotes("");
    setValues((prev) => {
      const next: Record<string, number> = {};
      (kid.metrics ?? []).forEach((m) => (next[m.id] = 0));
      return next;
    });
  };

  useEffect(() => {
    if (onSaveRef) {
      onSaveRef.current = handleSave;
    }
  }, [onSaveRef, handleSave]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="grid gap-2">
          <Label>Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("w-[240px] justify-start text-left font-normal", !date && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? date.toLocaleDateString() : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => d && setDate(d)}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <Separator />

      {sections.length === 0 ? (
        <p className="text-muted-foreground text-sm">No metrics configured yet. Add metrics above to start reporting.</p>
      ) : (
        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section.id}>
              <h4 className="text-sm font-semibold text-muted-foreground mb-2">{section.title}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {section.items.map((m) => {
                  const value = Number(values[m.id] ?? 0);
                  const scoringRule = {
                    basePointsPerUnit: 1,
                    goalBonusPoints: 5,
                    streakBonusPoints: 2,
                    maxDailyPoints: 50
                  };
                  
                  const basePoints = Math.floor(value * scoringRule.basePointsPerUnit);
                  const meetsGoal = value > 0; // Simple check for now
                  const goalBonus = meetsGoal ? scoringRule.goalBonusPoints : 0;
                  const expectedPoints = Math.min(basePoints + goalBonus, scoringRule.maxDailyPoints);
                  
                  return (
                  <div key={m.id} className="grid gap-2">
                    <Label htmlFor={`metric-${m.id}`} className="flex items-center justify-between">
                      <span>
                        {m.name} {m.unit ? `(${m.unit})` : ""}
                      </span>
                      {value > 0 && (
                        <span className="text-sm font-medium text-primary">
                          {expectedPoints} pts
                        </span>
                      )}
                    </Label>
                    <Input
                      id={`metric-${m.id}`}
                      type="number"
                      min={0}
                      value={values[m.id] ?? 0}
                      onChange={(e) => handleChange(m.id, e.target.value)}
                    />
                    {value > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {basePoints} base pts
                        {meetsGoal && ` + ${goalBonus} goal bonus`}
                        {` + ${scoringRule.streakBonusPoints} possible streak bonus`}
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-2">
        <Label htmlFor="report-notes">Notes (optional)</Label>
        <Input
          id="report-notes"
          placeholder="Highlights from today..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
    </div>
  );
}

export default DailyReportForm;
