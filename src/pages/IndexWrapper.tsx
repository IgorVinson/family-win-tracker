import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import Index from "./Index";

export default function IndexWrapper() {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="card-elevated">
          <CardContent className="flex items-center gap-4 p-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <div>
              <p className="font-medium">Loading...</p>
              <p className="text-sm text-muted-foreground">
                Setting up your dashboard
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If not authenticated, show the existing Index page with localStorage functionality
  if (!isAuthenticated) {
    return <Index />;
  }

  // If authenticated, redirect to a database-powered dashboard
  // For now, we'll show the same Index page but it will use migrated data
  return <Index />;
}
