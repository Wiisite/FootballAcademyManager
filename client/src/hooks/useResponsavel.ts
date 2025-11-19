import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useResponsavel() {
  const { data: responsavel, isLoading, error } = useQuery({
    queryKey: ["/api/responsaveis/me"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    responsavel,
    isLoading,
    isAuthenticated: !!responsavel && !error,
    error,
  };
}

export async function logoutResponsavel() {
  try {
    await apiRequest("POST", "/api/responsaveis/logout");
    // Force reload to clear any cached data
    window.location.href = "/responsavel";
  } catch (error) {
    console.error("Logout error:", error);
    // Even if logout fails, redirect to login
    window.location.href = "/responsavel";
  }
}