import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSubscription } from "@/lib/subscription";

/**
 * GET /api/user-plan
 * Obtiene el plan actual del usuario
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

    const subscription = await getUserSubscription(user.id);

    // Si no tiene subscription, es plan Free por defecto
    const planName = subscription?.planName || "Free";
    const status = subscription?.status || "active";
    const currentPeriodEnd = subscription?.currentPeriodEnd;

    return NextResponse.json({
      userId: user.id,
      email: user.email,
      planName,
      status,
      currentPeriodEnd,
      subscription,
    });
  } catch (error) {
    console.error("Error fetching user plan:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
