'use client';

import { useCallback, useState } from 'react';
import { Upload, X, Image as ImageIcon, FileText, Loader2 } from 'lucide-react';

interface Attachment {
  id: string;
  fileName: string;
  fileType: 'image' | 'document';
  fileSize: number;
  url: string;
  thumbnailUrl?: string;
  mimeType?: string;
}

interface FileUploadProps {
  conversationId: string;
  onAttachmentsChange: (attachments: Attachment[]) => void;
}

export function FileUpload({ conversationId, onAttachmentsChange }: FileUploadProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      const uploadedAttachments: Attachment[] = [];

      for (let i = 0; i < Math.min(files.length, 10); i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`/api/conversations/${conversationId}/attachments`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Upload failed');
        }

        const data = await response.json();
        uploadedAttachments.push(data.attachment);
      }

      const newAttachments = [...attachments, ...uploadedAttachments];
      setAttachments(newAttachments);
      onAttachmentsChange(newAttachments);

    } catch (error) {
      console.error('Upload error:', error);
      alert(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [conversationId, attachments, onAttachmentsChange]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files);
    }
  }, [handleUpload]);

  const removeAttachment = useCallback((id: string) => {
    const newAttachments = attachments.filter(a => a.id !== id);
    setAttachments(newAttachments);
    onAttachmentsChange(newAttachments);
  }, [attachments, onAttachmentsChange]);

  return (
    <div className="space-y-3">
      {/* Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-8 transition-all duration-300 ${
          dragActive
            ? 'border-[#00552b] bg-gradient-to-br from-[#00552b]/10 to-[#00aa56]/5 scale-[1.02]'
            : 'border-gray-300 hover:border-[#00552b]/50 hover:bg-gray-50/50'
        }`}
      >
        {dragActive && (
          <div className="absolute inset-0 bg-[#00552b]/5 rounded-2xl animate-pulse pointer-events-none"></div>
        )}

        <input
          type="file"
          id="file-upload"
          className="hidden"
          multiple
          accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain"
          onChange={(e) => handleUpload(e.target.files)}
          disabled={uploading}
        />

        <label
          htmlFor="file-upload"
          className="flex flex-col items-center cursor-pointer"
        >
          <div className={`relative mb-4 ${uploading ? 'animate-bounce' : ''}`}>
            {uploading ? (
              <div className="relative">
                <div className="absolute inset-0 bg-[#00552b]/20 rounded-full blur-xl"></div>
                <Loader2 className="relative w-12 h-12 text-[#00552b] animate-spin" />
              </div>
            ) : (
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-[#00552b]/20 to-[#00aa56]/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative bg-gradient-to-br from-[#00552b] to-[#00aa56] p-3 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                  <Upload className="w-6 h-6 text-white" />
                </div>
              </div>
            )}
          </div>

          <p className="text-base font-semibold text-gray-800 text-center mb-1">
            {uploading ? 'Subiendo archivos...' : dragActive ? '¡Suelta los archivos aquí!' : 'Arrastra archivos o haz clic'}
          </p>
          <p className="text-xs text-gray-500 text-center">
            <span className="font-medium">Imágenes:</span> PNG, JPG, GIF, WebP · <span className="font-medium">Docs:</span> PDF, TXT
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Máximo 20MB por archivo
          </p>
        </label>
      </div>

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">
              {attachments.length} {attachments.length === 1 ? 'archivo listo' : 'archivos listos'}
            </p>
            <div className="h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent ml-3"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {attachments.map((attachment, index) => (
              <div
                key={attachment.id}
                className="group relative border border-gray-200 rounded-xl p-3 hover:border-[#00552b] hover:shadow-md transition-all duration-200 bg-white"
                style={{
                  animationDelay: `${index * 50}ms`,
                  animation: 'slideInFromLeft 0.3s ease-out forwards',
                }}
              >
                <button
                  onClick={() => removeAttachment(attachment.id)}
                  className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg hover:scale-110"
                  title="Eliminar archivo"
                >
                  <X className="w-3 h-3" />
                </button>

                <div className="flex items-center gap-3">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${
                    attachment.fileType === 'image'
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                      : 'bg-gradient-to-br from-green-500 to-green-600'
                  } shadow-md`}>
                    {attachment.fileType === 'image' ? (
                      <ImageIcon className="w-6 h-6 text-white" />
                    ) : (
                      <FileText className="w-6 h-6 text-white" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {attachment.fileName}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-gray-500 font-medium">
                        {(attachment.fileSize / 1024).toFixed(1)} KB
                      </p>
                      <span className="text-xs text-gray-400">•</span>
                      <p className="text-xs text-[#00552b] font-medium">
                        {attachment.fileType === 'image' ? 'Imagen' : 'Documento'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
