// Legacy hook kept for backward compatibility. Prefer using useAuthContext + useUserRole.
import { useAuthContext } from "@/context/useAuthContext";
import { useUserRole } from "./useUserRole";

export const useAuth = () => {
  const { user, session, loading, isAuthenticated, signOut } = useAuthContext();
  const { data: userRole, isLoading: roleLoading } = useUserRole(user?.id);

  return {
    user,
    session,
    loading: loading || roleLoading, // legacy behavior (may over-block UI)
    userRole,
    signOut,
    isAuthenticated,
  };
};
