import { NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  canGenerateVideo,
  validateVideoParams,
  getVideoGenUsage,
} from '@/lib/video-gen-usage';
import { getUserPlanName } from '@/lib/subscription';
import { getVideoGenLimits } from '@/lib/memory/plan-limits';
import {
  createGenerationJob,
  updateGenerationJob,
} from '@/db/queries/generation-jobs';
import type {
  VideoGenDuration,
  VideoGenAspectRatio,
  VideoGenMode,
} from '@/lib/memory/plan-limits';

// Shorter timeout - we just submit to queue and return
export const maxDuration = 30;

// Configure fal client
fal.config({
  credentials: process.env.FAL_AI_API_KEY,
});

// Types for Kling Video API
interface TextToVideoInput {
  prompt: string;
  duration?: VideoGenDuration;
  aspect_ratio?: VideoGenAspectRatio;
  negative_prompt?: string;
  cfg_scale?: number;
  generate_audio?: boolean;
}

interface ImageToVideoInput {
  prompt: string;
  image_url: string;
  duration?: VideoGenDuration;
  aspect_ratio?: VideoGenAspectRatio;
  negative_prompt?: string;
  cfg_scale?: number;
  tail_image_url?: string;
}

/**
 * POST /api/video-gen
 * Generate a video using Kling V2.6 Pro via Fal.ai
 * Now uses background job system with webhooks
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authentication
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // 2. Parse request
    const body = await request.json();
    const {
      prompt,
      mode = 'text-to-video',
      imageUrl,
      duration = '5',
      aspectRatio = '16:9',
      generateAudio,
      conversationId,
      messageId,
    } = body as {
      prompt: string;
      mode?: VideoGenMode;
      imageUrl?: string;
      duration?: VideoGenDuration;
      aspectRatio?: VideoGenAspectRatio;
      generateAudio?: boolean;
      conversationId?: string;
      messageId?: string;
    };

    // 3. Validate input
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3) {
      return NextResponse.json(
        { error: 'El prompt debe tener al menos 3 caracteres' },
        { status: 400 }
      );
    }

    if (mode === 'image-to-video' && !imageUrl) {
      return NextResponse.json(
        { error: 'Se requiere una imagen para el modo image-to-video' },
        { status: 400 }
      );
    }

    // 4. Check usage limits
    const { allowed, reason, usage } = await canGenerateVideo(user.id);

    if (!allowed) {
      return NextResponse.json(
        {
          error: 'Límite de generación alcanzado',
          message: reason,
          usage: {
            todayCount: usage?.todayCount,
            monthCount: usage?.monthCount,
            dailyLimit: usage?.dailyLimit,
            monthlyLimit: usage?.monthlyLimit,
          },
        },
        { status: 429 }
      );
    }

    // 5. Validate parameters against plan
    const planName = await getUserPlanName(user.id);
    const planLimits = getVideoGenLimits(planName);
    const validation = validateVideoParams(planName, duration, aspectRatio, mode);

    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // 6. Determine audio setting based on plan
    const shouldGenerateAudio = generateAudio ?? planLimits.audioEnabled;
    const finalAudioEnabled = shouldGenerateAudio && planLimits.audioEnabled;

    // 7. Create job in database FIRST
    const inputParams = {
      prompt: prompt.trim(),
      mode,
      duration,
      aspectRatio,
      imageUrl,
      generateAudio: finalAudioEnabled,
    };

    const job = await createGenerationJob({
      userId: user.id,
      conversationId: conversationId || null,
      messageId: messageId || null,
      jobType: 'video',
      status: 'pending',
      inputParams: JSON.stringify(inputParams),
      provider: 'fal-ai',
      progressMessage: 'Iniciando generación...',
    });

    console.log(`[VideoGen] Created job ${job.id} for user ${user.id}`);

    // 8. Select endpoint based on mode
    const endpoint = mode === 'image-to-video'
      ? 'fal-ai/kling-video/v2.6/pro/image-to-video'
      : 'fal-ai/kling-video/v2.6/pro/text-to-video';

    // 9. Build input based on mode
    const falInput: TextToVideoInput | ImageToVideoInput = mode === 'image-to-video'
      ? {
          prompt: prompt.trim(),
          image_url: imageUrl!,
          duration,
          aspect_ratio: aspectRatio,
          negative_prompt: 'blur, distort, low quality, pixelated, artifacts',
          cfg_scale: 0.5,
        }
      : {
          prompt: prompt.trim(),
          duration,
          aspect_ratio: aspectRatio,
          negative_prompt: 'blur, distort, low quality, pixelated, artifacts',
          cfg_scale: 0.5,
          generate_audio: finalAudioEnabled,
        };

    // 10. Get webhook URL
    const webhookUrl = process.env.FAL_WEBHOOK_URL ||
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://continuumai.app'}/api/webhooks/fal-ai`;

    console.log(`[VideoGen] Submitting to Fal.ai queue with webhook: ${webhookUrl}`);

    // 11. Submit to Fal.ai queue (non-blocking)
    try {
      const queueResult = await fal.queue.submit(endpoint, {
        input: falInput,
        webhookUrl,
      });

      const requestId = queueResult.request_id;
      console.log(`[VideoGen] Submitted to queue, request_id: ${requestId}`);

      // 12. Update job with provider request ID
      await updateGenerationJob(job.id, user.id, {
        status: 'queued',
        providerRequestId: requestId,
        startedAt: new Date(),
        progressMessage: 'En cola de generación...',
      });

      // 13. Return job info immediately
      return NextResponse.json({
        success: true,
        jobId: job.id,
        status: 'queued',
        message: 'Video en proceso de generación. Puedes cerrar esta página y regresar más tarde.',
        usage: {
          remainingToday: Math.max(0, (usage?.remainingToday || 1) - 1),
          remainingMonth: Math.max(0, (usage?.remainingMonth || 1) - 1),
          dailyLimit: usage?.dailyLimit,
          monthlyLimit: usage?.monthlyLimit,
        },
      });

    } catch (falError) {
      console.error('[VideoGen] Fal.ai queue submission failed:', falError);

      // Update job as failed
      await updateGenerationJob(job.id, user.id, {
        status: 'failed',
        errorMessage: falError instanceof Error ? falError.message : 'Error al enviar a Fal.ai',
        completedAt: new Date(),
      });

      throw falError;
    }

  } catch (error) {
    console.error('[VideoGen] Error:', error);

    // Handle specific Fal.ai errors
    if (error instanceof Error) {
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Límite de solicitudes alcanzado. Intenta en unos minutos.' },
          { status: 429 }
        );
      }
      if (error.message.includes('invalid') || error.message.includes('Invalid')) {
        return NextResponse.json(
          { error: 'Parámetros inválidos. Revisa el prompt y la imagen.' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Error al generar el video. Intenta de nuevo.' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/video-gen
 * Get video generation usage/status
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const usage = await getVideoGenUsage(user.id);

    return NextResponse.json({
      available: true,
      usage: {
        todayCount: usage.todayCount,
        monthCount: usage.monthCount,
        dailyLimit: usage.dailyLimit,
        monthlyLimit: usage.monthlyLimit,
        remainingToday: usage.remainingToday,
        remainingMonth: usage.remainingMonth,
        allowedDurations: usage.allowedDurations,
        allowedAspectRatios: usage.allowedAspectRatios,
        allowedModes: usage.allowedModes,
        audioEnabled: usage.audioEnabled,
        planName: usage.planName,
      },
    });

  } catch (error) {
    console.error('[VideoGen] GET Error:', error);
    return NextResponse.json(
      { error: 'Error al obtener información' },
      { status: 500 }
    );
  }
}
