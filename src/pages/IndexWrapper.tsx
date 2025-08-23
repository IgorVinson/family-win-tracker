import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useFamilyKids } from "@/hooks/useFamilyKids";
import { Loader2 } from "lucide-react";
import { Navigate } from "react-router-dom";
import Index from "./Index";

export default function IndexWrapper() {
  const { loading, isAuthenticated, userRole } = useAuth();
  const { kids } = useFamilyKids();

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

  if (!isAuthenticated) {
    return <Index />;
  }

  // Redirect authenticated kid role to their dashboard (hide main page)
  if (isAuthenticated && userRole === "kid") {
    if (kids.length === 0) return null; // fallback empty until kid profile loads
    return <Navigate to={`/kid/${kids[0].id}`} replace />;
  }

  // If authenticated, redirect to a database-powered dashboard
  // For now, we'll show the same Index page but it will use migrated data
  return <Index />;
}