'use client';

import { useCallback, useState } from 'react';
import {
  Upload,
  X,
  Image as ImageIcon,
  FileText,
  Loader2,
  FileSpreadsheet,
  FileCode,
  FileJson,
  FileType,
  Presentation,
  Book,
  Table,
  Code,
} from 'lucide-react';

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

// Helper function to get icon component based on MIME type
function getFileIcon(mimeType?: string) {
  if (!mimeType) return FileText;

  // Excel/Spreadsheets
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
    return FileSpreadsheet;
  }

  // PowerPoint/Presentations
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) {
    return Presentation;
  }

  // Word documents
  if (mimeType.includes('word') || mimeType.includes('opendocument.text')) {
    return FileType;
  }

  // Code files
  if (
    mimeType.includes('javascript') ||
    mimeType.includes('typescript') ||
    mimeType.includes('python') ||
    mimeType.includes('java') ||
    mimeType.includes('x-c') ||
    mimeType.includes('x-go') ||
    mimeType.includes('x-rust') ||
    mimeType.includes('x-php') ||
    mimeType.includes('x-ruby') ||
    mimeType.includes('x-swift') ||
    mimeType.includes('x-kotlin') ||
    mimeType.includes('x-sh')
  ) {
    return FileCode;
  }

  // Data formats
  if (mimeType.includes('json') || mimeType.includes('ipynb')) {
    return FileJson;
  }

  if (mimeType.includes('csv') || mimeType.includes('xml') || mimeType.includes('yaml')) {
    return Table;
  }

  // eBooks
  if (mimeType.includes('epub')) {
    return Book;
  }

  // PDF
  if (mimeType.includes('pdf')) {
    return FileText;
  }

  // Markdown, HTML, CSS, SQL
  if (mimeType.includes('markdown') || mimeType.includes('html') || mimeType.includes('css') || mimeType.includes('sql')) {
    return Code;
  }

  // Default
  return FileText;
}

// Helper function to get color gradient based on MIME type
function getFileColor(mimeType?: string): string {
  if (!mimeType) return 'from-green-500 to-green-600';

  // Excel - green
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
    return 'from-emerald-500 to-emerald-600';
  }

  // PowerPoint - orange/red
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) {
    return 'from-orange-500 to-red-600';
  }

  // Word - blue
  if (mimeType.includes('word') || mimeType.includes('opendocument.text')) {
    return 'from-blue-500 to-blue-600';
  }

  // Code files - purple
  if (
    mimeType.includes('javascript') ||
    mimeType.includes('typescript') ||
    mimeType.includes('python') ||
    mimeType.includes('java') ||
    mimeType.includes('x-c') ||
    mimeType.includes('x-go') ||
    mimeType.includes('x-rust') ||
    mimeType.includes('x-php') ||
    mimeType.includes('x-ruby') ||
    mimeType.includes('x-swift') ||
    mimeType.includes('x-kotlin') ||
    mimeType.includes('x-sh')
  ) {
    return 'from-purple-500 to-purple-600';
  }

  // Data formats - cyan
  if (
    mimeType.includes('json') ||
    mimeType.includes('csv') ||
    mimeType.includes('xml') ||
    mimeType.includes('yaml') ||
    mimeType.includes('ipynb')
  ) {
    return 'from-cyan-500 to-cyan-600';
  }

  // eBooks - amber
  if (mimeType.includes('epub')) {
    return 'from-amber-500 to-amber-600';
  }

  // PDF - red
  if (mimeType.includes('pdf')) {
    return 'from-red-500 to-red-600';
  }

  // Markdown, HTML, CSS, SQL - indigo
  if (mimeType.includes('markdown') || mimeType.includes('html') || mimeType.includes('css') || mimeType.includes('sql')) {
    return 'from-indigo-500 to-indigo-600';
  }

  // Default - green
  return 'from-green-500 to-green-600';
}

// Helper function to get file type label based on MIME type
function getFileTypeLabel(mimeType?: string): string {
  if (!mimeType) return 'Documento';

  // Excel
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
    return 'Excel';
  }

  // PowerPoint
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) {
    return 'PowerPoint';
  }

  // Word
  if (mimeType.includes('wordprocessingml')) {
    return 'Word';
  }

  if (mimeType.includes('msword')) {
    return 'Word';
  }

  // OpenDocument
  if (mimeType.includes('opendocument.text')) {
    return 'ODT';
  }

  if (mimeType.includes('opendocument.spreadsheet')) {
    return 'ODS';
  }

  if (mimeType.includes('opendocument.presentation')) {
    return 'ODP';
  }

  // PDF
  if (mimeType.includes('pdf')) {
    return 'PDF';
  }

  // eBooks
  if (mimeType.includes('epub')) {
    return 'EPUB';
  }

  if (mimeType.includes('rtf')) {
    return 'RTF';
  }

  // Code files
  if (mimeType.includes('javascript')) {
    return 'JavaScript';
  }

  if (mimeType.includes('typescript')) {
    return 'TypeScript';
  }

  if (mimeType.includes('python')) {
    return 'Python';
  }

  if (mimeType.includes('java') && !mimeType.includes('javascript')) {
    return 'Java';
  }

  if (mimeType.includes('x-c++')) {
    return 'C++';
  }

  if (mimeType.includes('x-c')) {
    return 'C';
  }

  if (mimeType.includes('x-csharp')) {
    return 'C#';
  }

  if (mimeType.includes('x-go')) {
    return 'Go';
  }

  if (mimeType.includes('x-rust')) {
    return 'Rust';
  }

  if (mimeType.includes('x-php')) {
    return 'PHP';
  }

  if (mimeType.includes('x-ruby')) {
    return 'Ruby';
  }

  if (mimeType.includes('x-swift')) {
    return 'Swift';
  }

  if (mimeType.includes('x-kotlin')) {
    return 'Kotlin';
  }

  if (mimeType.includes('x-sh')) {
    return 'Shell';
  }

  // Data formats
  if (mimeType.includes('json') && !mimeType.includes('ipynb')) {
    return 'JSON';
  }

  if (mimeType.includes('ipynb')) {
    return 'Jupyter';
  }

  if (mimeType.includes('csv')) {
    return 'CSV';
  }

  if (mimeType.includes('xml')) {
    return 'XML';
  }

  if (mimeType.includes('yaml')) {
    return 'YAML';
  }

  // Web
  if (mimeType.includes('html')) {
    return 'HTML';
  }

  if (mimeType.includes('css')) {
    return 'CSS';
  }

  if (mimeType.includes('sql')) {
    return 'SQL';
  }

  // Markdown
  if (mimeType.includes('markdown')) {
    return 'Markdown';
  }

  // Plain text
  if (mimeType.includes('text/plain')) {
    return 'Texto';
  }

  // Default
  return 'Documento';
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
          accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.ods,.odp,.rtf,.epub,text/*,application/json,text/csv,application/xml,text/xml,text/html,application/x-yaml,.js,.ts,.tsx,.jsx,.py,.java,.c,.cpp,.cs,.go,.rs,.php,.rb,.swift,.kt,.sh,.yaml,.yml,.toml,.ini,.md,.css,.sql,.ipynb"
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
            <span className="font-medium">Imágenes:</span> PNG, JPG, GIF, WebP, BMP, TIFF, HEIF, SVG
          </p>
          <p className="text-xs text-gray-500 text-center mt-0.5">
            <span className="font-medium">Office:</span> Word, Excel, PowerPoint · <span className="font-medium">Docs:</span> PDF, TXT, MD, RTF, ODT, EPUB
          </p>
          <p className="text-xs text-gray-500 text-center mt-0.5">
            <span className="font-medium">Código:</span> JS, TS, PY, Java, CSS, SQL · <span className="font-medium">Datos:</span> JSON, CSV, XML, YAML
          </p>
          <p className="text-xs text-gray-500 text-center mt-0.5">
            <span className="font-medium">Notebooks:</span> Jupyter (.ipynb)
          </p>
          <p className="text-xs text-gray-400 mt-1.5">
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
                      : `bg-gradient-to-br ${getFileColor(attachment.mimeType)}`
                  } shadow-md`}>
                    {attachment.fileType === 'image' ? (
                      <ImageIcon className="w-6 h-6 text-white" />
                    ) : (() => {
                        const IconComponent = getFileIcon(attachment.mimeType);
                        return <IconComponent className="w-6 h-6 text-white" />;
                      })()}
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
                        {attachment.fileType === 'image' ? 'Imagen' : getFileTypeLabel(attachment.mimeType)}
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
