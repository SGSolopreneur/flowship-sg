import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export function useRole() {
  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: () => base44.auth.me(),
  });

  const role = user?.role || "staff";

  return {
    user,
    role,
    isAdmin: role === "admin",
    isManager: role === "manager" || role === "admin",
    canWrite: true,
    canAccessSensitive: role === "admin" || role === "manager",
  };
}