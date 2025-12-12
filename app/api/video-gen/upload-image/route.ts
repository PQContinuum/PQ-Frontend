import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const maxDuration = 30;

// Allowed image types for video generation
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * POST /api/video-gen/upload-image
 * Upload an image to be used for image-to-video generation
 * Returns a public URL that can be used by Fal.ai
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authentication
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // 2. Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 });
    }

    // 3. Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no permitido. Usa JPG, PNG, WebP o GIF.' },
        { status: 400 }
      );
    }

    // 4. Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'El archivo es demasiado grande. Máximo 10MB.' },
        { status: 400 }
      );
    }

    // 5. Convert file to buffer
    const buffer = await file.arrayBuffer();

    // 6. Generate unique filename (path starts with user.id to match RLS policy)
    const timestamp = Date.now();
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `video-source-${timestamp}.${ext}`;
    const storagePath = `${user.id}/${fileName}`;

    // 7. Upload to Supabase Storage (using generated-images bucket which has proper RLS)
    const { error: uploadError } = await supabase.storage
      .from('generated-images')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
        cacheControl: '3600',
      });

    if (uploadError) {
      console.error('[VideoGen Upload] Storage error:', uploadError);
      return NextResponse.json(
        { error: 'Error al subir la imagen' },
        { status: 500 }
      );
    }

    // 8. Get signed URL (valid for 1 hour - enough for video generation)
    const { data: signedUrlData, error: signError } = await supabase.storage
      .from('generated-images')
      .createSignedUrl(storagePath, 60 * 60);

    if (signError || !signedUrlData) {
      console.error('[VideoGen Upload] Signed URL error:', signError);
      return NextResponse.json(
        { error: 'Error al generar URL de imagen' },
        { status: 500 }
      );
    }

    const publicUrl = signedUrlData.signedUrl;

    console.log(`[VideoGen Upload] Image uploaded: ${storagePath}`);

    // 9. Return success with URL
    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    });

  } catch (error) {
    console.error('[VideoGen Upload] Error:', error);
    return NextResponse.json(
      { error: 'Error al procesar la imagen' },
      { status: 500 }
    );
  }
}
