import { useQuery } from "@tanstack/react-query";
import { conversationsApi, userApi } from "@/lib/api-client";
import { getSupabaseBrowserClient } from "@/lib/supabase";

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
    queryFn: async () => {
      const supabase = getSupabaseBrowserClient();

      // Fetch all data sources in parallel
      const [conversationsRes, userRes, backendStats] = await Promise.all([
        conversationsApi.list().catch(() => ({ conversations: [] })),
        supabase.auth.getUser(),
        userApi.getStats().catch(() => null),
      ]);

      const conversations = conversationsRes.conversations ?? [];
      const user = userRes.data?.user;

      return {
        conversationCount: conversations.length,
        messageCount: backendStats?.messageCount ?? 0,
        createdAt: user?.created_at ?? backendStats?.createdAt ?? "",
        emailVerified:
          !!user?.email_confirmed_at ||
          (backendStats?.emailVerified ?? false),
        subscription: backendStats?.subscription ?? null,
      };
    },
    staleTime: 1000 * 60 * 5,
    enabled,
  });
}
