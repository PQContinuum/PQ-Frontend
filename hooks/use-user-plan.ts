import { useQuery } from "@tanstack/react-query";
import { userApi, ApiError } from "@/lib/api-client";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type UserPlan = {
  userId: string | null;
  email: string | null;
  planName:
    | "Basic"
    | "Pro"
    | "Premium"
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
          // Verificar si la sesión de Supabase sigue válida
          const supabase = getSupabaseBrowserClient();
          const { data: { user } } = await supabase.auth.getUser();

          if (!user) {
            // Sesión realmente expirada: cerrar sesión y redirigir
            await supabase.auth.signOut();
            window.location.href = "/auth";
          }

          // Si el usuario existe en Supabase pero el backend da 401,
          // es un problema de sincronización — retornar plan Basic
          return {
            userId: null,
            email: null,
            planName: "Basic",
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
