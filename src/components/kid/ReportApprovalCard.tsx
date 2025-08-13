import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Edit, Calendar } from "lucide-react";
import { EnhancedKid } from "@/types/scoreSystem";

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

interface ReportApprovalCardProps {
  report: Report;
  kid: EnhancedKid;
  onApprove: (reportId: string) => void;
  onReject: (reportId: string) => void;
  onEdit: (reportId: string) => void;
}

export function ReportApprovalCard({ report, kid, onApprove, onReject, onEdit }: ReportApprovalCardProps) {
  const getStatusBadge = (status: Report["status"]) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending Review</Badge>;
      case "approved":
        return <Badge variant="default">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
    }
  };

  const getMetricName = (metricId: string) => {
    return kid.metrics?.find(m => m.id === metricId)?.name || metricId;
  };

  const getMetricUnit = (metricId: string) => {
    return kid.metrics?.find(m => m.id === metricId)?.unit || "";
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {formatDate(report.date)}
          </CardTitle>
          {getStatusBadge(report.status)}
        </div>
        {report.notes && (
          <p className="text-sm text-muted-foreground">{report.notes}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Activities Reported:</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {report.entries.filter(entry => entry.value > 0).map((entry) => (
              <div key={entry.metricId} className="flex justify-between items-center text-sm">
                <span>{getMetricName(entry.metricId)}</span>
                <span className="font-medium">
                  {entry.value} {getMetricUnit(entry.metricId)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {report.status === "pending" && (
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => onApprove(report.id)}
              size="sm"
              className="px-3"
            >
              <Check className="h-3 w-3 mr-1" />
              Approve
            </Button>
            <Button
              onClick={() => onReject(report.id)}
              variant="destructive"
              size="sm"
              className="px-3"
            >
              <X className="h-3 w-3 mr-1" />
              Reject
            </Button>
            <Button
              onClick={() => onEdit(report.id)}
              variant="outline"
              size="sm"
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        )}

        {report.status !== "pending" && (
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => onEdit(report.id)}
              variant="outline"
              size="sm"
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </div>
        )}

        {report.processedAt && (
          <div className="text-xs text-muted-foreground">
            {report.status === "approved" ? "Approved" : "Rejected"} on {formatDate(report.processedAt)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}