import { useQuery } from "@tanstack/react-query";
import { userApi } from "@/lib/api-client";

export type AccountStats = {
  conversationCount: number;
  messageCount: number;
  createdAt: string;
  emailVerified: boolean;
  subscription: {
    planName: string;
    status: string;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  } | null;
};

export function useAccountStats(enabled = true) {
  return useQuery<AccountStats>({
    queryKey: ["account-stats"],
    queryFn: () => userApi.getStats(),
    staleTime: 1000 * 60 * 5,
    enabled,
  });
}
