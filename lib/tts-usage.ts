import { db } from "@/db";
import { ttsUsage } from "@/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import { getUserPlanName } from "./subscription";
import { getTTSLimits, type PlanName } from "./memory/plan-limits";

/**
 * TTS Usage Tracking Library
 * ==========================
 * Tracks and enforces TTS usage limits per plan.
 */

export interface TTSUsageInfo {
  todayCount: number;
  monthCount: number;
  dailyLimit: number;
  monthlyLimit: number;
  canUseTTS: boolean;
  remainingToday: number;
  remainingMonth: number;
  planName: PlanName;
}

/**
 * Get the start of today in UTC
 */
function getStartOfToday(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/**
 * Get the start of this month in UTC
 */
function getStartOfMonth(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

/**
 * Get TTS usage statistics for a user
 */
export async function getTTSUsage(userId: string): Promise<TTSUsageInfo> {
  try {
    const planName = await getUserPlanName(userId);
    const limits = getTTSLimits(planName);

    const startOfToday = getStartOfToday();
    const startOfMonth = getStartOfMonth();

    // Get today's count
    const todayResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(ttsUsage)
      .where(
        and(
          eq(ttsUsage.userId, userId),
          gte(ttsUsage.createdAt, startOfToday)
        )
      );

    // Get this month's count
    const monthResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(ttsUsage)
      .where(
        and(
          eq(ttsUsage.userId, userId),
          gte(ttsUsage.createdAt, startOfMonth)
        )
      );

    const todayCount = Number(todayResult[0]?.count || 0);
    const monthCount = Number(monthResult[0]?.count || 0);

    const remainingToday = Math.max(0, limits.maxTTSPerDay - todayCount);
    const remainingMonth = Math.max(0, limits.maxTTSPerMonth - monthCount);

    return {
      todayCount,
      monthCount,
      dailyLimit: limits.maxTTSPerDay,
      monthlyLimit: limits.maxTTSPerMonth,
      canUseTTS: limits.ttsEnabled && remainingToday > 0 && remainingMonth > 0,
      remainingToday,
      remainingMonth,
      planName,
    };
  } catch (error) {
    console.error("[TTS Usage] Error getting usage:", error);
    // On error, allow usage but log the issue
    return {
      todayCount: 0,
      monthCount: 0,
      dailyLimit: 5,
      monthlyLimit: 150,
      canUseTTS: true,
      remainingToday: 5,
      remainingMonth: 150,
      planName: "Free",
    };
  }
}

/**
 * Check if user can use TTS (has remaining quota)
 */
export async function canUseTTS(userId: string): Promise<{
  allowed: boolean;
  reason?: string;
  usage?: TTSUsageInfo;
}> {
  const usage = await getTTSUsage(userId);

  if (!usage.canUseTTS) {
    if (usage.remainingToday === 0 && usage.dailyLimit !== Infinity) {
      return {
        allowed: false,
        reason: `Has alcanzado el límite diario de ${usage.dailyLimit} reproducciones. Se reinicia mañana.`,
        usage,
      };
    }
    if (usage.remainingMonth === 0 && usage.monthlyLimit !== Infinity) {
      return {
        allowed: false,
        reason: `Has alcanzado el límite mensual de ${usage.monthlyLimit} reproducciones. Considera actualizar tu plan.`,
        usage,
      };
    }
  }

  return { allowed: true, usage };
}

/**
 * Record a TTS usage event
 */
export async function recordTTSUsage(
  userId: string,
  characterCount: number,
  voiceUsed: string
): Promise<void> {
  try {
    await db.insert(ttsUsage).values({
      userId,
      characterCount,
      voiceUsed,
    });
  } catch (error) {
    console.error("[TTS Usage] Error recording usage:", error);
    // Don't throw - recording failure shouldn't block TTS
  }
}

/**
 * Get usage summary for display in UI
 */
export async function getTTSUsageSummary(userId: string): Promise<string> {
  const usage = await getTTSUsage(userId);

  const dailyDisplay = usage.dailyLimit === Infinity ? '∞' : usage.dailyLimit;
  const monthlyDisplay = usage.monthlyLimit === Infinity ? '∞' : usage.monthlyLimit;

  return `${usage.todayCount}/${dailyDisplay} hoy • ${usage.monthCount}/${monthlyDisplay} este mes`;
}
