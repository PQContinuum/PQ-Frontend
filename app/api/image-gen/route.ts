import { NextRequest, NextResponse } from 'next/server';
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

export const maxDuration = 120; // 120 seconds timeout for gpt-image-1 (can take up to 2 min)

/**
 * POST /api/image-gen
 * Generate an image using gpt-image-1 (OpenAI's latest model)
 * Supports streaming with partial images
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

    // 6. Check API Key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Generación de imágenes no configurada' },
        { status: 500 }
      );
    }

    // 7. Apply style modifier to prompt
    const enhancedPrompt = applyStyleToPrompt(prompt.trim(), stylePreset);

    // 8. Determine if streaming should be used
    const useStreaming = stream && planLimits.streamingEnabled;
    const partialImages = useStreaming ? planLimits.partialImages : 0;

    // 9. Call OpenAI gpt-image-1 API
    if (useStreaming && partialImages > 0) {
      // STREAMING MODE - Return partial images as they generate
      return handleStreamingGeneration({
        apiKey,
        prompt: enhancedPrompt,
        size,
        quality,
        partialImages,
        user,
        supabase,
        originalPrompt: prompt.trim(),
        stylePreset,
        startTime,
        usage,
      });
    } else {
      // NON-STREAMING MODE - Wait for full image
      return handleNonStreamingGeneration({
        apiKey,
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
    }
  } catch (error) {
    console.error('[ImageGen] Error:', error);
    return NextResponse.json({ error: 'Error al generar imagen' }, { status: 500 });
  }
}

/**
 * Non-streaming image generation
 */
async function handleNonStreamingGeneration({
  apiKey,
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
  apiKey: string;
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
  // Map size to gpt-image-1 format
  const apiSize = mapSizeToApi(size);

  const openaiResponse = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt: prompt.slice(0, 32000), // gpt-image-1 accepts longer prompts
      n: 1,
      size: apiSize,
      quality,
    }),
  });

  if (!openaiResponse.ok) {
    const error = await openaiResponse.json().catch(() => ({}));
    console.error('[ImageGen] OpenAI error:', error);
    return handleOpenAIError(error, openaiResponse.status);
  }

  const result = await openaiResponse.json();
  const imageData = result.data[0];
  const generationTimeMs = Date.now() - startTime;

  // gpt-image-1 returns base64, convert to URL via Supabase Storage
  let publicUrl: string;
  let storagePath: string | undefined;

  try {
    // Decode base64 image
    const imageBuffer = Buffer.from(imageData.b64_json, 'base64');

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

    if (uploadError) {
      console.error('[ImageGen] Storage upload error:', uploadError);
      // Create data URL as fallback
      publicUrl = `data:image/png;base64,${imageData.b64_json}`;
    } else {
      // Get signed URL (valid for 7 days)
      const { data: urlData, error: signError } = await supabase.storage
        .from('generated-images')
        .createSignedUrl(storagePath, 60 * 60 * 24 * 7);

      if (!signError && urlData) {
        publicUrl = urlData.signedUrl;
      } else {
        publicUrl = `data:image/png;base64,${imageData.b64_json}`;
      }
    }
  } catch (storageError) {
    console.error('[ImageGen] Storage error:', storageError);
    publicUrl = `data:image/png;base64,${imageData.b64_json}`;
  }

  // Record usage
  recordImageGenUsage(user.id, {
    prompt: originalPrompt,
    revisedPrompt: imageData.revised_prompt,
    model: 'gpt-image-1',
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
      revisedPrompt: imageData.revised_prompt,
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
}

/**
 * Streaming image generation with partial images
 */
async function handleStreamingGeneration({
  apiKey,
  prompt,
  size,
  quality,
  partialImages,
  user,
  supabase,
  originalPrompt,
  stylePreset,
  startTime,
  usage,
}: {
  apiKey: string;
  prompt: string;
  size: ImageGenSize;
  quality: ImageGenQuality;
  partialImages: number;
  user: { id: string };
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  originalPrompt: string;
  stylePreset: string;
  startTime: number;
  usage: Awaited<ReturnType<typeof canGenerateImage>>['usage'];
}) {
  const apiSize = mapSizeToApi(size);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const openaiResponse = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-image-1',
            prompt: prompt.slice(0, 32000),
            n: 1,
            size: apiSize,
            quality,
            stream: true,
            partial_images: partialImages,
          }),
        });

        if (!openaiResponse.ok) {
          const error = await openaiResponse.json().catch(() => ({}));
          console.error('[ImageGen] OpenAI streaming error:', error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            event: 'error',
            error: getErrorMessage(error)
          })}\n\n`));
          controller.close();
          return;
        }

        const reader = openaiResponse.body?.getReader();
        if (!reader) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            event: 'error',
            error: 'No response body'
          })}\n\n`));
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';
        let finalImage: { b64_json: string; revised_prompt?: string } | null = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);

                // Handle partial image
                if (parsed.partial_image_index !== undefined && parsed.b64_json) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                    event: 'partial',
                    index: parsed.partial_image_index,
                    image: `data:image/png;base64,${parsed.b64_json}`,
                  })}\n\n`));
                }

                // Handle final image
                if (parsed.data?.[0]?.b64_json) {
                  finalImage = parsed.data[0];
                }
              } catch {
                // Ignore parse errors for incomplete chunks
              }
            }
          }
        }

        // Process final image
        if (finalImage) {
          const generationTimeMs = Date.now() - startTime;
          let publicUrl: string;
          let storagePath: string | undefined;

          try {
            const imageBuffer = Buffer.from(finalImage.b64_json, 'base64');
            const imageId = crypto.randomUUID();
            storagePath = `${user.id}/${imageId}_${size}.png`;

            const { error: uploadError } = await supabase.storage
              .from('generated-images')
              .upload(storagePath, imageBuffer, {
                contentType: 'image/png',
                upsert: false,
              });

            if (!uploadError) {
              const { data: urlData } = await supabase.storage
                .from('generated-images')
                .createSignedUrl(storagePath, 60 * 60 * 24 * 7);
              publicUrl = urlData?.signedUrl || `data:image/png;base64,${finalImage.b64_json}`;
            } else {
              publicUrl = `data:image/png;base64,${finalImage.b64_json}`;
            }
          } catch {
            publicUrl = `data:image/png;base64,${finalImage.b64_json}`;
          }

          // Record usage
          recordImageGenUsage(user.id, {
            prompt: originalPrompt,
            revisedPrompt: finalImage.revised_prompt,
            model: 'gpt-image-1',
            quality,
            size,
            stylePreset,
            storagePath,
            generationTimeMs,
          }).catch(console.error);

          // Send final result
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            event: 'complete',
            image: {
              url: publicUrl,
              revisedPrompt: finalImage.revised_prompt,
              size,
              quality,
              stylePreset,
            },
            usage: {
              remainingToday: Math.max(0, (usage?.remainingToday || 1) - 1),
              remainingMonth: Math.max(0, (usage?.remainingMonth || 1) - 1),
            },
            generationTimeMs,
          })}\n\n`));
        }

        controller.close();
      } catch (error) {
        console.error('[ImageGen] Stream error:', error);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          event: 'error',
          error: 'Error durante la generación'
        })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

/**
 * Map our size format to OpenAI's gpt-image-1 API format
 */
function mapSizeToApi(size: ImageGenSize): string {
  switch (size) {
    case '1024x1024': return '1024x1024';
    case '1024x1536': return '1024x1536';
    case '1536x1024': return '1536x1024';
    case 'auto': return 'auto';
    default: return '1024x1024';
  }
}

/**
 * Get user-friendly error message from OpenAI error
 */
function getErrorMessage(error: Record<string, unknown>): string {
  const errorObj = error.error as Record<string, unknown> | undefined;
  const code = errorObj?.code;
  const message = errorObj?.message as string | undefined;

  if (code === 'content_policy_violation') {
    return 'El prompt viola las políticas de contenido. Por favor, modifícalo e intenta de nuevo.';
  }
  if (code === 'rate_limit_exceeded') {
    return 'Demasiadas solicitudes. Por favor, espera un momento e intenta de nuevo.';
  }
  if (message) {
    return message;
  }
  return 'Error al generar la imagen';
}

/**
 * Handle OpenAI API errors
 */
function handleOpenAIError(error: Record<string, unknown>, status: number) {
  const message = getErrorMessage(error);
  const errorObj = error.error as Record<string, unknown> | undefined;
  const code = errorObj?.code;

  if (code === 'content_policy_violation') {
    return NextResponse.json(
      { error: 'Contenido no permitido', message },
      { status: 400 }
    );
  }

  if (code === 'rate_limit_exceeded') {
    return NextResponse.json(
      { error: 'Límite de API excedido', message },
      { status: 429 }
    );
  }

  return NextResponse.json(
    { error: 'Error al generar la imagen', message },
    { status }
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
        // gpt-image-1 features
        streamingEnabled: usage.streamingEnabled,
        partialImages: usage.partialImages,
        premiumStyles: usage.premiumStyles,
      },
    });
  } catch (error) {
    console.error('[ImageGen] Error getting usage:', error);
    return NextResponse.json({ error: 'Error al obtener uso' }, { status: 500 });
  }
}
