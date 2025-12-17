import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { canUseTTS, recordTTSUsage } from '@/lib/tts-usage';

// Valid voices for gpt-4o-mini-tts (11 voices available)
const VALID_VOICES = ['alloy', 'ash', 'ballad', 'coral', 'echo', 'fable', 'nova', 'onyx', 'sage', 'shimmer', 'verse'] as const;
type Voice = (typeof VALID_VOICES)[number];

// Instructions for natural, warm speech
const TTS_INSTRUCTIONS = `Habla de manera natural, cálida y amigable.
Usa un tono conversacional como si estuvieras hablando con un amigo.
Pronuncia correctamente el español latinoamericano.
Mantén un ritmo fluido y pausas naturales.`;

export async function POST(request: NextRequest) {
  try {
    // Fast auth check
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request
    const { text, voice, format } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // =============================================
    // CHECK TTS USAGE LIMITS
    // =============================================
    const { allowed, reason, usage } = await canUseTTS(user.id);

    if (!allowed) {
      return NextResponse.json(
        {
          error: 'Límite de TTS alcanzado',
          message: reason,
          usage: {
            todayCount: usage?.todayCount,
            monthCount: usage?.monthCount,
            dailyLimit: usage?.dailyLimit,
            monthlyLimit: usage?.monthlyLimit,
          }
        },
        { status: 429 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'TTS not configured' }, { status: 500 });
    }

    const selectedVoice: Voice = VALID_VOICES.includes(voice as Voice) ? voice : 'nova';
    const inputText = text.slice(0, 4096);

    // Use PCM for streaming (faster), MP3 for fallback
    const responseFormat = format === 'pcm' ? 'pcm' : 'mp3';

    // =============================================
    // STREAMING TTS - Direct pipe from OpenAI
    // Using gpt-4o-mini-tts for better quality and steerability
    // =============================================
    const openaiResponse = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini-tts',
        voice: selectedVoice,
        input: inputText,
        instructions: TTS_INSTRUCTIONS,
        response_format: responseFormat,
        speed: 1.0,
      }),
    });

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text();
      console.error('[TTS] OpenAI error:', error);
      return NextResponse.json(
        { error: 'TTS generation failed' },
        { status: openaiResponse.status }
      );
    }

    // Record usage (async, don't wait)
    recordTTSUsage(user.id, inputText.length, selectedVoice).catch(err => {
      console.error('[TTS] Failed to record usage:', err);
    });

    // Stream directly to client
    const contentType = responseFormat === 'pcm' ? 'audio/pcm' : 'audio/mpeg';

    return new Response(openaiResponse.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'X-Audio-Format': responseFormat,
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error('[TTS] Error:', error);
    return NextResponse.json({ error: 'TTS failed' }, { status: 500 });
  }
}
