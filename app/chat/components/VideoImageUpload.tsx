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

  // Convertir imagen a JPEG usando Canvas (útil para HEIC y otros formatos)
  const convertToJpeg = useCallback(async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error('No se pudo crear contexto de canvas'));
          return;
        }

        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const newFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
                type: 'image/jpeg',
              });
              resolve(newFile);
            } else {
              reject(new Error('Error al convertir imagen'));
            }
          },
          'image/jpeg',
          0.92
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Error al cargar imagen'));
      };

      img.src = url;
    });
  }, []);

  const handleUpload = useCallback(async (file: File) => {
    // Validate file type - incluir HEIC
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];
    const isHeic = file.type === 'image/heic' || file.type === 'image/heif' ||
                   file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');

    if (!allowedTypes.includes(file.type) && !isHeic) {
      setError('Solo JPG, PNG, WebP, GIF o HEIC');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Máximo 10MB');
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      // Convertir HEIC u otros formatos a JPEG
      let fileToUpload = file;
      if (isHeic || !['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
        console.log('[VideoImageUpload] Convirtiendo imagen a JPEG...');
        fileToUpload = await convertToJpeg(file);
      }

      // Create preview from converted file
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(fileToUpload);

      const formData = new FormData();
      formData.append('file', fileToUpload);

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
      console.error('[VideoImageUpload] Error completo:', err);
      console.error('[VideoImageUpload] Tipo de archivo:', file.type, 'Nombre:', file.name);
      setError(err instanceof Error ? err.message : 'Error al subir');
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  }, [onImageUploaded, convertToJpeg]);

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
        <div className="relative w-12 h-12 rounded-lg overflow-hidden border-2 border-green-500/60 shadow-sm">
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
          ? 'border-green-500 bg-green-50 scale-105'
          : 'border-gray-300 hover:border-green-500 hover:bg-green-50/50'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${error ? 'border-red-300 bg-red-50/50' : ''}
      `}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {isUploading ? (
        <Loader2 className="size-5 text-green-500 animate-spin" />
      ) : error ? (
        <div className="absolute inset-0 flex items-center justify-center p-1">
          <span className="text-[8px] text-red-500 text-center leading-tight">{error}</span>
        </div>
      ) : (
        <ImagePlus className={`size-5 ${isDragging ? 'text-green-500' : 'text-gray-400'}`} />
      )}
    </div>
  );
}
