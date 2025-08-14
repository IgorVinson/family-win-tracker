import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, FileText, Target } from "lucide-react";

type DailyReportEntry = { metricId: string; value: number };
type DailyReport = { id: string; date: string; createdAt?: string; notes?: string; entries?: DailyReportEntry[] };
type Metric = { id: string; name: string; unit?: string; groupId?: string };

interface ReportViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: DailyReport | null;
  kidName: string;
  metrics?: Metric[];
}

export function ReportViewModal({ open, onOpenChange, report, kidName, metrics = [] }: ReportViewModalProps) {
  if (!report) return null;

  const totalPoints = (report.entries || []).reduce((sum, entry) => sum + (entry.value || 0), 0);
  
  const getMetricName = (metricId: string) => {
    return metrics.find(m => m.id === metricId)?.name || `Activity ${metricId}`;
  };

  const getMetricUnit = (metricId: string) => {
    return metrics.find(m => m.id === metricId)?.unit || '';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {kidName}'s Daily Report
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Report Header */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {formatDate(report.date)}
                </div>
                <Badge variant="secondary" className="text-sm">
                  Total: {totalPoints} pts
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Submitted: {new Date(report.createdAt || report.date).toLocaleString()}
              </div>
            </CardContent>
          </Card>

          {/* Report Entries */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4" />
                Activities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(!report.entries || report.entries.length === 0) ? (
                <div className="text-center text-muted-foreground py-4">
                  No activities recorded for this day
                </div>
              ) : (
                <div className="space-y-2">
                  {(report.entries || []).map((entry, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 bg-primary rounded-full" />
                        <span className="font-medium">{getMetricName(entry.metricId)}</span>
                        {getMetricUnit(entry.metricId) && (
                          <span className="text-xs text-muted-foreground">({getMetricUnit(entry.metricId)})</span>
                        )}
                      </div>
                      <Badge variant="outline">
                        {entry.value > 0 ? '+' : ''}{entry.value} pts
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes Section */}
          {report.notes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{report.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}