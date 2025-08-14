import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { UserRound, Loader2 } from "lucide-react";
import Index from "./Index";
import { DebugPanel } from "@/components/ui/debug-panel";

export default function IndexWrapper() {
  const { loading, isAuthenticated } = useAuth();
  
  console.log("🔧 IndexWrapper: Render state", { loading, isAuthenticated });

  if (loading) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="card-elevated">
            <CardContent className="flex items-center gap-4 p-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <div>
                <p className="font-medium">Loading...</p>
                <p className="text-sm text-muted-foreground">Setting up your dashboard</p>
              </div>
            </CardContent>
          </Card>
        </div>
        <DebugPanel />
      </>
    );
  }

  // If not authenticated, show the existing Index page with localStorage functionality
  if (!isAuthenticated) {
    return (
      <>
        <Index />
        <DebugPanel />
      </>
    );
  }

  // If authenticated, redirect to a database-powered dashboard
  // For now, we'll show the same Index page but it will use migrated data
  return (
    <>
      <Index />
      <DebugPanel />
    </>
  );
}