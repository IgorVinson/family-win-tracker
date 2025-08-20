import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cleanupAuthState } from "@/lib/authCleanup";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, RefreshCw } from "lucide-react";

export function DebugPanel() {
  const [isVisible, setIsVisible] = useState(false);

  const handleCleanupAndReload = async () => {
    cleanupAuthState();
    try {
      await supabase.auth.signOut({ scope: 'global' });
    } catch (e) {
      console.log("Signout failed during cleanup, continuing...");
    }
    window.location.reload();
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setIsVisible(true)}
          className="bg-red-500 text-white hover:bg-red-600"
        >
          Debug
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80">
        <CardHeader>
          <CardTitle className="text-sm flex items-center justify-between">
            Debug Panel
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsVisible(false)}
              className="h-6 w-6 p-0"
            >
              ×
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleCleanupAndReload}
            className="w-full"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear Auth & Reload
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.location.reload()}
            className="w-full"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Reload Page
          </Button>
          <div className="text-xs text-muted-foreground">
            Use "Clear Auth & Reload" if stuck loading
          </div>
        </CardContent>
      </Card>
    </div>
  );
}