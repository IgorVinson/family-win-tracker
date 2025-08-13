import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Eye } from "lucide-react";
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
  onReview: (reportId: string) => void;
  onEdit: (reportId: string) => void;
}

export function ReportApprovalCard({ report, kid, onReview, onEdit }: ReportApprovalCardProps) {
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
    <div className="p-4 border rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium">{formatDate(report.date)}</h4>
        <div className="flex gap-2">
          {getStatusBadge(report.status)}
          <Badge variant="outline">
            {report.entries.filter(entry => entry.value > 0).length} activities
          </Badge>
          
          {report.status === "pending" && (
            <Button
              variant="default"
              size="sm"
              onClick={() => onReview(report.id)}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Eye className="h-3 w-3 mr-1" />
              Review
            </Button>
          )}
          
          <Button
            onClick={() => onEdit(report.id)}
            variant="outline"
            size="sm"
          >
            <Edit className="h-3 w-3" />
          </Button>
        </div>
      </div>
      
      {report.notes && (
        <p className="text-sm text-muted-foreground mb-2">{report.notes}</p>
      )}
      
      <div className="flex flex-wrap gap-2">
        {report.entries.filter(entry => entry.value > 0).map((entry) => (
          <Badge key={entry.metricId} variant="secondary">
            {getMetricName(entry.metricId)}: {entry.value} {getMetricUnit(entry.metricId)}
          </Badge>
        ))}
      </div>

      {report.processedAt && (
        <div className="text-xs text-muted-foreground mt-2">
          {report.status === "approved" ? "Approved" : "Rejected"} on {formatDate(report.processedAt)}
        </div>
      )}
    </div>
  );
}