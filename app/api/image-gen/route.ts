import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  canGenerateImage,
  validateImageParams,
  recordImageGenUsage,
  getImageGenUsage,
} from '@/lib/image-gen-usage';
import { getUserPlanName } from '@/lib/subscription';
import type { ImageGenQuality, ImageGenSize, ImageGenStyle } from '@/lib/memory/plan-limits';

export const maxDuration = 60; // 60 seconds timeout for generation

/**
 * POST /api/image-gen
 * Generate an image using DALL-E 3
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
      quality = 'standard',
      size = '1024x1024',
      style = 'vivid',
    } = body as {
      prompt: string;
      quality?: ImageGenQuality;
      size?: ImageGenSize;
      style?: ImageGenStyle;
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
    const validation = validateImageParams(planName, quality, size);

    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // 5. Check API Key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Generación de imágenes no configurada' },
        { status: 500 }
      );
    }

    // 6. Call OpenAI DALL-E API
    const openaiResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt.trim().slice(0, 4000), // DALL-E 3 accepts up to 4000 chars
        n: 1,
        size,
        quality,
        style,
        response_format: 'url',
      }),
    });

    if (!openaiResponse.ok) {
      const error = await openaiResponse.json().catch(() => ({}));
      console.error('[ImageGen] OpenAI error:', error);

      // Handle specific OpenAI errors
      if (error.error?.code === 'content_policy_violation') {
        return NextResponse.json(
          {
            error: 'Contenido no permitido',
            message: 'El prompt viola las políticas de contenido. Por favor, modifícalo e intenta de nuevo.',
          },
          { status: 400 }
        );
      }

      if (error.error?.code === 'rate_limit_exceeded') {
        return NextResponse.json(
          {
            error: 'Límite de API excedido',
            message: 'Demasiadas solicitudes. Por favor, espera un momento e intenta de nuevo.',
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: 'Error al generar la imagen' },
        { status: openaiResponse.status }
      );
    }

    const result = await openaiResponse.json();
    const imageData = result.data[0];
    const generationTimeMs = Date.now() - startTime;

    // 7. Download and save to Supabase Storage
    let storagePath: string | undefined;
    let publicUrl: string | undefined;

    try {
      // Download image from OpenAI (URL expires in 1 hour)
      const imageResponse = await fetch(imageData.url);
      const imageArrayBuffer = await imageResponse.arrayBuffer();
      const imageBuffer = Buffer.from(imageArrayBuffer);

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
        // Continue without storage, use OpenAI temporary URL
      } else {
        // Get signed URL (valid for 7 days)
        const { data: urlData, error: signError } = await supabase.storage
          .from('generated-images')
          .createSignedUrl(storagePath, 60 * 60 * 24 * 7); // 7 days

        if (!signError && urlData) {
          publicUrl = urlData.signedUrl;
        }
      }
    } catch (storageError) {
      console.error('[ImageGen] Storage error:', storageError);
      // Continue without storage, use OpenAI temporary URL
    }

    // 8. Record usage (async, don't block response)
    recordImageGenUsage(user.id, {
      prompt: prompt.trim(),
      revisedPrompt: imageData.revised_prompt,
      quality,
      size,
      style,
      storagePath,
      originalUrl: imageData.url,
      generationTimeMs,
    }).catch((err) => {
      console.error('[ImageGen] Failed to record usage:', err);
    });

    // 9. Success response
    return NextResponse.json({
      success: true,
      image: {
        url: publicUrl || imageData.url, // Prefer Storage URL
        originalUrl: imageData.url, // OpenAI temporary URL (backup)
        revisedPrompt: imageData.revised_prompt,
        size,
        quality,
        style,
      },
      usage: {
        remainingToday: Math.max(0, (usage?.remainingToday || 1) - 1),
        remainingMonth: Math.max(0, (usage?.remainingMonth || 1) - 1),
        dailyLimit: usage?.dailyLimit,
        monthlyLimit: usage?.monthlyLimit,
      },
      generationTimeMs,
    });
  } catch (error) {
    console.error('[ImageGen] Error:', error);
    return NextResponse.json({ error: 'Error al generar imagen' }, { status: 500 });
  }
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
      },
    });
  } catch (error) {
    console.error('[ImageGen] Error getting usage:', error);
    return NextResponse.json({ error: 'Error al obtener uso' }, { status: 500 });
  }
}
