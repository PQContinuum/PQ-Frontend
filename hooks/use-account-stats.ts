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

      // Count user-sent messages across all conversations
      const messagesPerConversation = await Promise.all(
        conversations.map((c) =>
          conversationsApi
            .getMessages(c.id)
            .then((res) => res.messages?.filter((m) => m.role === "user").length ?? 0)
            .catch(() => 0)
        )
      );
      const totalUserMessages = messagesPerConversation.reduce((sum, n) => sum + n, 0);

      return {
        conversationCount: conversations.length,
        messageCount: totalUserMessages,
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
