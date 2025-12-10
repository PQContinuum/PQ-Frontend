import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const runtime = 'edge';

// Valid voices for tts-1
const VALID_VOICES = ['alloy', 'ash', 'coral', 'echo', 'fable', 'nova', 'onyx', 'sage', 'shimmer'] as const;
type Voice = (typeof VALID_VOICES)[number];

export async function POST(request: NextRequest) {
  try {
    // Fast auth check
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request
    const { text, voice } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'TTS not configured' }, { status: 500 });
    }

    const selectedVoice: Voice = VALID_VOICES.includes(voice as Voice) ? voice : 'nova';

    // =============================================
    // STREAMING TTS - Direct pipe from OpenAI
    // =============================================
    const openaiResponse = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',           // Fast model
        voice: selectedVoice,
        input: text.slice(0, 4096),
        response_format: 'mp3',
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

    // Stream directly to client - audio starts playing immediately
    return new Response(openaiResponse.body, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error('[TTS] Error:', error);
    return NextResponse.json({ error: 'TTS failed' }, { status: 500 });
  }
}
