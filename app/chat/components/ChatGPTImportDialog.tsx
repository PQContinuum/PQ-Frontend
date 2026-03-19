'use client';

import React, { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileJson,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  Clock,
  ArrowLeft,
  Copy,
  FileArchive,
  SkipForward,
  AlertTriangle,
  Image,
  Music,
  HardDrive,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import {
  useChatGPTImport,
  calculateFileHash,
  formatFileSize,
  getSkipReasonText,
} from '@/hooks/use-chatgpt-import';
import type {
  ChatGPTExportConversation,
  ImportDialogState,
  ConversationPreview,
  ChatGPTImportResult,
  ChatGPTMappingNode,
  ImportFileMetadata,
  ExtractedMediaFile,
  MediaMappingEntry,
  UploadProgress,
} from '@/types/chatgpt-export.types';
import {
  extractChatGPTZip,
  getMediaSummary,
  formatFileSize as formatMediaSize,
} from '@/lib/chatgpt-media-extractor';
import {
  uploadMediaFiles,
  type FailedUpload,
} from '@/lib/import-media-uploader';

interface ChatGPTImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ChatGPT brand color
const CHATGPT_GREEN = '#10a37f';

/**
 * Count messages in a ChatGPT conversation mapping
 */
function countMessages(mapping: Record<string, ChatGPTMappingNode>): number {
  let count = 0;
  for (const node of Object.values(mapping)) {
    if (node.message && node.message.author.role !== 'system') {
      count++;
    }
  }
  return count;
}

/**
 * Parse ChatGPT export and create previews
 */
function parseConversations(data: ChatGPTExportConversation[]): {
  conversations: ChatGPTExportConversation[];
  previews: ConversationPreview[];
  totalMessages: number;
} {
  let totalMessages = 0;
  const previews: ConversationPreview[] = [];

  for (const conv of data) {
    const messageCount = countMessages(conv.mapping);
    totalMessages += messageCount;

    previews.push({
      id: conv.conversation_id || conv.id || String(Math.random()),
      title: conv.title || 'Sin título',
      messageCount,
      createdAt: new Date(conv.create_time * 1000),
      updatedAt: new Date(conv.update_time * 1000),
    });
  }

  return {
    conversations: data,
    previews,
    totalMessages,
  };
}

/**
 * Normalize import result to handle both legacy and new formats
 */
function normalizeImportResult(result: ChatGPTImportResult) {
  // Check if it's the new format with stats
  if (result.stats) {
    return {
      imported: result.stats.imported,
      skippedDuplicate: result.stats.skippedDuplicate,
      skippedNoMessages: result.stats.skippedNoMessages,
      skippedError: result.stats.skippedError,
      messagesImported: result.stats.messagesImported,
      factsExtracted: result.stats.factsExtracted,
      totalSkipped: result.stats.skippedDuplicate + result.stats.skippedNoMessages + result.stats.skippedError,
      errors: result.errors,
      summary: result.summary,
    };
  }

  // Legacy format
  return {
    imported: result.conversationsImported ?? 0,
    skippedDuplicate: 0,
    skippedNoMessages: 0,
    skippedError: 0,
    messagesImported: result.totalMessagesImported ?? 0,
    factsExtracted: result.factsExtracted ?? 0,
    totalSkipped: result.conversationsSkipped ?? 0,
    errors: undefined,
    summary: undefined,
  };
}

export function ChatGPTImportDialog({ open, onOpenChange }: ChatGPTImportDialogProps) {
  const [dialogState, setDialogState] = useState<ImportDialogState>('initial');
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileMetadata, setFileMetadata] = useState<ImportFileMetadata | null>(null);
  const [parsedData, setParsedData] = useState<{
    conversations: ChatGPTExportConversation[];
    previews: ConversationPreview[];
    totalMessages: number;
  } | null>(null);
  const [importResult, setImportResult] = useState<ChatGPTImportResult | null>(null);

  // Media state
  const [extractedMedia, setExtractedMedia] = useState<ExtractedMediaFile[]>([]);
  const [missingMedia, setMissingMedia] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [mediaMapping, setMediaMapping] = useState<MediaMappingEntry[]>([]);
  const [failedUploads, setFailedUploads] = useState<FailedUpload[]>([]);
  const [zipFile, setZipFile] = useState<File | null>(null);

  // Import options
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [preserveTimestamps, setPreserveTimestamps] = useState(true);

  const importMutation = useChatGPTImport();

  const resetState = useCallback(() => {
    setDialogState('initial');
    setError(null);
    setFileMetadata(null);
    setParsedData(null);
    setImportResult(null);
    setSkipDuplicates(true);
    setPreserveTimestamps(true);
    // Reset media state
    setExtractedMedia([]);
    setMissingMedia([]);
    setUploadProgress(null);
    setMediaMapping([]);
    setFailedUploads([]);
    setZipFile(null);
  }, []);

  const handleClose = useCallback(() => {
    onOpenChange(false);
    // Reset state after animation
    setTimeout(resetState, 300);
  }, [onOpenChange, resetState]);

  const processFile = useCallback(async (file: File) => {
    setDialogState('parsing');
    setError(null);

    try {
      // Calculate file hash for duplicate detection
      const fileHash = await calculateFileHash(file);

      // Store file metadata
      const metadata: ImportFileMetadata = {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.name.endsWith('.zip') ? 'zip' : 'json',
        fileHash,
      };
      setFileMetadata(metadata);

      let jsonData: ChatGPTExportConversation[];

      if (file.name.endsWith('.zip')) {
        // Store zip file for later media upload
        setZipFile(file);

        // Use the media extractor to get conversations AND media files
        const extractionResult = await extractChatGPTZip(file);
        jsonData = extractionResult.conversations;

        // Store extracted media info
        setExtractedMedia(extractionResult.mediaFiles);
        setMissingMedia(extractionResult.missingFiles);

        console.log(
          `[ChatGPT Import] Extracted ${extractionResult.mediaFiles.length} media files, ` +
          `${extractionResult.missingFiles.length} missing`
        );
      } else if (file.name.endsWith('.json')) {
        // Parse JSON directly (no media extraction possible)
        const jsonString = await file.text();
        jsonData = JSON.parse(jsonString);
        setZipFile(null);
        setExtractedMedia([]);
        setMissingMedia([]);
      } else {
        throw new Error('Formato de archivo no soportado. Por favor sube un archivo .zip o .json');
      }

      // Validate structure
      if (!Array.isArray(jsonData)) {
        throw new Error('El archivo JSON no tiene el formato esperado. Debe ser un array de conversaciones.');
      }

      if (jsonData.length === 0) {
        throw new Error('No se encontraron conversaciones en el archivo.');
      }

      // Check if it looks like ChatGPT export
      const firstConv = jsonData[0];
      if (!firstConv.mapping || !firstConv.title === undefined) {
        throw new Error('El archivo no parece ser un export de ChatGPT. Asegúrate de usar el archivo correcto.');
      }

      const parsed = parseConversations(jsonData);
      setParsedData(parsed);
      setDialogState('preview');

    } catch (err) {
      console.error('[ChatGPT Import] Parse error:', err);
      setError(err instanceof Error ? err.message : 'Error al procesar el archivo');
      setDialogState('error');
    }
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  const handleImport = useCallback(async () => {
    if (!parsedData) return;

    let uploadedMediaMapping: MediaMappingEntry[] = [];

    try {
      // PHASE 1: Upload media files if there are any
      if (extractedMedia.length > 0) {
        setDialogState('uploading');
        setUploadProgress({ current: 0, total: extractedMedia.length, currentFile: '' });

        const uploadResult = await uploadMediaFiles(
          extractedMedia,
          setUploadProgress
        );

        uploadedMediaMapping = uploadResult.mediaMapping;
        setMediaMapping(uploadedMediaMapping);
        setFailedUploads(uploadResult.failedUploads);

        console.log(
          `[ChatGPT Import] Uploaded ${uploadResult.totalUploaded}/${extractedMedia.length} files`
        );

        if (uploadResult.failedUploads.length > 0) {
          console.warn(
            `[ChatGPT Import] ${uploadResult.failedUploads.length} files failed to upload`
          );
        }
      }

      // PHASE 2: Import conversations with media mapping
      setDialogState('importing');

      const result = await importMutation.mutateAsync({
        conversations: parsedData.conversations,
        skipDuplicates,
        preserveTimestamps,
        fileMetadata: fileMetadata || undefined,
        mediaMapping: uploadedMediaMapping.length > 0 ? uploadedMediaMapping : undefined,
      });

      // Log the result for debugging
      console.log('[ChatGPT Import] Result:', JSON.stringify(result, null, 2));

      setImportResult(result);
      setDialogState('completed');
    } catch (err) {
      console.error('[ChatGPT Import] Import error:', err);
      setError(err instanceof Error ? err.message : 'Error al importar las conversaciones');
      setDialogState('error');
    }
  }, [parsedData, skipDuplicates, preserveTimestamps, fileMetadata, importMutation, extractedMedia]);

  // Normalize result for display
  const normalizedResult = importResult ? normalizeImportResult(importResult) : null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="!max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-[#111111]">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${CHATGPT_GREEN}15` }}
            >
              <MessageSquare
                className="size-5"
                style={{ color: CHATGPT_GREEN }}
              />
            </div>
            Importar desde ChatGPT
          </DialogTitle>
          <DialogDescription className="text-[#4c4c4c]">
            Importa todas tus conversaciones de ChatGPT a Continuum AI
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* INITIAL STATE: Instructions + Upload */}
            {dialogState === 'initial' && (
              <motion.div
                key="initial"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Export Instructions */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <h3 className="text-sm font-bold text-[#111111] mb-3 flex items-center gap-2">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{ backgroundColor: `${CHATGPT_GREEN}20`, color: CHATGPT_GREEN }}
                    >
                      Paso 1
                    </span>
                    Exportar tus datos desde ChatGPT
                  </h3>
                  <ol className="space-y-2 text-sm text-[#4c4c4c]">
                    <li className="flex gap-2">
                      <span className="font-semibold text-[#111111] shrink-0">1.</span>
                      <span>Abre <strong>ChatGPT</strong> en tu navegador</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-semibold text-[#111111] shrink-0">2.</span>
                      <span>Ve a <strong>Settings</strong> (Configuración)</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-semibold text-[#111111] shrink-0">3.</span>
                      <span>En el menú lateral, entra a <strong>Data Controls</strong></span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-semibold text-[#111111] shrink-0">4.</span>
                      <span>Haz clic en <strong>Export data</strong></span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-semibold text-[#111111] shrink-0">5.</span>
                      <span>Recibirás un correo con un enlace para descargar un archivo ZIP</span>
                    </li>
                  </ol>
                  <a
                    href="https://help.openai.com/en/articles/7260999-how-do-i-export-my-chatgpt-history-and-data"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium hover:underline"
                    style={{ color: CHATGPT_GREEN }}
                  >
                    <ExternalLink className="size-4" />
                    Ver guía oficial de OpenAI
                  </a>
                </div>

                {/* Upload Area */}
                <div>
                  <h3 className="text-sm font-bold text-[#111111] mb-3 flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-[#934f2c]/20 text-[#934f2c]">
                      Paso 2
                    </span>
                    Sube tu archivo
                  </h3>
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 ${
                      dragActive
                        ? 'border-[#934f2c] bg-[#934f2c]/5 scale-[1.02]'
                        : 'border-gray-300 hover:border-[#934f2c]/50 hover:bg-gray-50/50'
                    }`}
                  >
                    <input
                      type="file"
                      id="chatgpt-file-upload"
                      className="hidden"
                      accept=".zip,.json"
                      onChange={handleFileSelect}
                    />

                    <label
                      htmlFor="chatgpt-file-upload"
                      className="flex flex-col items-center cursor-pointer"
                    >
                      <div className="relative mb-4">
                        <div className="bg-gradient-to-br from-[#934f2c] to-[#d9753e] p-3 rounded-2xl shadow-lg">
                          <Upload className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <p className="text-base font-semibold text-gray-800 text-center mb-1">
                        {dragActive ? 'Suelta el archivo aquí' : 'Arrastra el archivo o haz clic'}
                      </p>
                      <p className="text-xs text-gray-500 text-center">
                        Acepta <strong>.zip</strong> (export completo) o <strong>conversations.json</strong>
                      </p>
                    </label>
                  </div>
                </div>

                {/* Note about media */}
                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <CheckCircle2 className="size-5 text-blue-600 shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Importación de multimedia</p>
                    <p className="mt-1 text-blue-700">
                      Las imágenes y audios de tus conversaciones se importarán automáticamente si subes el archivo ZIP completo exportado desde ChatGPT.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* PARSING STATE: Processing file */}
            {dialogState === 'parsing' && (
              <motion.div
                key="parsing"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center justify-center py-12"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-[#934f2c]/20 rounded-full blur-xl animate-pulse" />
                  <Loader2 className="relative size-12 text-[#934f2c] animate-spin" />
                </div>
                <p className="mt-6 text-lg font-semibold text-[#111111]">
                  Procesando archivo...
                </p>
                <p className="mt-2 text-sm text-[#4c4c4c]">
                  Extrayendo y validando conversaciones
                </p>
              </motion.div>
            )}

            {/* PREVIEW STATE: Show summary and options */}
            {dialogState === 'preview' && parsedData && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* File Info */}
                {fileMetadata && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    {fileMetadata.fileType === 'zip' ? (
                      <FileArchive className="size-5 text-[#934f2c]" />
                    ) : (
                      <FileJson className="size-5 text-blue-600" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#111111] truncate">
                        {fileMetadata.fileName}
                      </p>
                      <p className="text-xs text-[#4c4c4c]">
                        {formatFileSize(fileMetadata.fileSize)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Summary Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-[#934f2c]/10 to-[#d9753e]/5 rounded-xl p-4 border border-[#934f2c]/20">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="size-4 text-[#934f2c]" />
                      <span className="text-xs font-semibold text-[#934f2c] uppercase tracking-wide">
                        Conversaciones
                      </span>
                    </div>
                    <p className="text-3xl font-bold text-[#111111]">
                      {parsedData.previews.length}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 border border-blue-200/50">
                    <div className="flex items-center gap-2 mb-2">
                      <FileJson className="size-4 text-blue-600" />
                      <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                        Mensajes
                      </span>
                    </div>
                    <p className="text-3xl font-bold text-[#111111]">
                      {parsedData.totalMessages.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Media Summary - Only show if there are media files */}
                {extractedMedia.length > 0 && (() => {
                  const mediaSummary = getMediaSummary(extractedMedia);
                  return (
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-4 border border-purple-200/50">
                      <div className="flex items-center gap-2 mb-3">
                        <HardDrive className="size-4 text-purple-600" />
                        <span className="text-xs font-semibold text-purple-600 uppercase tracking-wide">
                          Archivos multimedia
                        </span>
                      </div>
                      <div className="flex items-center justify-around">
                        {mediaSummary.images > 0 && (
                          <div className="text-center">
                            <div className="flex items-center gap-1.5 justify-center mb-1">
                              <Image className="size-4 text-purple-600" />
                              <span className="text-2xl font-bold text-[#111111]">
                                {mediaSummary.images}
                              </span>
                            </div>
                            <span className="text-xs text-purple-600">Imágenes</span>
                          </div>
                        )}
                        {mediaSummary.audio > 0 && (
                          <div className="text-center">
                            <div className="flex items-center gap-1.5 justify-center mb-1">
                              <Music className="size-4 text-purple-600" />
                              <span className="text-2xl font-bold text-[#111111]">
                                {mediaSummary.audio}
                              </span>
                            </div>
                            <span className="text-xs text-purple-600">Audios</span>
                          </div>
                        )}
                        <div className="text-center">
                          <span className="text-lg font-bold text-[#111111]">
                            {formatMediaSize(mediaSummary.totalSize)}
                          </span>
                          <p className="text-xs text-purple-600">Total</p>
                        </div>
                      </div>
                      {missingMedia.length > 0 && (
                        <p className="text-xs text-amber-600 mt-2 text-center">
                          {missingMedia.length} archivos no encontrados en el ZIP
                        </p>
                      )}
                    </div>
                  );
                })()}

                {/* Conversation Preview List */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <h4 className="text-sm font-bold text-[#111111] mb-3">
                    Vista previa de conversaciones
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {parsedData.previews.slice(0, 10).map((preview) => (
                      <div
                        key={preview.id}
                        className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border border-gray-100"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#111111] truncate">
                            {preview.title}
                          </p>
                          <p className="text-xs text-[#4c4c4c] flex items-center gap-2">
                            <span>{preview.messageCount} mensajes</span>
                            <span className="text-gray-300">|</span>
                            <Clock className="size-3" />
                            <span>{preview.createdAt.toLocaleDateString()}</span>
                          </p>
                        </div>
                      </div>
                    ))}
                    {parsedData.previews.length > 10 && (
                      <p className="text-xs text-center text-[#4c4c4c] py-2">
                        ...y {parsedData.previews.length - 10} conversaciones más
                      </p>
                    )}
                  </div>
                </div>

                {/* Import Options */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-[#111111]">
                    Opciones de importación
                  </h4>

                  <div className="flex items-center justify-between py-3 px-4 bg-white rounded-xl border border-gray-200">
                    <div>
                      <p className="text-sm font-medium text-[#111111]">
                        Omitir duplicados
                      </p>
                      <p className="text-xs text-[#4c4c4c]">
                        No importar conversaciones que ya existan
                      </p>
                    </div>
                    <Switch
                      checked={skipDuplicates}
                      onCheckedChange={setSkipDuplicates}
                    />
                  </div>

                  <div className="flex items-center justify-between py-3 px-4 bg-white rounded-xl border border-gray-200">
                    <div>
                      <p className="text-sm font-medium text-[#111111]">
                        Preservar fechas originales
                      </p>
                      <p className="text-xs text-[#4c4c4c]">
                        Mantener timestamps de creación de ChatGPT
                      </p>
                    </div>
                    <Switch
                      checked={preserveTimestamps}
                      onCheckedChange={setPreserveTimestamps}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={resetState}
                    className="flex-1"
                  >
                    <ArrowLeft className="size-4 mr-2" />
                    Volver
                  </Button>
                  <Button
                    onClick={handleImport}
                    className="flex-1 bg-[#934f2c] hover:bg-[#004422] text-white"
                  >
                    <Upload className="size-4 mr-2" />
                    Importar {parsedData.previews.length} conversaciones
                  </Button>
                </div>
              </motion.div>
            )}

            {/* UPLOADING STATE: Media upload progress */}
            {dialogState === 'uploading' && uploadProgress && (
              <motion.div
                key="uploading"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center justify-center py-12"
              >
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-xl animate-pulse" />
                  <div className="relative bg-purple-100 p-4 rounded-full">
                    <Upload className="size-8 text-purple-600 animate-bounce" />
                  </div>
                </div>
                <p className="text-lg font-semibold text-[#111111] mb-2">
                  Subiendo archivos multimedia...
                </p>
                <p className="text-sm text-[#4c4c4c] mb-4 text-center">
                  {uploadProgress.current} de {uploadProgress.total} archivos
                </p>
                <div className="w-full max-w-xs mb-2">
                  <Progress
                    value={(uploadProgress.current / uploadProgress.total) * 100}
                    className="h-2"
                  />
                </div>
                <p className="text-xs text-[#4c4c4c] truncate max-w-xs">
                  {uploadProgress.currentFile}
                </p>
              </motion.div>
            )}

            {/* IMPORTING STATE: Progress */}
            {dialogState === 'importing' && (
              <motion.div
                key="importing"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center justify-center py-12"
              >
                <div className="w-full max-w-xs mb-6">
                  <Progress value={undefined} className="h-2" />
                </div>
                <p className="text-lg font-semibold text-[#111111]">
                  Importando conversaciones...
                </p>
                <p className="mt-2 text-sm text-[#4c4c4c]">
                  Esto puede tomar unos momentos
                </p>
              </motion.div>
            )}

            {/* COMPLETED STATE: Results */}
            {dialogState === 'completed' && normalizedResult && (
              <motion.div
                key="completed"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Success Icon */}
                <div className="flex flex-col items-center py-4">
                  <div className="bg-[#f0b896] p-4 rounded-full mb-4">
                    <CheckCircle2 className="size-10 text-[#934f2c]" />
                  </div>
                  <h3 className="text-xl font-bold text-[#111111]">
                    Importación completada
                  </h3>
                  {normalizedResult.summary && (
                    <p className="mt-2 text-sm text-[#4c4c4c] text-center">
                      {normalizedResult.summary}
                    </p>
                  )}
                </div>

                {/* Results Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-4 bg-orange-50 rounded-xl border border-[#e8956a]">
                    <p className="text-2xl font-bold text-[#934f2c]">
                      {normalizedResult.imported}
                    </p>
                    <p className="text-xs text-[#934f2c] font-medium">
                      Importadas
                    </p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <p className="text-2xl font-bold text-blue-600">
                      {normalizedResult.messagesImported.toLocaleString()}
                    </p>
                    <p className="text-xs text-blue-700 font-medium">
                      Mensajes
                    </p>
                  </div>
                </div>

                {/* Media Upload Results */}
                {mediaMapping.length > 0 && (
                  <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <HardDrive className="size-4 text-purple-600" />
                      <span className="text-sm font-bold text-purple-700">
                        Archivos multimedia importados
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1.5">
                        <Image className="size-4 text-purple-600" />
                        <span className="text-purple-700">
                          {mediaMapping.filter(m => m.mediaType === 'image').length} imágenes
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Music className="size-4 text-purple-600" />
                        <span className="text-purple-700">
                          {mediaMapping.filter(m => m.mediaType === 'audio').length} audios
                        </span>
                      </div>
                    </div>
                    {failedUploads.length > 0 && (
                      <p className="text-xs text-amber-600 mt-2">
                        {failedUploads.length} archivos no se pudieron subir
                      </p>
                    )}
                  </div>
                )}

                {/* Skipped breakdown */}
                {normalizedResult.totalSkipped > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <h4 className="text-sm font-bold text-[#111111] mb-3 flex items-center gap-2">
                      <SkipForward className="size-4 text-gray-500" />
                      Conversaciones omitidas ({normalizedResult.totalSkipped})
                    </h4>

                    <div className="space-y-2">
                      {/* Duplicates */}
                      {normalizedResult.skippedDuplicate > 0 && (
                        <div className="flex items-center justify-between py-2 px-3 bg-white rounded-lg">
                          <div className="flex items-center gap-2">
                            <Copy className="size-4 text-gray-500" />
                            <span className="text-sm text-[#4c4c4c]">Ya existían</span>
                          </div>
                          <span className="text-sm font-semibold text-[#111111]">
                            {normalizedResult.skippedDuplicate}
                          </span>
                        </div>
                      )}

                      {/* No messages */}
                      {normalizedResult.skippedNoMessages > 0 && (
                        <div className="flex items-center justify-between py-2 px-3 bg-white rounded-lg">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="size-4 text-amber-500" />
                            <span className="text-sm text-[#4c4c4c]">Sin mensajes válidos</span>
                          </div>
                          <span className="text-sm font-semibold text-[#111111]">
                            {normalizedResult.skippedNoMessages}
                          </span>
                        </div>
                      )}

                      {/* Errors */}
                      {normalizedResult.skippedError > 0 && (
                        <div className="flex items-center justify-between py-2 px-3 bg-white rounded-lg">
                          <div className="flex items-center gap-2">
                            <XCircle className="size-4 text-red-500" />
                            <span className="text-sm text-[#4c4c4c]">Con errores</span>
                          </div>
                          <span className="text-sm font-semibold text-[#111111]">
                            {normalizedResult.skippedError}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Detailed errors (new format) */}
                {normalizedResult.errors && (
                  <>
                    {/* No messages details */}
                    {normalizedResult.errors.noMessages && normalizedResult.errors.noMessages.length > 0 && (
                      <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                        <div className="flex items-center gap-2 mb-3">
                          <AlertTriangle className="size-5 text-amber-600" />
                          <span className="text-sm font-bold text-amber-700">
                            Sin mensajes válidos ({normalizedResult.errors.noMessages.length})
                          </span>
                        </div>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {normalizedResult.errors.noMessages.slice(0, 5).map((item, idx) => (
                            <div
                              key={idx}
                              className="text-xs text-amber-700 bg-amber-100 rounded px-2 py-1"
                            >
                              <span className="font-medium">{item.title}:</span>{' '}
                              {getSkipReasonText(item.reason)}
                            </div>
                          ))}
                          {normalizedResult.errors.noMessages.length > 5 && (
                            <p className="text-xs text-amber-600 text-center">
                              ...y {normalizedResult.errors.noMessages.length - 5} más
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Other errors details */}
                    {normalizedResult.errors.other && normalizedResult.errors.other.length > 0 && (
                      <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                        <div className="flex items-center gap-2 mb-3">
                          <XCircle className="size-5 text-red-600" />
                          <span className="text-sm font-bold text-red-700">
                            Errores ({normalizedResult.errors.other.length})
                          </span>
                        </div>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {normalizedResult.errors.other.map((err, idx) => (
                            <div
                              key={idx}
                              className="text-xs text-red-700 bg-red-100 rounded px-2 py-1"
                            >
                              <span className="font-medium">{err.title}:</span>{' '}
                              {err.error}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Legacy errors (old format) - fallback */}
                {!normalizedResult.errors && importResult && Array.isArray((importResult as unknown as { errors: unknown[] }).errors) && (
                  <LegacyErrorsDisplay errors={(importResult as unknown as { errors: string[] }).errors} />
                )}

                {/* Close Button */}
                <Button
                  onClick={handleClose}
                  className="w-full bg-[#934f2c] hover:bg-[#004422] text-white"
                >
                  Cerrar
                </Button>
              </motion.div>
            )}

            {/* ERROR STATE */}
            {dialogState === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center py-8"
              >
                <div className="bg-red-100 p-4 rounded-full mb-4">
                  <XCircle className="size-10 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-[#111111] mb-2">
                  Error al procesar
                </h3>
                <p className="text-sm text-[#4c4c4c] text-center max-w-md mb-6">
                  {error}
                </p>
                <Button
                  variant="outline"
                  onClick={resetState}
                  className="gap-2"
                >
                  <ArrowLeft className="size-4" />
                  Intentar de nuevo
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Legacy errors display for backwards compatibility
 */
function LegacyErrorsDisplay({ errors }: { errors: string[] }) {
  if (!errors || errors.length === 0) return null;

  return (
    <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="size-5 text-amber-600" />
        <span className="text-sm font-bold text-amber-700">
          Detalles ({errors.length})
        </span>
      </div>
      <div className="space-y-2 max-h-32 overflow-y-auto">
        {errors.map((err, idx) => (
          <div
            key={idx}
            className="text-xs text-amber-700 bg-amber-100 rounded px-2 py-1"
          >
            {err}
          </div>
        ))}
      </div>
    </div>
  );
}
