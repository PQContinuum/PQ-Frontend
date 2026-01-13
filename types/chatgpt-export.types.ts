/**
 * TypeScript types for ChatGPT export format
 * Based on the structure of ChatGPT's data export feature
 */

// ============================================================================
// CHATGPT EXPORT STRUCTURE
// ============================================================================

/**
 * Author information for a message
 */
export interface ChatGPTAuthor {
  role: 'user' | 'assistant' | 'system' | 'tool';
  name?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Content part of a message (can be text, image, audio, etc.)
 */
export interface ChatGPTContentPart {
  content_type:
    | 'text'
    | 'image_asset_pointer'
    | 'audio_asset_pointer'
    | 'real_time_user_audio_video_asset_pointer'
    | 'code'
    | 'execution_output'
    | 'tether_browsing_display'
    | 'tether_quote'
    | 'system_error';
  text?: string;
  asset_pointer?: string;
  language?: string;
  result?: string;
  title?: string;
  url?: string;
  domain?: string;
  // Audio-specific fields
  audio_asset_pointer?: {
    asset_pointer: string;
    content_type?: string;
    size_bytes?: number;
    format?: string;
  };
}

/**
 * Message content structure
 */
export interface ChatGPTContent {
  content_type: string;
  parts?: (string | ChatGPTContentPart)[];
  text?: string;
}

/**
 * Message metadata
 */
export interface ChatGPTMessageMetadata {
  message_type?: string | null;
  model_slug?: string;
  parent_id?: string;
  timestamp_?: string;
  finish_details?: {
    type: string;
    stop_tokens?: number[];
  };
  is_complete?: boolean;
  citations?: unknown[];
  gizmo_id?: string | null;
  default_model_slug?: string;
}

/**
 * Individual message in the mapping tree
 */
export interface ChatGPTMessage {
  id: string;
  author: ChatGPTAuthor;
  create_time: number | null;
  update_time: number | null;
  content: ChatGPTContent;
  status: string;
  end_turn: boolean | null;
  weight: number;
  metadata: ChatGPTMessageMetadata;
  recipient: string;
}

/**
 * Node in the conversation mapping tree
 * ChatGPT uses a tree structure with parent pointers
 */
export interface ChatGPTMappingNode {
  id: string;
  message: ChatGPTMessage | null;
  parent: string | null;
  children: string[];
}

/**
 * Full conversation structure from ChatGPT export
 */
export interface ChatGPTExportConversation {
  title: string;
  create_time: number;
  update_time: number;
  mapping: Record<string, ChatGPTMappingNode>;
  moderation_results: unknown[];
  current_node: string;
  plugin_ids: string[] | null;
  conversation_id: string;
  conversation_template_id: string | null;
  gizmo_id: string | null;
  is_archived: boolean;
  safe_urls: string[];
  default_model_slug?: string;
  id?: string;
}

// ============================================================================
// IMPORT OPTIONS & RESULTS
// ============================================================================

/**
 * Options for importing ChatGPT conversations
 */
export interface ChatGPTImportOptions {
  /** Skip conversations that already exist (based on title/timestamp matching) */
  skipDuplicates: boolean;
  /** Preserve original creation/update timestamps from ChatGPT */
  preserveTimestamps: boolean;
}

/**
 * File metadata sent with import request
 */
export interface ImportFileMetadata {
  fileName: string;
  fileSize: number;
  fileType: 'zip' | 'json';
  fileHash?: string;
}

/**
 * Skipped duplicate conversation info
 */
export interface SkippedDuplicate {
  title: string;
  existingConversationId?: string;
  originalCreatedAt?: string;
  reason?: string;
}

/**
 * Skipped conversation with no valid messages
 */
export interface SkippedNoMessages {
  title: string;
  reason: 'empty' | 'only_system_messages' | 'only_tool_calls' | 'no_user_or_assistant' | 'parse_error';
  details?: string;
}

/**
 * Skipped conversation due to error
 */
export interface SkippedError {
  title: string;
  error: string;
}

/**
 * Categorized errors in import response
 */
export interface CategorizedErrors {
  duplicates: SkippedDuplicate[];
  noMessages: SkippedNoMessages[];
  other: SkippedError[];
}

/**
 * Import statistics
 */
export interface ImportStats {
  totalInFile: number;
  imported: number;
  skippedDuplicate: number;
  skippedNoMessages: number;
  skippedError: number;
  messagesImported: number;
  factsExtracted: number;
}

/**
 * Result of the import operation from the backend (new format)
 */
export interface ChatGPTImportResult {
  success: boolean;
  importId?: string;
  stats?: ImportStats;
  errors?: CategorizedErrors;
  summary?: string;

  // Legacy format support (for backwards compatibility)
  conversationsImported?: number;
  conversationsSkipped?: number;
  totalMessagesImported?: number;
  factsExtracted?: number;
}

/**
 * Media mapping entry - maps ChatGPT asset_pointer to uploaded attachment
 */
export interface MediaMappingEntry {
  assetPointer: string; // e.g., "sediment://file_XXX"
  attachmentId: string; // UUID returned from upload
  mediaType: 'image' | 'audio';
}

/**
 * Extracted media file from ZIP
 */
export interface ExtractedMediaFile {
  assetPointer: string;
  file: File;
  mediaType: 'image' | 'audio';
  fileName: string;
  size: number;
}

/**
 * Request body for the import endpoint
 */
export interface ChatGPTImportRequest {
  conversations: ChatGPTExportConversation[];
  skipDuplicates?: boolean;
  preserveTimestamps?: boolean;
  fileMetadata?: ImportFileMetadata;
  mediaMapping?: MediaMappingEntry[];
}

// ============================================================================
// IMPORT HISTORY
// ============================================================================

/**
 * Single import history record
 */
export interface ImportHistoryRecord {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: 'zip' | 'json';
  fileHash?: string;

  stats: ImportStats;

  options: {
    skipDuplicates: boolean;
    preserveTimestamps: boolean;
  };

  status: 'completed' | 'partial' | 'failed';
  createdAt: string;
  durationMs?: number;
}

/**
 * Import history response
 */
export interface ImportHistoryResponse {
  imports: ImportHistoryRecord[];
  totals: {
    totalImports: number;
    totalConversationsImported: number;
    totalMessagesImported: number;
    totalFactsExtracted: number;
  };
}

// ============================================================================
// PREVIEW/PARSING TYPES
// ============================================================================

/**
 * Simplified conversation preview for the UI
 */
export interface ConversationPreview {
  id: string;
  title: string;
  messageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Result of parsing a ChatGPT export file
 */
export interface ParsedChatGPTExport {
  conversations: ChatGPTExportConversation[];
  totalConversations: number;
  totalMessages: number;
  previews: ConversationPreview[];
  fileMetadata: ImportFileMetadata;
}

// ============================================================================
// STATE TYPES FOR UI
// ============================================================================

export type ImportDialogState =
  | 'initial'      // Show instructions and upload area
  | 'parsing'      // Processing the uploaded file
  | 'preview'      // Show preview and options
  | 'uploading'    // Uploading media files
  | 'importing'    // Import in progress
  | 'completed'    // Show results
  | 'error';       // Show error state

export interface ImportProgress {
  current: number;
  total: number;
  message: string;
}

export interface UploadProgress {
  current: number;
  total: number;
  currentFile: string;
}
