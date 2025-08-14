import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

type AuthGuardProps = {
  children: ReactNode;
  requireAuth?: boolean;
  allowedRoles?: ('parent' | 'kid')[];
};

export const AuthGuard = ({ children, requireAuth = false, allowedRoles }: AuthGuardProps) => {
  const { loading, isAuthenticated, userRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="card-elevated">
          <CardContent className="flex items-center gap-4 p-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <div>
              <p className="font-medium">Loading...</p>
              <p className="text-sm text-muted-foreground">Please wait while we set up your account</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="card-elevated">
          <CardContent className="text-center p-8">
            <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
            <p className="text-muted-foreground">
              This page is not available for your role ({userRole}).
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};