/**
 * Import Media Uploader
 *
 * Uploads extracted media files from ChatGPT export to the backend
 * and returns a mapping for conversation import.
 */

import type {
  ExtractedMediaFile,
  MediaMappingEntry,
  UploadProgress,
} from '@/types/chatgpt-export.types';
import { API_BASE_URL, getAuthHeadersForUpload } from '@/lib/api-client';

export interface UploadResult {
  mediaMapping: MediaMappingEntry[];
  failedUploads: FailedUpload[];
  totalUploaded: number;
  totalSize: number;
}

export interface FailedUpload {
  assetPointer: string;
  fileName: string;
  error: string;
}

interface UploadResponse {
  success: boolean;
  attachment?: {
    id: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    url: string;
    assetPointer?: string;
  };
  error?: string;
}

/**
 * Upload media files extracted from ChatGPT ZIP to the backend.
 * Files are uploaded sequentially to avoid overwhelming the server.
 *
 * @param mediaFiles - Array of extracted media files
 * @param onProgress - Callback for progress updates
 * @returns Upload result with mediaMapping and failed uploads
 */
export async function uploadMediaFiles(
  mediaFiles: ExtractedMediaFile[],
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  const mediaMapping: MediaMappingEntry[] = [];
  const failedUploads: FailedUpload[] = [];
  let totalSize = 0;

  // Get auth headers once
  let authHeaders: HeadersInit;
  try {
    authHeaders = await getAuthHeadersForUpload();
  } catch (error) {
    throw new Error(
      'No se encontró el token de autenticación. Por favor inicia sesión nuevamente.'
    );
  }

  for (let i = 0; i < mediaFiles.length; i++) {
    const mediaFile = mediaFiles[i];

    // Update progress
    if (onProgress) {
      onProgress({
        current: i + 1,
        total: mediaFiles.length,
        currentFile: mediaFile.fileName,
      });
    }

    try {
      const result = await uploadSingleFile(mediaFile, authHeaders);

      if (result.success && result.attachment) {
        mediaMapping.push({
          assetPointer: mediaFile.assetPointer,
          attachmentId: result.attachment.id,
          mediaType: mediaFile.mediaType,
        });
        totalSize += mediaFile.size;
      } else {
        failedUploads.push({
          assetPointer: mediaFile.assetPointer,
          fileName: mediaFile.fileName,
          error: result.error || 'Unknown error',
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Upload failed';
      failedUploads.push({
        assetPointer: mediaFile.assetPointer,
        fileName: mediaFile.fileName,
        error: errorMessage,
      });
      console.error(`[Media Uploader] Failed to upload ${mediaFile.fileName}:`, error);
    }
  }

  console.log(
    `[Media Uploader] Uploaded ${mediaMapping.length}/${mediaFiles.length} files, ` +
      `${failedUploads.length} failed`
  );

  return {
    mediaMapping,
    failedUploads,
    totalUploaded: mediaMapping.length,
    totalSize,
  };
}

/**
 * Upload a single media file to the backend.
 */
async function uploadSingleFile(
  mediaFile: ExtractedMediaFile,
  authHeaders: HeadersInit
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', mediaFile.file, mediaFile.fileName);
  formData.append('assetPointer', mediaFile.assetPointer);

  const response = await fetch(`${API_BASE_URL}/attachments/import-upload`, {
    method: 'POST',
    headers: authHeaders,
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `HTTP ${response.status}`;
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.message || errorMessage;
    } catch {
      // Use status text if JSON parsing fails
    }
    return { success: false, error: errorMessage };
  }

  const data = await response.json();
  return data;
}
