import { useQuery } from "@tanstack/react-query";

type UserPlan = {
  userId: string | null;
  email: string | null;
  planName:
    | "Free"
    | "Basic"
    | "Professional"
    | "Enterprise"
    | "Básico"
    | "Profesional"
    | "Empresarial";
  status: string;
  currentPeriodEnd?: Date;
  subscription?: unknown;
};

export function useUserPlan() {
  return useQuery<UserPlan>({
    queryKey: ["user-plan"],
    queryFn: async () => {
      const response = await fetch("/api/user-plan");

      if (response.status === 401) {
        return {
          userId: null,
          email: null,
          planName: "Free",
          status: "unauthenticated",
          currentPeriodEnd: undefined,
          subscription: undefined,
        };
      }

      if (!response.ok) {
        throw new Error("Failed to fetch user plan");
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchOnWindowFocus: true,
  });
}
