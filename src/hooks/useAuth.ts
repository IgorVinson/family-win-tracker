import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { checkIfMigrationNeeded, migrateLocalStorageToSupabase, getUserRole } from "@/lib/dataMigration";
import { toast } from "@/hooks/use-toast";
import { cleanupAuthState } from "@/lib/authCleanup";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'parent' | 'kid' | null>(null);

  useEffect(() => {
    console.log("🔧 useAuth: Hook started, initializing...");
    
    // Add a timeout to force loading to false after 10 seconds to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log("🔧 useAuth: Timeout reached, forcing loading to false");
      setLoading(false);
    }, 10000);
    
    console.log("🔧 useAuth: Setting up auth state listener");
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("🔧 useAuth: Auth state changed", { event, hasSession: !!session });
        clearTimeout(timeoutId); // Clear timeout if auth state changes
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log("🔧 useAuth: User found, getting role for:", session.user.id);
          // Get user role with retry logic
          try {
            const role = await getUserRole(session.user.id);
            console.log("🔧 useAuth: Got user role:", role);
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
            console.error("🔧 useAuth: Error getting user role:", error);
            setUserRole(null);
          }
        } else {
          console.log("🔧 useAuth: No user session");
          setUserRole(null);
        }

        console.log("🔧 useAuth: Setting loading to false");
        setLoading(false);
      }
    );

    // Check for existing session
    console.log("🔧 useAuth: Checking for existing session");
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      console.log("🔧 useAuth: Initial session check", { hasSession: !!session, error });
      clearTimeout(timeoutId); // Clear timeout if session check completes
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        console.log("🔧 useAuth: Initial user found, getting role for:", session.user.id);
        try {
          const role = await getUserRole(session.user.id);
          console.log("🔧 useAuth: Initial user role:", role);
          setUserRole(role);
        } catch (error) {
          console.error("🔧 useAuth: Error getting user role on init:", error);
          setUserRole(null);
        }
      }
      
      console.log("🔧 useAuth: Initial loading set to false");
      setLoading(false);
    }).catch((error) => {
      console.error("🔧 useAuth: Error getting session:", error);
      clearTimeout(timeoutId);
      setLoading(false);
    });

    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      // Clean up auth state first
      cleanupAuthState();
      
      // Attempt global sign out
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        console.log("Global signout failed, continuing anyway");
      }
      
      toast({
        title: "Signed out",
        description: "You have been successfully signed out."
      });
      
      // Force page reload for clean state
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
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