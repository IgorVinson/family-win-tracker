import { useContext } from "react";
import { AuthContextInternal } from "./AuthProvider";

export const useAuthContext = () => {
  const ctx = useContext(AuthContextInternal);
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
  return ctx;
};
