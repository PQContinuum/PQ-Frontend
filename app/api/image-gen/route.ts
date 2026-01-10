import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
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

export const maxDuration = 120; // 120 seconds timeout for GPT Image

// Configure OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * POST /api/image-gen
 * Generate an image using OpenAI GPT Image (gpt-image-1)
 * Supports both text-to-image and image-to-image generation
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
      quality = 'medium',
      size = '1024x1024',
      stylePreset = 'auto',
      referenceImageUrl,
      imageStrength = 0.75,
    } = body as {
      prompt: string;
      quality?: ImageGenQuality;
      size?: ImageGenSize;
      stylePreset?: string;
      referenceImageUrl?: string;
      imageStrength?: number;
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

    // 6. Check API Key (OpenAI)
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Generación de imágenes no configurada' },
        { status: 500 }
      );
    }

    // 7. Apply style modifier to prompt
    const enhancedPrompt = applyStyleToPrompt(prompt.trim(), stylePreset);

    // 8. Generate image using GPT Image
    const isImageToImage = !!referenceImageUrl;

    if (isImageToImage) {
      return handleImageToImage({
        prompt: enhancedPrompt,
        size,
        quality,
        user,
        supabase,
        originalPrompt: prompt.trim(),
        stylePreset,
        startTime,
        usage,
        referenceImageUrl,
        imageStrength,
      });
    } else {
      return handleTextToImage({
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
 * Text-to-Image generation using GPT Image
 */
async function handleTextToImage({
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
  const gptImageSize = mapSizeToGptImage(size);
  const gptImageQuality = mapQualityToGptImage(quality);

  try {
    // Call GPT Image for text-to-image
    const response = await openai.images.generate({
      model: 'gpt-image-1',
      prompt: prompt.slice(0, 32000), // GPT Image supports longer prompts
      n: 1,
      size: gptImageSize,
      quality: gptImageQuality,
    });

    return processImageResponse({
      response,
      user,
      supabase,
      originalPrompt,
      enhancedPrompt: prompt,
      quality,
      size,
      stylePreset,
      startTime,
      usage,
      model: 'gpt-image-1',
    });

  } catch (error) {
    console.error('[ImageGen] GPT Image text-to-image error:', error);
    return handleGptImageError(error);
  }
}

/**
 * Image-to-Image generation using GPT Image
 * Uses the reference image as context for the generation
 */
async function handleImageToImage({
  prompt,
  size,
  quality,
  user,
  supabase,
  originalPrompt,
  stylePreset,
  startTime,
  usage,
  referenceImageUrl,
  imageStrength,
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
  referenceImageUrl: string;
  imageStrength: number;
}) {
  const gptImageSize = mapSizeToGptImage(size);

  try {
    // Download the reference image
    const imageResponse = await fetch(referenceImageUrl);
    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: 'No se pudo descargar la imagen de referencia' },
        { status: 400 }
      );
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    // Build the prompt - keep it simple to avoid moderation issues
    // The imageStrength is conceptual - GPT Image handles the balance naturally
    const fullPrompt = prompt;

    // Create a File object from the buffer for the OpenAI API
    const file = new File([imageBuffer], 'reference.png', { type: 'image/png' });

    // Call GPT Image edit endpoint with the reference image as File
    const response = await openai.images.edit({
      model: 'gpt-image-1',
      image: file,
      prompt: fullPrompt.slice(0, 32000),
      n: 1,
      size: gptImageSize,
    });

    return processImageResponse({
      response,
      user,
      supabase,
      originalPrompt,
      enhancedPrompt: fullPrompt,
      quality,
      size,
      stylePreset,
      startTime,
      usage,
      model: 'gpt-image-1',
      isImageToImage: true,
    });

  } catch (error) {
    console.error('[ImageGen] GPT Image image-to-image error:', error);
    return handleGptImageError(error);
  }
}

/**
 * Process the image response and upload to storage
 */
async function processImageResponse({
  response,
  user,
  supabase,
  originalPrompt,
  enhancedPrompt,
  quality,
  size,
  stylePreset,
  startTime,
  usage,
  model,
  isImageToImage = false,
}: {
  response: OpenAI.Images.ImagesResponse;
  user: { id: string };
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  originalPrompt: string;
  enhancedPrompt: string;
  quality: ImageGenQuality;
  size: ImageGenSize;
  stylePreset: string;
  startTime: number;
  usage: Awaited<ReturnType<typeof canGenerateImage>>['usage'];
  model: string;
  isImageToImage?: boolean;
}) {
  const generationTimeMs = Date.now() - startTime;

  // GPT Image returns base64 by default
  const imageData = response.data[0];
  const revisedPrompt = imageData?.revised_prompt;

  // Get the image - could be base64 or URL depending on response_format
  let imageBuffer: Buffer;
  let imageUrl: string | undefined;

  if (imageData?.b64_json) {
    imageBuffer = Buffer.from(imageData.b64_json, 'base64');
  } else if (imageData?.url) {
    imageUrl = imageData.url;
    const fetchResponse = await fetch(imageUrl);
    if (!fetchResponse.ok) {
      return NextResponse.json(
        { error: 'No se pudo obtener la imagen generada' },
        { status: 500 }
      );
    }
    imageBuffer = Buffer.from(await fetchResponse.arrayBuffer());
  } else {
    console.error('[ImageGen] GPT Image returned no image data');
    return NextResponse.json(
      { error: 'No se pudo generar la imagen' },
      { status: 500 }
    );
  }

  // Upload to Supabase Storage for persistence
  let publicUrl: string;
  let storagePath: string | undefined;

  try {
    const imageId = crypto.randomUUID();
    storagePath = `${user.id}/${imageId}_${size}.png`;

    const { error: uploadError } = await supabase.storage
      .from('generated-images')
      .upload(storagePath, imageBuffer, {
        contentType: 'image/png',
        upsert: false,
      });

    if (!uploadError) {
      const { data: urlData, error: signError } = await supabase.storage
        .from('generated-images')
        .createSignedUrl(storagePath, 60 * 60 * 24 * 7); // 7 days

      if (!signError && urlData) {
        publicUrl = urlData.signedUrl;
      } else {
        // Fallback to base64 data URL if signing fails
        publicUrl = `data:image/png;base64,${imageBuffer.toString('base64')}`;
      }
    } else {
      console.error('[ImageGen] Storage upload error:', uploadError);
      // Fallback to base64 data URL
      publicUrl = `data:image/png;base64,${imageBuffer.toString('base64')}`;
    }
  } catch (storageError) {
    console.error('[ImageGen] Storage error:', storageError);
    // Fallback to base64 data URL
    publicUrl = `data:image/png;base64,${imageBuffer.toString('base64')}`;
  }

  // Record usage
  recordImageGenUsage(user.id, {
    prompt: originalPrompt,
    revisedPrompt: revisedPrompt || enhancedPrompt,
    model,
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
      revisedPrompt: revisedPrompt || enhancedPrompt,
      size,
      quality,
      stylePreset,
      isImageToImage,
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
 * Map our size format to GPT Image dimensions
 * GPT Image supports: 1024x1024, 1024x1536, 1536x1024 (and more)
 */
function mapSizeToGptImage(size: ImageGenSize): '1024x1024' | '1536x1024' | '1024x1536' {
  switch (size) {
    case '1024x1024': return '1024x1024';
    case '1024x1536': return '1024x1536';
    case '1536x1024': return '1536x1024';
    case 'auto': return '1024x1024';
    default: return '1024x1024';
  }
}

/**
 * Map our quality format to GPT Image quality
 * GPT Image supports: low, medium, high
 */
function mapQualityToGptImage(quality: ImageGenQuality): 'low' | 'medium' | 'high' {
  return quality; // GPT Image uses the same quality levels
}

/**
 * Handle GPT Image API errors
 */
function handleGptImageError(error: unknown): NextResponse {
  const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

  // Check for content policy violation
  if (errorMessage.includes('content_policy') || errorMessage.includes('safety') || errorMessage.includes('moderation')) {
    return NextResponse.json(
      { error: 'Contenido no permitido', message: 'El prompt viola las políticas de contenido de OpenAI.' },
      { status: 400 }
    );
  }

  // Check for rate limiting
  if (errorMessage.includes('rate') || errorMessage.includes('limit') || errorMessage.includes('429')) {
    return NextResponse.json(
      { error: 'Límite de API excedido', message: 'Demasiadas solicitudes. Intenta en unos minutos.' },
      { status: 429 }
    );
  }

  // Check for billing issues
  if (errorMessage.includes('billing') || errorMessage.includes('quota') || errorMessage.includes('insufficient')) {
    return NextResponse.json(
      { error: 'Error de facturación', message: 'Problema con la cuenta de OpenAI.' },
      { status: 500 }
    );
  }

  // Check for invalid image
  if (errorMessage.includes('image') && (errorMessage.includes('invalid') || errorMessage.includes('format'))) {
    return NextResponse.json(
      { error: 'Imagen inválida', message: 'El formato de la imagen de referencia no es válido.' },
      { status: 400 }
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
        premiumStyles: usage.premiumStyles,
        // GPT Image specific
        imageToImageEnabled: true,
      },
    });
  } catch (error) {
    console.error('[ImageGen] Error getting usage:', error);
    return NextResponse.json({ error: 'Error al obtener uso' }, { status: 500 });
  }
}
