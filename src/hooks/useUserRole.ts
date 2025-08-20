import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export type UserRole = "parent" | "kid" | null;

export const fetchUserRole = async (userId: string): Promise<UserRole> => {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data?.role as UserRole) ?? null;
};

// Keep original internal function usage pointing to exported utility
export const useUserRole = (userId?: string) => {
  return useQuery({
    queryKey: ["userRole", userId],
    queryFn: () => fetchUserRole(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
  });
};
