import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { EnhancedKid } from "@/types/scoreSystem";
import { toast } from "@/hooks/use-toast";

interface Report {
  id: string;
  date: string;
  createdAt: string;
  notes?: string;
  entries: Array<{ metricId: string; value: number }>;
  status: "pending" | "approved" | "rejected";
  processedAt?: string;
  processedBy?: "parent" | "system";
}

interface ReviewReportModalProps {
  report: Report | null;
  kid: EnhancedKid;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (reportId: string, updates?: {
    date?: string;
    notes?: string;
    entries?: Array<{ metricId: string; value: number }>;
  }) => void;
  onReject: (reportId: string) => void;
}

function formatYMD(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

export function ReviewReportModal({ report, kid, isOpen, onClose, onApprove, onReject }: ReviewReportModalProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState("");
  const [values, setValues] = useState<Record<string, number>>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (report) {
      setDate(new Date(report.date));
      setNotes(report.notes || "");
      
      const initialValues: Record<string, number> = {};
      (kid.metrics ?? []).forEach((m) => {
        const entry = report.entries.find(e => e.metricId === m.id);
        initialValues[m.id] = entry?.value || 0;
      });
      setValues(initialValues);
      setHasChanges(false);
    }
  }, [report, kid.metrics]);

  const handleChange = (metricId: string, val: string) => {
    const n = Math.max(0, Number(val || 0));
    setValues((prev) => ({ ...prev, [metricId]: Number.isFinite(n) ? n : 0 }));
    setHasChanges(true);
  };

  const handleNotesChange = (newNotes: string) => {
    setNotes(newNotes);
    setHasChanges(true);
  };

  const handleDateChange = (newDate: Date | undefined) => {
    if (newDate) {
      setDate(newDate);
      setHasChanges(true);
    }
  };

  const handleApprove = () => {
    if (!report) return;

    if (hasChanges) {
      const updates = {
        date: formatYMD(date),
        notes: notes.trim() || undefined,
        entries: (kid.metrics ?? []).map((m) => ({ 
          metricId: m.id, 
          value: Number(values[m.id] ?? 0) 
        })),
      };
      onApprove(report.id, updates);
    } else {
      onApprove(report.id);
    }
    
    toast({ 
      title: "Report approved", 
      description: `${kid.name}'s report has been approved and points awarded.` 
    });
    onClose();
  };

  const handleReject = () => {
    if (!report) return;
    
    onReject(report.id);
    toast({ 
      title: "Report rejected", 
      description: `${kid.name}'s report has been rejected.` 
    });
    onClose();
  };

  if (!report) return null;

  const metrics = kid.metrics ?? [];
  const groups = kid.groups ?? [];

  // Group metrics by sections
  const ungrouped = metrics.filter((m) => !m.groupId);
  const sections: { id: string; title: string; items: typeof metrics }[] = [];
  if (ungrouped.length > 0) sections.push({ id: "__ungrouped__", title: "Ungrouped", items: ungrouped });
  for (const g of groups) {
    const items = metrics.filter((m) => m.groupId === g.id);
    if (items.length > 0) sections.push({ id: g.id, title: `${g.name} (${g.type})`, items });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Report - {new Date(report.date).toLocaleDateString()}</DialogTitle>
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
                    onSelect={handleDateChange}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <Separator />

          {sections.length === 0 ? (
            <p className="text-muted-foreground text-sm">No metrics configured yet.</p>
          ) : (
            <div className="space-y-6">
              {sections.map((section) => (
                <div key={section.id}>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">{section.title}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {section.items.map((m) => (
                      <div key={m.id} className="grid gap-2">
                        <Label htmlFor={`metric-${m.id}`}>
                          {m.name} {m.unit ? `(${m.unit})` : ""}
                        </Label>
                        <Input
                          id={`metric-${m.id}`}
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
              onChange={(e) => handleNotesChange(e.target.value)}
            />
          </div>

          {hasChanges && (
            <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
              You have made changes to this report. These will be saved when you approve.
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleReject}
          >
            <X className="h-4 w-4 mr-1" />
            Reject
          </Button>
          <Button onClick={handleApprove}>
            <Check className="h-4 w-4 mr-1" />
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}