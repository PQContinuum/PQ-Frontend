import { useQuery } from "@tanstack/react-query";
import { conversationsApi, userApi, type Conversation } from "@/lib/api-client";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export type AccountStats = {
  conversationCount: number;
  createdAt: string;
  emailVerified: boolean;
  conversations: Conversation[];
  subscription: {
    planName: string;
    status: string;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  } | null;
};

/** Fast query: conversations list + Supabase user (no per-conversation fetches) */
export function useAccountStats(enabled = true) {
  return useQuery<AccountStats>({
    queryKey: ["account-stats"],
    queryFn: async () => {
      const supabase = getSupabaseBrowserClient();

      const [conversationsRes, userRes, backendStats] = await Promise.all([
        conversationsApi.list().catch(() => ({ conversations: [] as Conversation[] })),
        supabase.auth.getUser(),
        userApi.getStats().catch(() => null),
      ]);

      const conversations = conversationsRes.conversations ?? [];
      const user = userRes.data?.user;

      return {
        conversationCount: conversations.length,
        conversations,
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

/** Slow query: counts user-sent messages across all conversations (loads independently) */
export function useMessageCount(conversations: Conversation[], enabled = true) {
  return useQuery<number>({
    queryKey: ["message-count", conversations.map((c) => c.id)],
    queryFn: async () => {
      if (conversations.length === 0) return 0;

      // Process in batches of 10 to avoid overwhelming the server
      const BATCH_SIZE = 10;
      let total = 0;

      for (let i = 0; i < conversations.length; i += BATCH_SIZE) {
        const batch = conversations.slice(i, i + BATCH_SIZE);
        const counts = await Promise.all(
          batch.map((c) =>
            conversationsApi
              .getMessages(c.id)
              .then(
                (res) =>
                  res.messages?.filter((m) => m.role === "user").length ?? 0
              )
              .catch(() => 0)
          )
        );
        total += counts.reduce((sum, n) => sum + n, 0);
      }

      return total;
    },
    staleTime: 1000 * 60 * 10,
    enabled: enabled && conversations.length > 0,
  });
}
