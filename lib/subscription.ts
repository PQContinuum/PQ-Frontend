import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { PlanName } from "./memory/plan-limits";

/**
 * Obtener la subscription activa de un usuario
 * @param userId - ID del usuario de Supabase Auth
 * @returns La subscription del usuario o null si no tiene una
 */
export async function getUserSubscription(userId: string) {
  try {
    const userSubscriptions = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    return userSubscriptions[0] || null;
  } catch (error) {
    console.error("Error fetching user subscription:", error);
    return null;
  }
}

/**
 * Verificar si un usuario tiene una subscription activa (de pago)
 * @param userId - ID del usuario de Supabase Auth
 * @returns true si tiene una subscription activa de pago
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const subscription = await getUserSubscription(userId);

  if (!subscription) {
    return false;
  }

  // Verificar que el status sea "active" o "trialing"
  // y que el plan no sea "Free"
  return (
    (subscription.status === "active" || subscription.status === "trialing") &&
    subscription.planName !== "Free"
  );
}

/**
 * Verificar si un usuario necesita pagar (no tiene subscription o es Free)
 * @param userId - ID del usuario de Supabase Auth
 * @returns true si el usuario necesita ir a /payment
 */
export async function needsPayment(userId: string): Promise<boolean> {
  const subscription = await getUserSubscription(userId);

  // Si no tiene subscription o es Free, necesita pagar
  if (!subscription || subscription.planName === "Free") {
    return true;
  }

  // Si tiene una subscription pero está cancelada, expirada o con problemas de pago
  if (
    subscription.status === "canceled" ||
    subscription.status === "incomplete" ||
    subscription.status === "incomplete_expired" ||
    subscription.status === "past_due" ||
    subscription.status === "unpaid"
  ) {
    return true;
  }

  return false;
}

/**
 * Obtener el nombre del plan del usuario
 * @param userId - ID del usuario de Supabase Auth
 * @returns El nombre del plan o "Free" si no tiene subscription
 */
export async function getUserPlanName(userId: string): Promise<PlanName> {
  const subscription = await getUserSubscription(userId);

  // Si no tiene subscription o no tiene plan válido, retornar Free
  if (!subscription || !subscription.planName) {
    return "Free";
  }

  return subscription.planName as PlanName;
}

/**
 * Crear una subscription Free por defecto para un nuevo usuario
 * @param userId - ID del usuario de Supabase Auth
 */
export async function createFreeSubscription(userId: string) {
  try {
    const existingSubscription = await getUserSubscription(userId);

    if (!existingSubscription) {
      await db.insert(subscriptions).values({
        userId,
        planName: "Free",
        status: "active",
      });
      console.log(`✅ Free subscription created for user ${userId}`);
    }
  } catch (error) {
    console.error("Error creating free subscription:", error);
  }
}
