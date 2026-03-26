import { useQuery } from "@tanstack/react-query";
import { userApi, ApiError } from "@/lib/api-client";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

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
      try {
        const data = await userApi.getPlan();
        return {
          userId: (data as unknown as { userId?: string }).userId || null,
          email: (data as unknown as { email?: string }).email || null,
          planName: data.planName as UserPlan["planName"],
          status: data.status || "active",
          currentPeriodEnd: data.currentPeriodEnd
            ? new Date(data.currentPeriodEnd)
            : undefined,
          subscription: (data as unknown as { subscription?: unknown }).subscription,
        };
      } catch (error) {
        if (error instanceof ApiError && error.statusCode === 401) {
          // Sesión inválida: cerrar sesión y redirigir a /auth
          const supabase = getSupabaseBrowserClient();
          await supabase.auth.signOut();
          window.location.href = "/auth";
          // Retornar valor por defecto mientras redirige
          return {
            userId: null,
            email: null,
            planName: "Free",
            status: "unauthenticated",
            currentPeriodEnd: undefined,
            subscription: undefined,
          };
        }
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchOnWindowFocus: true,
  });
}
