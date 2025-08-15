import { toast } from "@/hooks/use-toast";
import { rpcClaimKidInvitation, supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { createContext, ReactNode, useEffect, useState } from "react";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean; // only auth (session) loading, not data roles
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial session fetch
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session || null);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Single global auth listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Check for pending kid invitation when user signs in
      if (event === 'SIGNED_IN' && session?.user) {
        const pendingToken = localStorage.getItem('pendingKidInvitation');
        if (pendingToken) {
          try {
            const { data, error } = await rpcClaimKidInvitation(pendingToken);
            if (!error && data?.[0]?.kid_id) {
              localStorage.removeItem('pendingKidInvitation');
              toast({
                title: "Welcome to your family!",
                description: "Your account has been connected successfully.",
              });
              // Redirect to kid dashboard
              const kidId = data[0].kid_id;
              window.location.href = `/kid/${kidId}`;
            }
          } catch (error) {
            console.error('Failed to claim pending invitation:', error);
            localStorage.removeItem('pendingKidInvitation');
          }
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unknown error";
      toast({
        variant: "destructive",
        title: "Sign out failed",
        description: message,
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, isAuthenticated: !!session, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const AuthContextInternal = AuthContext; // for external hook file
