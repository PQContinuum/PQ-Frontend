'use client';

import { Image as ImageIcon, FileText, File, FileCode } from 'lucide-react';

interface Attachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  mimeType?: string;
}

interface AttachmentsPreviewProps {
  attachments: Attachment[];
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileIcon = (fileType: string, mimeType?: string) => {
  if (fileType === 'image') {
    return <ImageIcon className="w-4 h-4" />;
  }

  if (mimeType === 'application/pdf') {
    return <File className="w-4 h-4" />;
  }

  if (mimeType && mimeType.includes('text/')) {
    return <FileText className="w-4 h-4" />;
  }

  if (fileType === 'code') {
    return <FileCode className="w-4 h-4" />;
  }

  if (fileType === 'document') {
    return <FileText className="w-4 h-4" />;
  }

  return <File className="w-4 h-4" />;
};

const getFileColor = (fileType: string, mimeType?: string) => {
  if (fileType === 'image') {
    return 'from-blue-500/90 to-blue-600/90 border-blue-400/30';
  }

  if (mimeType === 'application/pdf') {
    return 'from-red-500/90 to-red-600/90 border-red-400/30';
  }

  if (mimeType && mimeType.includes('text/')) {
    return 'from-green-500/90 to-green-600/90 border-green-400/30';
  }

  if (fileType === 'document') {
    return 'from-green-500/90 to-green-600/90 border-green-400/30';
  }

  return 'from-gray-500/90 to-gray-600/90 border-gray-400/30';
};

const getFileExtension = (fileName: string): string => {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : '';
};

export function AttachmentsPreview({ attachments }: AttachmentsPreviewProps) {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 mb-3">
      {/* Header */}
      <div className="flex items-center gap-2 text-white/80 text-xs font-medium">
        <div className="w-1 h-1 rounded-full bg-white/60"></div>
        <span>{attachments.length} {attachments.length === 1 ? 'archivo adjunto' : 'archivos adjuntos'}</span>
      </div>

      {/* Attachments Grid */}
      <div className="grid grid-cols-1 gap-2">
        {attachments.map((attachment, index) => {
          const extension = getFileExtension(attachment.fileName);
          const colorClass = getFileColor(attachment.fileType, attachment.mimeType);

          return (
            <div
              key={attachment.id}
              className="group relative overflow-hidden rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-all duration-200"
              style={{
                animationDelay: `${index * 50}ms`,
                animation: 'slideInFromLeft 0.3s ease-out forwards',
              }}
            >
              {/* Gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-r ${colorClass} opacity-0 group-hover:opacity-20 transition-opacity duration-200`}></div>

              <div className="relative flex items-center gap-3 p-3">
                {/* Icon with background */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br ${colorClass} flex items-center justify-center text-white shadow-lg`}>
                  {getFileIcon(attachment.fileType, attachment.mimeType)}
                </div>

                {/* File info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-white truncate">
                      {attachment.fileName}
                    </p>
                    {extension && (
                      <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-bold text-white/90 bg-white/20 rounded">
                        {extension}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/60 font-medium">
                    {formatFileSize(attachment.fileSize)}
                  </p>
                </div>

                {/* Type badge */}
                <div className="flex-shrink-0">
                  <span className="px-2 py-1 text-[10px] font-semibold text-white/80 bg-white/10 rounded-md border border-white/20">
                    {attachment.fileType === 'image' ? 'Imagen' : 'Documento'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
