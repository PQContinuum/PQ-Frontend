/**
 * ChatGPT Media Extractor
 *
 * Extracts media files (images, audio) from ChatGPT export ZIP and maps them to
 * asset_pointer references found in conversation messages.
 */

import type {
  ChatGPTExportConversation,
  ExtractedMediaFile,
  ChatGPTMappingNode,
} from '@/types/chatgpt-export.types';

export interface ExtractionResult {
  conversations: ChatGPTExportConversation[];
  mediaFiles: ExtractedMediaFile[];
  missingFiles: string[];
}

interface AssetPointerInfo {
  assetPointer: string;
  conversationId: string;
  mediaType: 'image' | 'audio';
}

/**
 * Extract conversations and media files from a ChatGPT export ZIP.
 */
export async function extractChatGPTZip(file: File): Promise<ExtractionResult> {
  // Dynamically import JSZip to avoid SSR issues
  const JSZipModule = (await import('jszip')).default;
  const zip = await JSZipModule.loadAsync(file);

  // 1. Extract conversations.json
  const conversationsFile = zip.file('conversations.json');
  if (!conversationsFile) {
    throw new Error('El archivo ZIP no contiene "conversations.json"');
  }

  const conversationsJson = await conversationsFile.async('string');
  const conversations: ChatGPTExportConversation[] = JSON.parse(conversationsJson);

  // 2. Extract all asset pointers from conversations
  const assetPointers = extractAssetPointers(conversations);

  // 3. Find and extract media files
  const mediaFiles: ExtractedMediaFile[] = [];
  const missingFiles: string[] = [];

  for (const pointer of assetPointers) {
    const mediaFile = await findMediaFile(zip, pointer);
    if (mediaFile) {
      mediaFiles.push(mediaFile);
    } else {
      missingFiles.push(pointer.assetPointer);
    }
  }

  // Remove duplicates from missingFiles
  const uniqueMissing = [...new Set(missingFiles)];

  console.log(
    `[Media Extractor] Found ${mediaFiles.length} media files, ${uniqueMissing.length} missing`
  );

  return { conversations, mediaFiles, missingFiles: uniqueMissing };
}

/**
 * Extract all asset pointers from conversations.
 */
function extractAssetPointers(
  conversations: ChatGPTExportConversation[]
): AssetPointerInfo[] {
  const pointers: AssetPointerInfo[] = [];
  const seen = new Set<string>();

  for (const conv of conversations) {
    const convId = conv.conversation_id || conv.id || '';

    for (const node of Object.values(conv.mapping) as ChatGPTMappingNode[]) {
      if (!node.message?.content?.parts) continue;

      for (const part of node.message.content.parts) {
        if (typeof part === 'object' && part !== null) {
          const partObj = part as unknown as Record<string, unknown>;

          // Image asset pointer
          if (
            partObj.asset_pointer &&
            typeof partObj.asset_pointer === 'string' &&
            !seen.has(partObj.asset_pointer)
          ) {
            seen.add(partObj.asset_pointer);
            pointers.push({
              assetPointer: partObj.asset_pointer,
              conversationId: convId,
              mediaType: 'image',
            });
          }

          // Audio asset pointer (nested in audio_asset_pointer)
          if (
            partObj.audio_asset_pointer &&
            typeof partObj.audio_asset_pointer === 'object'
          ) {
            const audioPointer = partObj.audio_asset_pointer as Record<string, unknown>;
            if (
              audioPointer.asset_pointer &&
              typeof audioPointer.asset_pointer === 'string' &&
              !seen.has(audioPointer.asset_pointer as string)
            ) {
              seen.add(audioPointer.asset_pointer as string);
              pointers.push({
                assetPointer: audioPointer.asset_pointer as string,
                conversationId: convId,
                mediaType: 'audio',
              });
            }
          }

          // Real-time audio/video asset pointer
          if (
            partObj.content_type === 'real_time_user_audio_video_asset_pointer' &&
            partObj.audio_asset_pointer
          ) {
            const audioPointer = partObj.audio_asset_pointer as Record<string, unknown>;
            if (
              audioPointer.asset_pointer &&
              typeof audioPointer.asset_pointer === 'string' &&
              !seen.has(audioPointer.asset_pointer as string)
            ) {
              seen.add(audioPointer.asset_pointer as string);
              pointers.push({
                assetPointer: audioPointer.asset_pointer as string,
                conversationId: convId,
                mediaType: 'audio',
              });
            }
          }
        }
      }
    }
  }

  return pointers;
}

/**
 * Find a media file in the ZIP based on asset pointer.
 */
async function findMediaFile(
  zip: import('jszip'),
  pointer: AssetPointerInfo
): Promise<ExtractedMediaFile | null> {
  // Extract file ID from "sediment://file_XXX"
  const match = pointer.assetPointer.match(/sediment:\/\/file_([a-f0-9]+)/);
  if (!match) return null;

  const fileId = `file_${match[1]}`;

  if (pointer.mediaType === 'image') {
    // Images are at root: file_XXX-sanitized.png/jpeg/jpg
    const patterns = [
      `${fileId}-sanitized.png`,
      `${fileId}-sanitized.jpeg`,
      `${fileId}-sanitized.jpg`,
      `${fileId}.png`,
      `${fileId}.jpeg`,
      `${fileId}.jpg`,
    ];

    for (const pattern of patterns) {
      const file = zip.file(pattern);
      if (file) {
        const blob = await file.async('blob');
        return {
          assetPointer: pointer.assetPointer,
          file: new File([blob], pattern, { type: getMimeType(pattern) }),
          mediaType: 'image',
          fileName: pattern,
          size: blob.size,
        };
      }
    }
  } else if (pointer.mediaType === 'audio') {
    // Audio files can be in:
    // 1. Root: file_XXX.wav or file_XXX-UUID.wav
    // 2. Conversation folder: {conversationId}/audio/file_XXX-UUID.wav

    // First check root
    const rootFiles = Object.keys(zip.files).filter(
      (path) =>
        !path.includes('/') &&
        path.includes(fileId) &&
        (path.endsWith('.wav') || path.endsWith('.mp3'))
    );

    if (rootFiles.length > 0) {
      const file = zip.file(rootFiles[0]);
      if (file) {
        const blob = await file.async('blob');
        const fileName = rootFiles[0];
        return {
          assetPointer: pointer.assetPointer,
          file: new File([blob], fileName, { type: getMimeType(fileName) }),
          mediaType: 'audio',
          fileName,
          size: blob.size,
        };
      }
    }

    // Check conversation audio folder
    if (pointer.conversationId) {
      const audioFolder = `${pointer.conversationId}/audio/`;
      const audioFiles = Object.keys(zip.files).filter(
        (path) =>
          path.startsWith(audioFolder) &&
          path.includes(fileId)
      );

      if (audioFiles.length > 0) {
        const file = zip.file(audioFiles[0]);
        if (file) {
          const blob = await file.async('blob');
          const fileName = audioFiles[0].split('/').pop() || 'audio.wav';
          return {
            assetPointer: pointer.assetPointer,
            file: new File([blob], fileName, { type: getMimeType(fileName) }),
            mediaType: 'audio',
            fileName,
            size: blob.size,
          };
        }
      }
    }
  }

  return null;
}

/**
 * Get MIME type from file extension.
 */
function getMimeType(fileName: string): string {
  const ext = fileName.toLowerCase().split('.').pop();
  switch (ext) {
    case 'png':
      return 'image/png';
    case 'jpeg':
    case 'jpg':
      return 'image/jpeg';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'wav':
      return 'audio/wav';
    case 'mp3':
      return 'audio/mpeg';
    default:
      return 'application/octet-stream';
  }
}

/**
 * Format file size for display.
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Get media counts summary.
 */
export function getMediaSummary(mediaFiles: ExtractedMediaFile[]): {
  images: number;
  audio: number;
  totalSize: number;
} {
  let images = 0;
  let audio = 0;
  let totalSize = 0;

  for (const file of mediaFiles) {
    if (file.mediaType === 'image') {
      images++;
    } else {
      audio++;
    }
    totalSize += file.size;
  }

  return { images, audio, totalSize };
}
