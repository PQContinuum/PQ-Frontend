import { db } from "@/db";
import { imageGenUsage } from "@/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import { getUserPlanName } from "./subscription";
import {
  getImageGenLimits,
  calculateImageCost,
  getAllowedSizes,
  type PlanName,
  type ImageGenQuality,
  type ImageGenSize,
} from "./memory/plan-limits";

/**
 * Image Generation Usage Tracking Library
 * =======================================
 * Tracks and enforces image generation limits per plan.
 * Updated for FLUX Pro via Fal.ai (2025)
 */

export interface ImageGenUsageInfo {
  todayCount: number;
  monthCount: number;
  dailyLimit: number;
  monthlyLimit: number;
  canGenerate: boolean;
  remainingToday: number;
  remainingMonth: number;
  planName: PlanName;
  allowedQualities: ImageGenQuality[];
  allowedSizes: ImageGenSize[];
  maxResolution: ImageGenSize;
  // FLUX Pro specific features
  premiumStyles: boolean;
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
 * Get image generation usage statistics for a user
 */
export async function getImageGenUsage(userId: string): Promise<ImageGenUsageInfo> {
  try {
    const planName = await getUserPlanName(userId);
    const limits = getImageGenLimits(planName);

    const startOfToday = getStartOfToday();
    const startOfMonth = getStartOfMonth();

    // Get today's count
    const todayResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(imageGenUsage)
      .where(
        and(
          eq(imageGenUsage.userId, userId),
          gte(imageGenUsage.createdAt, startOfToday)
        )
      );

    // Get this month's count
    const monthResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(imageGenUsage)
      .where(
        and(
          eq(imageGenUsage.userId, userId),
          gte(imageGenUsage.createdAt, startOfMonth)
        )
      );

    const todayCount = Number(todayResult[0]?.count || 0);
    const monthCount = Number(monthResult[0]?.count || 0);

    const remainingToday = Math.max(0, limits.maxImagesPerDay - todayCount);
    const remainingMonth = Math.max(0, limits.maxImagesPerMonth - monthCount);

    return {
      todayCount,
      monthCount,
      dailyLimit: limits.maxImagesPerDay,
      monthlyLimit: limits.maxImagesPerMonth,
      canGenerate: limits.imageGenEnabled && remainingToday > 0 && remainingMonth > 0,
      remainingToday,
      remainingMonth,
      planName,
      allowedQualities: limits.allowedQualities,
      allowedSizes: getAllowedSizes(limits.maxResolution),
      maxResolution: limits.maxResolution,
      // FLUX Pro specific features
      premiumStyles: limits.premiumStyles,
    };
  } catch (error) {
    console.error("[ImageGen Usage] Error getting usage:", error);
    // On error, return restrictive defaults
    return {
      todayCount: 0,
      monthCount: 0,
      dailyLimit: 5,
      monthlyLimit: 30,
      canGenerate: true,
      remainingToday: 5,
      remainingMonth: 30,
      planName: "Free",
      allowedQualities: ['low'],
      allowedSizes: ['1024x1024'],
      maxResolution: '1024x1024',
      premiumStyles: false,
    };
  }
}

/**
 * Check if user can generate an image
 */
export async function canGenerateImage(userId: string): Promise<{
  allowed: boolean;
  reason?: string;
  usage?: ImageGenUsageInfo;
}> {
  const usage = await getImageGenUsage(userId);

  if (!usage.canGenerate) {
    if (usage.remainingToday === 0) {
      return {
        allowed: false,
        reason: `Has alcanzado el límite diario de ${usage.dailyLimit} imágenes. Se reinicia mañana.`,
        usage,
      };
    }
    if (usage.remainingMonth === 0) {
      return {
        allowed: false,
        reason: `Has alcanzado el límite mensual de ${usage.monthlyLimit} imágenes. Considera actualizar tu plan.`,
        usage,
      };
    }
  }

  return { allowed: true, usage };
}

/**
 * Validate image generation parameters against plan limits
 */
export function validateImageParams(
  planName: PlanName,
  quality: string,
  size: string
): { valid: boolean; error?: string } {
  const limits = getImageGenLimits(planName);

  // Validate quality
  if (!limits.allowedQualities.includes(quality as ImageGenQuality)) {
    return {
      valid: false,
      error: `Tu plan no permite calidad "${quality}". Calidades disponibles: ${limits.allowedQualities.join(', ')}`,
    };
  }

  // Validate size
  const allowedSizes = getAllowedSizes(limits.maxResolution);

  if (!allowedSizes.includes(size as ImageGenSize)) {
    return {
      valid: false,
      error: `Tu plan no permite resolución "${size}". Resoluciones disponibles: ${allowedSizes.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Record an image generation event
 */
export async function recordImageGenUsage(
  userId: string,
  data: {
    prompt: string;
    revisedPrompt?: string;
    model?: string;
    quality: ImageGenQuality;
    size: ImageGenSize;
    stylePreset?: string; // Style preset ID (e.g., 'ghibli', 'pixar')
    storagePath?: string;
    originalUrl?: string;
    generationTimeMs?: number;
  }
): Promise<void> {
  try {
    const costUsd = calculateImageCost(data.quality, data.size);

    await db.insert(imageGenUsage).values({
      userId,
      prompt: data.prompt,
      revisedPrompt: data.revisedPrompt,
      model: data.model || 'flux-pro',
      quality: data.quality,
      size: data.size,
      style: data.stylePreset || 'auto', // Now stores style preset ID
      storagePath: data.storagePath,
      originalUrl: data.originalUrl,
      costUsd: costUsd.toString(),
      generationTimeMs: data.generationTimeMs,
    });
  } catch (error) {
    console.error("[ImageGen Usage] Error recording usage:", error);
    // Don't throw - recording failure shouldn't block image generation
  }
}

/**
 * Get usage summary for display in UI
 */
export async function getImageGenUsageSummary(userId: string): Promise<string> {
  const usage = await getImageGenUsage(userId);
  return `${usage.todayCount}/${usage.dailyLimit} hoy | ${usage.monthCount}/${usage.monthlyLimit} este mes`;
}

/**
 * Get user's image generation history
 */
export async function getImageGenHistory(
  userId: string,
  limit: number = 20,
  offset: number = 0
) {
  try {
    const images = await db
      .select()
      .from(imageGenUsage)
      .where(eq(imageGenUsage.userId, userId))
      .orderBy(sql`${imageGenUsage.createdAt} DESC`)
      .limit(limit)
      .offset(offset);

    return images;
  } catch (error) {
    console.error("[ImageGen Usage] Error getting history:", error);
    return [];
  }
}
