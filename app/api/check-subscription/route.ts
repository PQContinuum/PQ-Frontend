import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSubscription, needsPayment } from "@/lib/subscription";

/**
 * GET /api/check-subscription
 * Verifica si el usuario tiene una subscription activa
 * y determina a dónde debe ser redirigido
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verificar si el usuario necesita pagar
    const needsPay = await needsPayment(user.id);
    const subscription = await getUserSubscription(user.id);

    return NextResponse.json({
      userId: user.id,
      email: user.email,
      subscription,
      needsPayment: needsPay,
      redirectTo: needsPay ? "/payment" : "/chat",
    });
  } catch (error) {
    console.error("Error checking subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
