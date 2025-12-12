'use client';

import { useState, useCallback, useRef } from 'react';
import { ImagePlus, X, Loader2, CheckCircle2 } from 'lucide-react';

interface VideoImageUploadProps {
  onImageUploaded: (url: string) => void;
  onImageRemoved: () => void;
  currentImageUrl?: string;
  disabled?: boolean;
}

export function VideoImageUpload({
  onImageUploaded,
  onImageRemoved,
  currentImageUrl,
  disabled = false,
}: VideoImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(async (file: File) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError('Solo JPG, PNG, WebP o GIF');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Máximo 10MB');
      return;
    }

    setError(null);
    setIsUploading(true);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/video-gen/upload-image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al subir imagen');
      }

      onImageUploaded(data.url);
    } catch (err) {
      console.error('[VideoImageUpload] Error:', err);
      setError(err instanceof Error ? err.message : 'Error al subir');
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  }, [onImageUploaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled || isUploading) return;

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleUpload(file);
    }
  }, [disabled, isUploading, handleUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  }, [disabled, isUploading]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleClick = useCallback(() => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  }, [disabled, isUploading]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  }, [handleUpload]);

  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewUrl(null);
    setError(null);
    onImageRemoved();
  }, [onImageRemoved]);

  // Compact preview with image
  if (previewUrl && !isUploading) {
    return (
      <div className="relative group">
        <div className="relative w-12 h-12 rounded-lg overflow-hidden border-2 border-violet-400/60 shadow-sm">
          <img
            src={previewUrl}
            alt="Imagen para video"
            className="w-full h-full object-cover"
          />
          {/* Success indicator */}
          <div className="absolute bottom-0 right-0 p-0.5 bg-green-500 rounded-tl-md">
            <CheckCircle2 className="size-2.5 text-white" />
          </div>
        </div>
        {/* Remove button */}
        <button
          type="button"
          onClick={handleRemove}
          className="absolute -top-1.5 -right-1.5 p-0.5 bg-gray-800 hover:bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="size-3" />
        </button>
      </div>
    );
  }

  // Upload zone (minimalist)
  return (
    <div
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`
        relative flex items-center justify-center
        w-12 h-12 rounded-lg border-2 border-dashed
        transition-all cursor-pointer
        ${isDragging
          ? 'border-violet-500 bg-violet-50 scale-105'
          : 'border-gray-300 hover:border-violet-400 hover:bg-violet-50/50'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${error ? 'border-red-300 bg-red-50/50' : ''}
      `}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {isUploading ? (
        <Loader2 className="size-5 text-violet-500 animate-spin" />
      ) : error ? (
        <div className="absolute inset-0 flex items-center justify-center p-1">
          <span className="text-[8px] text-red-500 text-center leading-tight">{error}</span>
        </div>
      ) : (
        <ImagePlus className={`size-5 ${isDragging ? 'text-violet-500' : 'text-gray-400'}`} />
      )}
    </div>
  );
}
