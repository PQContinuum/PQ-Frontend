import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Supported audio formats by Whisper
const SUPPORTED_FORMATS = [
  'audio/webm',
  'audio/mp4',
  'audio/mpeg',
  'audio/mpga',
  'audio/m4a',
  'audio/wav',
  'audio/ogg',
  'audio/flac',
];

// Max file size: 25MB (Whisper limit)
const MAX_FILE_SIZE = 25 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    // Check authentication
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File | null;
    const language = (formData.get('language') as string) || 'es';

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No se proporcionó archivo de audio' },
        { status: 400 }
      );
    }

    // Validate file size
    if (audioFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'El archivo de audio es muy grande (máximo 25MB)' },
        { status: 400 }
      );
    }

    // Validate file type
    const mimeType = audioFile.type.split(';')[0]; // Remove codec info
    if (!SUPPORTED_FORMATS.some(format => mimeType.startsWith(format.split('/')[0] + '/'))) {
      console.log('[Transcribe] Unsupported format:', audioFile.type);
      // Allow it anyway, Whisper is quite flexible
    }

    // Call OpenAI Whisper API
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: language,
      response_format: 'json',
      temperature: 0,
    });

    return NextResponse.json({
      text: transcription.text,
      language: language,
    });

  } catch (error) {
    console.error('[Transcribe] Error:', error);

    if (error instanceof OpenAI.APIError) {
      if (error.status === 400) {
        return NextResponse.json(
          { error: 'Formato de audio no válido o archivo corrupto' },
          { status: 400 }
        );
      }
      if (error.status === 413) {
        return NextResponse.json(
          { error: 'El archivo de audio es muy grande' },
          { status: 413 }
        );
      }
      return NextResponse.json(
        { error: 'Error del servicio de transcripción' },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
