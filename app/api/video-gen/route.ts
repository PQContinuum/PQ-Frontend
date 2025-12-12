import { NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  canGenerateVideo,
  validateVideoParams,
  recordVideoGenUsage,
  getVideoGenUsage,
} from '@/lib/video-gen-usage';
import { getUserPlanName } from '@/lib/subscription';
import { getVideoGenLimits } from '@/lib/memory/plan-limits';
import type {
  VideoGenDuration,
  VideoGenAspectRatio,
  VideoGenMode,
} from '@/lib/memory/plan-limits';

export const maxDuration = 300; // 5 minutes - video generation takes time

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

interface FalVideoResult {
  video: {
    url: string;
    file_size?: number;
    file_name?: string;
    content_type?: string;
  };
}

/**
 * POST /api/video-gen
 * Generate a video using Kling V2.6 Pro via Fal.ai
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

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
    } = body as {
      prompt: string;
      mode?: VideoGenMode;
      imageUrl?: string;
      duration?: VideoGenDuration;
      aspectRatio?: VideoGenAspectRatio;
      generateAudio?: boolean;
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

    // 7. Select endpoint based on mode
    const endpoint = mode === 'image-to-video'
      ? 'fal-ai/kling-video/v2.6/pro/image-to-video'
      : 'fal-ai/kling-video/v2.6/pro/text-to-video';

    // 8. Build input based on mode
    const input: TextToVideoInput | ImageToVideoInput = mode === 'image-to-video'
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

    console.log(`[VideoGen] Starting ${mode} generation for user ${user.id}`);
    console.log(`[VideoGen] Endpoint: ${endpoint}`);
    console.log(`[VideoGen] Audio: ${finalAudioEnabled}, Duration: ${duration}s`);

    // 9. Call Fal.ai API with queue (video generation is long-running)
    const result = await fal.subscribe(endpoint, {
      input,
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS' && update.logs) {
          update.logs.forEach((log) => {
            console.log(`[VideoGen] Progress: ${log.message}`);
          });
        }
      },
    }) as { data: FalVideoResult; requestId: string };

    const generationTime = Date.now() - startTime;
    console.log(`[VideoGen] Completed in ${generationTime}ms`);

    if (!result.data?.video?.url) {
      console.error('[VideoGen] No video URL in response:', result);
      return NextResponse.json(
        { error: 'No se pudo generar el video' },
        { status: 500 }
      );
    }

    // 10. Download and save video to Supabase Storage
    const videoUrl = result.data.video.url;
    let savedVideoUrl = videoUrl;
    let storagePath: string | undefined;

    try {
      const videoResponse = await fetch(videoUrl);
      if (videoResponse.ok) {
        const videoBuffer = await videoResponse.arrayBuffer();
        const fileName = `video-${user.id}-${Date.now()}.mp4`;
        storagePath = `videos/${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('attachments')
          .upload(storagePath, videoBuffer, {
            contentType: 'video/mp4',
            upsert: false,
          });

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from('attachments')
            .getPublicUrl(storagePath);
          savedVideoUrl = publicUrlData.publicUrl;
          console.log(`[VideoGen] Saved to storage: ${storagePath}`);
        } else {
          console.warn('[VideoGen] Failed to save to storage:', uploadError);
        }
      }
    } catch (saveError) {
      console.warn('[VideoGen] Error saving video:', saveError);
      // Continue with original URL if save fails
    }

    // 11. Record usage
    recordVideoGenUsage(user.id, {
      prompt: prompt.trim(),
      mode,
      duration,
      aspectRatio,
      audioEnabled: finalAudioEnabled,
      sourceImageUrl: imageUrl,
      storagePath,
      originalUrl: videoUrl,
      requestId: result.requestId,
      generationTimeMs: generationTime,
    }).catch((err) => {
      console.error('[VideoGen] Failed to record usage:', err);
    });

    // 12. Return result with updated usage
    return NextResponse.json({
      success: true,
      video: {
        url: savedVideoUrl,
        originalUrl: videoUrl,
        duration,
        aspectRatio,
        mode,
        audioEnabled: finalAudioEnabled,
        generationTimeMs: generationTime,
      },
      usage: {
        remainingToday: Math.max(0, (usage?.remainingToday || 1) - 1),
        remainingMonth: Math.max(0, (usage?.remainingMonth || 1) - 1),
        dailyLimit: usage?.dailyLimit,
        monthlyLimit: usage?.monthlyLimit,
      },
      requestId: result.requestId,
    });

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
