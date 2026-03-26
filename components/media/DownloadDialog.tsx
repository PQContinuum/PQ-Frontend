'use client';

import { useState, useEffect } from 'react';
import { Check, Download, X as XIcon, Video, Image as ImageIcon } from 'lucide-react';
import { downloadVideoMp4 } from '@/lib/media-download';

type DownloadState = 'ready' | 'downloading' | 'done' | 'error';

interface DownloadDialogProps {
  mediaType: 'video' | 'image';
  url: string;
  title: string;
  thumbnailUrl?: string | null;
  onClose: () => void;
}

export function DownloadDialog({ mediaType, url, title, thumbnailUrl, onClose }: DownloadDialogProps) {
  const [state, setState] = useState<DownloadState>('ready');
  const [progress, setProgress] = useState(0);

  // Animate fake progress while downloading
  useEffect(() => {
    if (state !== 'downloading') return;
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) { clearInterval(interval); return 90; }
        return p + Math.random() * 15;
      });
    }, 300);
    return () => clearInterval(interval);
  }, [state]);

  const handleDownload = async () => {
    setState('downloading');
    setProgress(0);

    try {
      if (mediaType === 'video') {
        await downloadVideoMp4(url, title || `video-${Date.now()}.mp4`);
      } else {
        const response = await fetch(url);
        const blob = await response.blob();
        const objectUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = title || `imagen-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(objectUrl);
      }
      setProgress(100);
      setState('done');
    } catch (err) {
      console.error('Download error:', err);
      setState('error');
    }
  };

  const isVideo = mediaType === 'video';
  const Icon = isVideo ? Video : ImageIcon;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Preview header */}
        <div className="relative h-40 bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center overflow-hidden">
          {thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumbnailUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40 blur-sm" />
          ) : null}
          <div className="relative z-10 flex flex-col items-center">
            {state === 'done' ? (
              <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center animate-in zoom-in duration-300">
                <Check className="w-8 h-8 text-white" />
              </div>
            ) : state === 'downloading' ? (
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="28" fill="none" stroke="white" strokeOpacity="0.2" strokeWidth="4" />
                  <circle
                    cx="32" cy="32" r="28" fill="none" stroke="white" strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 28}`}
                    strokeDashoffset={`${2 * Math.PI * 28 * (1 - progress / 100)}`}
                    className="transition-all duration-300"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-white text-sm font-bold">
                  {Math.round(progress)}%
                </span>
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                <Icon className="w-7 h-7 text-white" />
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 pb-8 sm:pb-6">
          {/* Close button */}
          <div className="flex justify-end -mt-2 mb-1">
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 transition">
              <XIcon className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {state === 'done' ? 'Descarga completada' : state === 'downloading' ? 'Descargando...' : state === 'error' ? 'Error en la descarga' : `Descargar ${isVideo ? 'video' : 'imagen'}`}
          </h3>

          <p className="text-sm text-gray-400 mb-1 line-clamp-1">{title || 'Sin título'}</p>

          {state === 'downloading' && (
            <div className="mt-4 w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#FF8B3D] rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {state === 'done' && (
            <p className="text-sm text-green-600 mt-2">
              Tu archivo se guardó correctamente.
            </p>
          )}

          {state === 'error' && (
            <p className="text-sm text-red-500 mt-2">
              No se pudo completar la descarga. Intenta de nuevo.
            </p>
          )}

          {/* Action button */}
          <div className="mt-5">
            {state === 'ready' && (
              <button
                onClick={handleDownload}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#FF8B3D] hover:bg-[#e67a2e] text-white font-medium text-sm transition active:scale-[0.98]"
              >
                <Download className="w-5 h-5" />
                Descargar {isVideo ? 'video' : 'imagen'}
              </button>
            )}
            {state === 'error' && (
              <button
                onClick={handleDownload}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#FF8B3D] hover:bg-[#e67a2e] text-white font-medium text-sm transition active:scale-[0.98]"
              >
                Reintentar
              </button>
            )}
            {state === 'done' && (
              <button
                onClick={onClose}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-medium text-sm transition active:scale-[0.98]"
              >
                Listo
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
