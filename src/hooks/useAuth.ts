import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { checkIfMigrationNeeded, migrateLocalStorageToSupabase, getUserRole } from "@/lib/dataMigration";
import { toast } from "@/hooks/use-toast";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'parent' | 'kid' | null>(null);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Get user role with retry logic
          try {
            const role = await getUserRole(session.user.id);
            setUserRole(role);
            
            // Check for migration on sign in
            if (event === 'SIGNED_IN' && checkIfMigrationNeeded()) {
              if (role) {
                setTimeout(async () => {
                  toast({
                    title: "Migrating your data...",
                    description: "Transferring your existing data to your account."
                  });
                  await migrateLocalStorageToSupabase(session.user.id, role);
                }, 0);
              }
            }
          } catch (error) {
            console.error("Error getting user role:", error);
            setUserRole(null);
          }
        } else {
          setUserRole(null);
        }

        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        try {
          const role = await getUserRole(session.user.id);
          setUserRole(role);
        } catch (error) {
          console.error("Error getting user role on init:", error);
          setUserRole(null);
        }
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Signed out",
        description: "You have been successfully signed out."
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign out failed",
        description: error.message
      });
    }
  };

  return {
    user,
    session,
    loading,
    userRole,
    signOut,
    isAuthenticated: !!session
  };
};