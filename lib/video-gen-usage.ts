import { db } from "@/db";
import { videoGenUsage } from "@/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import { getUserPlanName } from "./subscription";
import {
  getVideoGenLimits,
  calculateVideoCost,
  type PlanName,
  type VideoGenDuration,
  type VideoGenAspectRatio,
  type VideoGenMode,
} from "./memory/plan-limits";

/**
 * Video Generation Usage Tracking Library
 * =======================================
 * Tracks and enforces video generation limits per plan.
 * Uses Kling V2.6 Pro via Fal.ai (2025)
 */

export interface VideoGenUsageInfo {
  todayCount: number;
  monthCount: number;
  dailyLimit: number;
  monthlyLimit: number;
  canGenerate: boolean;
  remainingToday: number;
  remainingMonth: number;
  planName: PlanName;
  allowedDurations: VideoGenDuration[];
  allowedAspectRatios: VideoGenAspectRatio[];
  allowedModes: VideoGenMode[];
  audioEnabled: boolean;
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
 * Get video generation usage statistics for a user
 */
export async function getVideoGenUsage(userId: string): Promise<VideoGenUsageInfo> {
  try {
    const planName = await getUserPlanName(userId);
    const limits = getVideoGenLimits(planName);

    const startOfToday = getStartOfToday();
    const startOfMonth = getStartOfMonth();

    // Get today's count
    const todayResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(videoGenUsage)
      .where(
        and(
          eq(videoGenUsage.userId, userId),
          gte(videoGenUsage.createdAt, startOfToday)
        )
      );

    // Get this month's count
    const monthResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(videoGenUsage)
      .where(
        and(
          eq(videoGenUsage.userId, userId),
          gte(videoGenUsage.createdAt, startOfMonth)
        )
      );

    const todayCount = Number(todayResult[0]?.count || 0);
    const monthCount = Number(monthResult[0]?.count || 0);

    const remainingToday = Math.max(0, limits.maxVideosPerDay - todayCount);
    const remainingMonth = Math.max(0, limits.maxVideosPerMonth - monthCount);

    return {
      todayCount,
      monthCount,
      dailyLimit: limits.maxVideosPerDay,
      monthlyLimit: limits.maxVideosPerMonth,
      canGenerate: limits.videoGenEnabled && remainingToday > 0 && remainingMonth > 0,
      remainingToday,
      remainingMonth,
      planName,
      allowedDurations: limits.allowedDurations,
      allowedAspectRatios: limits.allowedAspectRatios,
      allowedModes: limits.allowedModes,
      audioEnabled: limits.audioEnabled,
    };
  } catch (error) {
    console.error("[VideoGen Usage] Error getting usage:", error);
    // On error, return restrictive defaults
    return {
      todayCount: 0,
      monthCount: 0,
      dailyLimit: 1,
      monthlyLimit: 3,
      canGenerate: true,
      remainingToday: 1,
      remainingMonth: 3,
      planName: "Free",
      allowedDurations: ['5'],
      allowedAspectRatios: ['16:9'],
      allowedModes: ['text-to-video'],
      audioEnabled: false,
    };
  }
}

/**
 * Check if user can generate a video
 */
export async function canGenerateVideo(userId: string): Promise<{
  allowed: boolean;
  reason?: string;
  usage?: VideoGenUsageInfo;
}> {
  const usage = await getVideoGenUsage(userId);

  if (!usage.canGenerate) {
    if (usage.remainingToday === 0) {
      return {
        allowed: false,
        reason: `Has alcanzado el límite diario de ${usage.dailyLimit} videos. Se reinicia mañana.`,
        usage,
      };
    }
    if (usage.remainingMonth === 0) {
      return {
        allowed: false,
        reason: `Has alcanzado el límite mensual de ${usage.monthlyLimit} videos. Considera actualizar tu plan.`,
        usage,
      };
    }
  }

  return { allowed: true, usage };
}

/**
 * Validate video generation parameters against plan limits
 */
export function validateVideoParams(
  planName: PlanName,
  duration: string,
  aspectRatio: string,
  mode: string
): { valid: boolean; error?: string } {
  const limits = getVideoGenLimits(planName);

  // Validate duration
  if (!limits.allowedDurations.includes(duration as VideoGenDuration)) {
    return {
      valid: false,
      error: `Tu plan no permite duración de ${duration} segundos. Duraciones disponibles: ${limits.allowedDurations.join(', ')}s`,
    };
  }

  // Validate aspect ratio
  if (!limits.allowedAspectRatios.includes(aspectRatio as VideoGenAspectRatio)) {
    return {
      valid: false,
      error: `Tu plan no permite aspect ratio "${aspectRatio}". Disponibles: ${limits.allowedAspectRatios.join(', ')}`,
    };
  }

  // Validate mode
  if (!limits.allowedModes.includes(mode as VideoGenMode)) {
    return {
      valid: false,
      error: `Tu plan no incluye el modo "${mode}". Modos disponibles: ${limits.allowedModes.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Record a video generation event
 */
export async function recordVideoGenUsage(
  userId: string,
  data: {
    prompt: string;
    mode: VideoGenMode;
    duration: VideoGenDuration;
    aspectRatio: VideoGenAspectRatio;
    audioEnabled: boolean;
    sourceImageUrl?: string;
    storagePath?: string;
    originalUrl?: string;
    requestId?: string;
    generationTimeMs?: number;
  }
): Promise<void> {
  try {
    const costUsd = calculateVideoCost(data.duration, data.audioEnabled);

    await db.insert(videoGenUsage).values({
      userId,
      prompt: data.prompt,
      mode: data.mode,
      duration: data.duration,
      aspectRatio: data.aspectRatio,
      audioEnabled: data.audioEnabled,
      sourceImageUrl: data.sourceImageUrl,
      storagePath: data.storagePath,
      originalUrl: data.originalUrl,
      requestId: data.requestId,
      costUsd: costUsd.toString(),
      generationTimeMs: data.generationTimeMs,
    });
  } catch (error) {
    console.error("[VideoGen Usage] Error recording usage:", error);
    // Don't throw - recording failure shouldn't block video generation
  }
}

/**
 * Get usage summary for display in UI
 */
export async function getVideoGenUsageSummary(userId: string): Promise<string> {
  const usage = await getVideoGenUsage(userId);
  return `${usage.todayCount}/${usage.dailyLimit} hoy | ${usage.monthCount}/${usage.monthlyLimit} este mes`;
}

/**
 * Get user's video generation history
 */
export async function getVideoGenHistory(
  userId: string,
  limit: number = 20,
  offset: number = 0
) {
  try {
    const videos = await db
      .select()
      .from(videoGenUsage)
      .where(eq(videoGenUsage.userId, userId))
      .orderBy(sql`${videoGenUsage.createdAt} DESC`)
      .limit(limit)
      .offset(offset);

    return videos;
  } catch (error) {
    console.error("[VideoGen Usage] Error getting history:", error);
    return [];
  }
}
