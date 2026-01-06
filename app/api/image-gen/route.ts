import { NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  canGenerateImage,
  validateImageParams,
  recordImageGenUsage,
  getImageGenUsage,
} from '@/lib/image-gen-usage';
import { getUserPlanName } from '@/lib/subscription';
import { getImageGenLimits } from '@/lib/memory/plan-limits';
import { applyStyleToPrompt, getStylePreset } from '@/lib/image-gen/style-presets';
import type { ImageGenQuality, ImageGenSize } from '@/lib/memory/plan-limits';

export const maxDuration = 120; // 120 seconds timeout for FLUX Pro

// Configure fal client
fal.config({
  credentials: process.env.FAL_AI_API_KEY,
});

/**
 * POST /api/image-gen
 * Generate an image using FLUX Pro via Fal.ai
 * High quality professional image generation
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
      quality = 'low',
      size = '1024x1024',
      stylePreset = 'auto',
      stream = false,
    } = body as {
      prompt: string;
      quality?: ImageGenQuality;
      size?: ImageGenSize;
      stylePreset?: string;
      stream?: boolean;
    };

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3) {
      return NextResponse.json(
        { error: 'El prompt es requerido (mínimo 3 caracteres)' },
        { status: 400 }
      );
    }

    // 3. Check usage limits
    const { allowed, reason, usage } = await canGenerateImage(user.id);

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

    // 4. Validate parameters against plan
    const planName = await getUserPlanName(user.id);
    const planLimits = getImageGenLimits(planName);
    const validation = validateImageParams(planName, quality, size);

    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // 5. Check premium style access
    const preset = getStylePreset(stylePreset);
    if (preset.premium && !planLimits.premiumStyles) {
      return NextResponse.json(
        { error: `El estilo "${preset.name}" requiere un plan Professional o superior.` },
        { status: 403 }
      );
    }

    // 6. Check API Key (Fal.ai)
    const apiKey = process.env.FAL_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Generación de imágenes no configurada' },
        { status: 500 }
      );
    }

    // 7. Apply style modifier to prompt
    const enhancedPrompt = applyStyleToPrompt(prompt.trim(), stylePreset);

    // 8. FLUX Pro doesn't support streaming, use direct generation
    // Generate image using FLUX Pro via Fal.ai
    return handleFluxGeneration({
      prompt: enhancedPrompt,
      size,
      quality,
      user,
      supabase,
      originalPrompt: prompt.trim(),
      stylePreset,
      startTime,
      usage,
    });
  } catch (error) {
    console.error('[ImageGen] Error:', error);
    return NextResponse.json({ error: 'Error al generar imagen' }, { status: 500 });
  }
}

/**
 * FLUX Pro image generation via Fal.ai
 */
async function handleFluxGeneration({
  prompt,
  size,
  quality,
  user,
  supabase,
  originalPrompt,
  stylePreset,
  startTime,
  usage,
}: {
  prompt: string;
  size: ImageGenSize;
  quality: ImageGenQuality;
  user: { id: string };
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  originalPrompt: string;
  stylePreset: string;
  startTime: number;
  usage: Awaited<ReturnType<typeof canGenerateImage>>['usage'];
}) {
  // Map size to FLUX Pro format
  const { width, height } = mapSizeToFlux(size);

  // Select FLUX model based on quality
  const endpoint = getFluxEndpoint(quality);

  try {
    // Call FLUX Pro via Fal.ai
    const result = await fal.subscribe(endpoint, {
      input: {
        prompt: prompt.slice(0, 2000), // FLUX prompt limit
        image_size: {
          width,
          height,
        },
        num_images: 1,
        enable_safety_checker: true,
        safety_tolerance: '2', // Moderate tolerance
      },
    });

    const generationTimeMs = Date.now() - startTime;
    const imageUrl = (result.data as { images?: Array<{ url: string }> })?.images?.[0]?.url;

    if (!imageUrl) {
      console.error('[ImageGen] FLUX returned no image');
      return NextResponse.json(
        { error: 'No se pudo generar la imagen' },
        { status: 500 }
      );
    }

    // Download image and upload to Supabase Storage for persistence
    let publicUrl: string = imageUrl;
    let storagePath: string | undefined;

    try {
      // Fetch the generated image
      const imageResponse = await fetch(imageUrl);
      if (imageResponse.ok) {
        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

        // Generate unique filename
        const imageId = crypto.randomUUID();
        storagePath = `${user.id}/${imageId}_${size}.png`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('generated-images')
          .upload(storagePath, imageBuffer, {
            contentType: 'image/png',
            upsert: false,
          });

        if (!uploadError) {
          // Get signed URL (valid for 7 days)
          const { data: urlData, error: signError } = await supabase.storage
            .from('generated-images')
            .createSignedUrl(storagePath, 60 * 60 * 24 * 7);

          if (!signError && urlData) {
            publicUrl = urlData.signedUrl;
          }
        } else {
          console.error('[ImageGen] Storage upload error:', uploadError);
        }
      }
    } catch (storageError) {
      console.error('[ImageGen] Storage error:', storageError);
      // Keep using the original Fal.ai URL as fallback
    }

    // Record usage
    recordImageGenUsage(user.id, {
      prompt: originalPrompt,
      revisedPrompt: prompt, // FLUX uses the enhanced prompt
      model: 'flux-pro',
      quality,
      size,
      stylePreset,
      storagePath,
      generationTimeMs,
    }).catch((err) => {
      console.error('[ImageGen] Failed to record usage:', err);
    });

    return NextResponse.json({
      success: true,
      image: {
        url: publicUrl,
        revisedPrompt: prompt,
        size,
        quality,
        stylePreset,
      },
      usage: {
        remainingToday: Math.max(0, (usage?.remainingToday || 1) - 1),
        remainingMonth: Math.max(0, (usage?.remainingMonth || 1) - 1),
        dailyLimit: usage?.dailyLimit,
        monthlyLimit: usage?.monthlyLimit,
      },
      generationTimeMs,
    });

  } catch (falError) {
    console.error('[ImageGen] FLUX Pro error:', falError);
    return handleFluxError(falError);
  }
}

/**
 * Map our size format to FLUX Pro dimensions
 */
function mapSizeToFlux(size: ImageGenSize): { width: number; height: number } {
  switch (size) {
    case '1024x1024': return { width: 1024, height: 1024 };
    case '1024x1536': return { width: 1024, height: 1536 };
    case '1536x1024': return { width: 1536, height: 1024 };
    case 'auto': return { width: 1024, height: 1024 }; // Default to square
    default: return { width: 1024, height: 1024 };
  }
}

/**
 * Get FLUX endpoint based on quality level
 * - low: flux-schnell (fast, ~$0.003/image)
 * - medium: flux-pro (balanced, ~$0.05/megapixel)
 * - high: flux-pro/v1.1 (highest quality, ~$0.05/megapixel)
 */
function getFluxEndpoint(quality: ImageGenQuality): string {
  switch (quality) {
    case 'low': return 'fal-ai/flux/schnell';
    case 'medium': return 'fal-ai/flux-pro';
    case 'high': return 'fal-ai/flux-pro/v1.1';
    default: return 'fal-ai/flux-pro';
  }
}

/**
 * Handle FLUX API errors
 */
function handleFluxError(error: unknown): NextResponse {
  const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

  if (errorMessage.includes('content') || errorMessage.includes('safety')) {
    return NextResponse.json(
      { error: 'Contenido no permitido', message: 'El prompt viola las políticas de contenido.' },
      { status: 400 }
    );
  }

  if (errorMessage.includes('rate') || errorMessage.includes('limit')) {
    return NextResponse.json(
      { error: 'Límite de API excedido', message: 'Demasiadas solicitudes. Intenta en unos minutos.' },
      { status: 429 }
    );
  }

  return NextResponse.json(
    { error: 'Error al generar la imagen', message: errorMessage },
    { status: 500 }
  );
}

/**
 * GET /api/image-gen
 * Get usage statistics
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const usage = await getImageGenUsage(user.id);

    return NextResponse.json({
      usage: {
        todayCount: usage.todayCount,
        monthCount: usage.monthCount,
        dailyLimit: usage.dailyLimit,
        monthlyLimit: usage.monthlyLimit,
        remainingToday: usage.remainingToday,
        remainingMonth: usage.remainingMonth,
        allowedQualities: usage.allowedQualities,
        allowedSizes: usage.allowedSizes,
        maxResolution: usage.maxResolution,
        planName: usage.planName,
        // FLUX Pro features
        premiumStyles: usage.premiumStyles,
      },
    });
  } catch (error) {
    console.error('[ImageGen] Error getting usage:', error);
    return NextResponse.json({ error: 'Error al obtener uso' }, { status: 500 });
  }
}
