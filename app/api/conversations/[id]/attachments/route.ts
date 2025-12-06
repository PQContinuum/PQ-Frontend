import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { conversationAttachments } from "@/db/schema";
import sharp, { Metadata } from "sharp"; // Install: npm install sharp

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'text/plain', 'text/markdown'];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;

    // Get authenticated user
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
        { status: 400 }
      );
    }

    // Validate file type
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
    const isDocument = ALLOWED_DOCUMENT_TYPES.includes(file.type);

    if (!isImage && !isDocument) {
      return NextResponse.json(
        { error: "Unsupported file type" },
        { status: 400 }
      );
    }

    // Generate storage path
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `${user.id}/${conversationId}/${timestamp}_${sanitizedFileName}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('conversation-attachments')
      .upload(storagePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 }
      );
    }

    // Generate signed URL (valid for 1 hour)
    const { data: signedUrlData } = await supabase.storage
      .from('conversation-attachments')
      .createSignedUrl(storagePath, 3600);

    // Generate thumbnail for images
    let thumbnailPath = null;
    let metadata: Metadata = {};

    if (isImage) {
      try {
        const image = sharp(buffer);
        const imageMetadata = await image.metadata();

        metadata = {
          width: imageMetadata.width,
          height: imageMetadata.height,
          format: imageMetadata.format,
        };

        // Create thumbnail (max 200x200)
        const thumbnail = await image
          .resize(200, 200, { fit: 'inside' })
          .jpeg({ quality: 80 })
          .toBuffer();

        thumbnailPath = `${user.id}/${conversationId}/thumb_${timestamp}_${sanitizedFileName}.jpg`;

        await supabase.storage
          .from('conversation-attachments')
          .upload(thumbnailPath, thumbnail, {
            contentType: 'image/jpeg',
          });
      } catch (err) {
        console.error('Thumbnail generation failed:', err);
      }
    }

    // Save to database
    const [attachment] = await db.insert(conversationAttachments).values({
      conversationId,
      userId: user.id,
      fileName: file.name,
      fileType: isImage ? 'image' : 'document',
      mimeType: file.type,
      fileSize: file.size,
      storagePath,
      signedUrl: signedUrlData?.signedUrl || null,
      signedUrlExpiry: new Date(Date.now() + 3600 * 1000),
      thumbnailPath,
      metadata: JSON.stringify(metadata),
    }).returning();

    return NextResponse.json({
      success: true,
      attachment: {
        id: attachment.id,
        fileName: attachment.fileName,
        fileType: attachment.fileType,
        fileSize: attachment.fileSize,
        mimeType: attachment.mimeType,
        url: signedUrlData?.signedUrl,
        thumbnailUrl: thumbnailPath ? signedUrlData?.signedUrl.replace(storagePath, thumbnailPath) : null,
        metadata,
      },
    });

  } catch (error) {
    console.error('Attachment upload error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}