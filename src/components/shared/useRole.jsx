import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

/**
 * Roles:
 *   admin   – full write access to everything
 *   manager – write access to all pages including sensitive (Suppliers, Analytics, etc.)
 *   staff   – read-only, no access to sensitive pages
 */
export function useRole() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: () => base44.auth.me(),
  });

  const role = user?.role || "staff";

  return {
    user,
    role,
    isLoading,
    isAdmin: role === "admin",
    isManager: role === "admin" || role === "manager",
    // canWrite: admin and manager can write; staff is read-only
    canWrite: role === "admin" || role === "manager",
    // canAccessSensitive: only admin and manager see Suppliers / Analytics pages
    canAccessSensitive: role === "admin" || role === "manager",
  };
}