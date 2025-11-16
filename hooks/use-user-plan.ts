import { useQuery } from "@tanstack/react-query";

type UserPlan = {
  userId: string;
  email: string;
  planName: "Free" | "Basic" | "Professional" | "Enterprise";
  status: string;
  currentPeriodEnd?: Date;
  subscription?: any;
};

export function useUserPlan() {
  return useQuery<UserPlan>({
    queryKey: ["user-plan"],
    queryFn: async () => {
      const response = await fetch("/api/user-plan");
      if (!response.ok) {
        throw new Error("Failed to fetch user plan");
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchOnWindowFocus: true,
  });
}
