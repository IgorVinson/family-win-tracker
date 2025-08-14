import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { EnhancedKid } from "@/types/scoreSystem";
import { toast } from "@/hooks/use-toast";

interface Report {
  id: string;
  date: string;
  createdAt: string;
  notes?: string;
  entries: Array<{ activityId: string; value: number }>;
  status: "pending" | "approved" | "rejected";
  processedAt?: string;
  processedBy?: "parent" | "system";
}

interface EditReportModalProps {
  report: Report | null;
  kid: EnhancedKid;
  isOpen: boolean;
  onClose: () => void;
  onSave: (reportId: string, updates: {
    date?: string;
    notes?: string;
    entries?: Array<{ activityId: string; value: number }>;
  }) => void;
}

function formatYMD(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

export function EditReportModal({ report, kid, isOpen, onClose, onSave }: EditReportModalProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState("");
  const [values, setValues] = useState<Record<string, number>>({});

  useEffect(() => {
    if (report) {
      setDate(new Date(report.date));
      setNotes(report.notes || "");
      
      const initialValues: Record<string, number> = {};
      (kid.activities ?? []).forEach((m) => {
        const entry = report.entries.find(e => e.activityId === m.id);
        initialValues[m.id] = entry?.value || 0;
      });
      setValues(initialValues);
    }
  }, [report, kid.activities]);

  const handleChange = (activityId: string, val: string) => {
    const n = Math.max(0, Number(val || 0));
    setValues((prev) => ({ ...prev, [activityId]: Number.isFinite(n) ? n : 0 }));
  };

  const handleSave = () => {
    if (!report) return;

    const updates = {
      date: formatYMD(date),
      notes: notes.trim() || undefined,
      entries: (kid.activities ?? []).map((m) => ({ 
        activityId: m.id, 
        value: Number(values[m.id] ?? 0) 
      })),
    };

    onSave(report.id, updates);
    toast({ 
      title: "Report updated", 
      description: `${kid.name}'s report has been updated and is pending approval.` 
    });
    onClose();
  };

  if (!report) return null;

  const activities = kid.activities ?? [];
  const groups = kid.groups ?? [];

  // Group activities by sections
  const ungrouped = activities.filter((m) => !m.groupId);
  const sections: { id: string; title: string; items: typeof activities }[] = [];
  if (ungrouped.length > 0) sections.push({ id: "__ungrouped__", title: "Ungrouped", items: ungrouped });
  for (const g of groups) {
    const items = activities.filter((m) => m.groupId === g.id);
    if (items.length > 0) sections.push({ id: g.id, title: `${g.name} (${g.type})`, items });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Report</DialogTitle>
        </DialogHeader>
        
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
            <p className="text-muted-foreground text-sm">No activities configured yet.</p>
          ) : (
            <div className="space-y-6">
              {sections.map((section) => (
                <div key={section.id}>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">{section.title}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {section.items.map((m) => (
                      <div key={m.id} className="grid gap-2">
                        <Label htmlFor={`activity-${m.id}`}>
                          {m.name} {m.unit ? `(${m.unit})` : ""}
                        </Label>
                        <Input
                          id={`activity-${m.id}`}
                          type="number"
                          min={0}
                          value={values[m.id] ?? 0}
                          onChange={(e) => handleChange(m.id, e.target.value)}
                        />
                      </div>
                    ))}
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

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} className="flex-1">
              <Save className="h-4 w-4 mr-1" />
              Save Changes
            </Button>
            <Button onClick={onClose} variant="outline" className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}