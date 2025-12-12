'use client';

import { useState, type ComponentPropsWithoutRef, useMemo, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';

import type { ChatMessage } from '@/app/chat/store';
import { GeoCulturalResponse } from './GeoCulturalResponse';
import { AttachmentsPreview } from './AttachmentsPreview';
import { SpeechButton } from './SpeechButton';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useGenerationJob, getJobStatusMessage } from '@/hooks/useGenerationJobs';

import 'highlight.js/styles/github.css';

// Minimalist media generation skeleton - works for both image and video
interface MediaGeneratingSkeletonProps {
  type: 'image' | 'video';
  aspectRatio?: 'square' | 'landscape' | 'portrait';
}

const MediaGeneratingSkeleton = ({ type, aspectRatio = 'square' }: MediaGeneratingSkeletonProps) => {
  // Determine dimensions based on type and aspect ratio - RESPONSIVE
  const getDimensions = () => {
    if (type === 'image') {
      // Responsive: full width on mobile, fixed on desktop
      return 'w-full max-w-[340px] aspect-square';
    }
    // Video dimensions based on aspect ratio - responsive
    switch (aspectRatio) {
      case 'portrait':
        return 'w-full max-w-[280px] sm:max-w-[320px] aspect-[9/16]'; // 9:16
      case 'landscape':
      default:
        return 'w-full max-w-[400px] sm:max-w-[560px] aspect-video'; // 16:9
    }
  };

  const isVideo = type === 'video';

  return (
    <div className={`${getDimensions()} rounded-2xl overflow-hidden relative bg-[#f5f5f5]`}>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {/* Circular loader with icon */}
        <div className="relative">
          {/* Spinning arc - the main loading indicator */}
          <svg
            className="size-24 animate-[spin_1.5s_linear_infinite]"
            viewBox="0 0 100 100"
          >
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="#e5e5e5"
              strokeWidth="3"
            />
            {/* Animated arc */}
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="#1a1a1a"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="66 198"
              className="origin-center"
            />
          </svg>

          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="size-16 bg-white rounded-full shadow-sm flex items-center justify-center">
              {isVideo ? (
                // Video/Play icon
                <svg
                  className="size-7 text-[#1a1a1a]"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              ) : (
                // Image/Mountain icon
                <svg
                  className="size-7 text-[#1a1a1a]"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2zm0-2V5h14v14H5z" />
                  <path d="M12 9a2 2 0 100-4 2 2 0 000 4z" />
                  <path d="M5 19l4-6 3 4 4-5 4 7H5z" />
                </svg>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Wrapper components for backwards compatibility
const ImageGeneratingSkeleton = () => <MediaGeneratingSkeleton type="image" />;
const VideoGeneratingSkeleton = () => <MediaGeneratingSkeleton type="video" aspectRatio="landscape" />;

// Custom video component with controls and download functionality
const ChatVideo = ({ src }: { src: string }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!src) return;

    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `video-generado-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading video:', error);
    }
  };

  if (hasError) {
    return (
      <span className="block w-full max-w-[560px] aspect-video rounded-2xl bg-gray-100 flex items-center justify-center">
        <span className="text-sm text-gray-400">Error al cargar video</span>
      </span>
    );
  }

  return (
    <span className="block w-full max-w-[560px]">
      {/* Title */}
      <span className="block text-sm font-semibold text-gray-800 mb-2">Video creado</span>

      <span className="relative block group">
        {isLoading && (
          <span className="absolute inset-0 block rounded-2xl bg-gray-100 animate-pulse aspect-video" />
        )}
        <video
          src={src}
          controls
          className={`w-full rounded-2xl shadow-lg transition-opacity duration-300 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onLoadedData={() => setIsLoading(false)}
          onError={() => setHasError(true)}
          preload="metadata"
        />

        {/* Hover overlay with download button */}
        {!isLoading && (
          <span className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleDownload}
                  className="p-2 bg-black/60 hover:bg-black/80 rounded-lg backdrop-blur-sm transition"
                >
                  <svg className="size-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
              </TooltipTrigger>
              <TooltipContent>Descargar video</TooltipContent>
            </Tooltip>
          </span>
        )}
      </span>
    </span>
  );
};

// Custom image component with lightbox, download, and share functionality
const ChatImage = ({ src, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const imageUrl = typeof src === 'string' ? src : '';

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!imageUrl) return;

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `imagen-generada-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  const handleCopyLink = async () => {
    if (!imageUrl) return;
    try {
      await navigator.clipboard.writeText(imageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying link:', error);
    }
  };

  const handleShare = (platform: string) => {
    if (!imageUrl) return;
    const text = encodeURIComponent('Mira esta imagen que generé con IA ✨');
    const url = encodeURIComponent(imageUrl);

    const shareUrls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      reddit: `https://reddit.com/submit?url=${url}&title=${text}`,
    };

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
  };

  if (hasError) {
    return (
      <span className="block w-full max-w-[340px] aspect-square rounded-2xl bg-gray-100 flex items-center justify-center">
        <span className="text-sm text-gray-400">Error al cargar imagen</span>
      </span>
    );
  }

  return (
    <>
      <span className="block w-full max-w-[340px]">
        {/* Title */}
        <span className="block text-sm font-semibold text-gray-800 mb-2">Imagen creada</span>

        <span className="relative block group cursor-pointer">
          {isLoading && (
            <span className="absolute inset-0 block rounded-2xl bg-gray-100 animate-pulse" />
          )}

          {/* Image */}
          <img
            src={src}
            alt={alt || 'Imagen generada'}
            className="w-full h-auto rounded-2xl shadow-sm border border-black/5 transition-transform duration-200 group-hover:scale-[1.02]"
            onClick={() => setShowLightbox(true)}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
            {...props}
          />

        {/* Hover overlay with gradient and actions */}
        {!isLoading && (
          <span
            className="absolute inset-0 rounded-2xl overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            onClick={() => setShowLightbox(true)}
          >
            {/* Bottom gradient for visibility */}
            <span className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />

            {/* Action buttons */}
            <span className="absolute inset-x-0 bottom-0 flex items-center justify-between p-3">
              {/* Download button - left */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleDownload(e); }}
                    className="p-2 text-white hover:scale-110 transition-transform duration-150"
                  >
                    <svg className="size-5 drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">Descargar</TooltipContent>
              </Tooltip>

              {/* Share button - right */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setShowShareModal(true); }}
                    className="p-2 text-white hover:scale-110 transition-transform duration-150"
                  >
                    <svg className="size-5 drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">Compartir</TooltipContent>
              </Tooltip>
            </span>
          </span>
        )}
        </span>
      </span>

      {/* Lightbox Modal */}
      {showLightbox && (
        <span
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-[fade-in_0.2s_ease-out]"
          onClick={() => setShowLightbox(false)}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setShowLightbox(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Large image */}
          <img
            src={src}
            alt={alt || 'Imagen generada'}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Bottom actions */}
          <span className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3">
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-full text-sm font-medium text-gray-800 hover:bg-gray-100 transition shadow-lg"
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Descargar
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setShowShareModal(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-full text-sm font-medium text-gray-800 hover:bg-gray-100 transition shadow-lg"
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Compartir
            </button>
          </span>
        </span>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <span
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-[fade-in_0.2s_ease-out]"
          onClick={() => setShowShareModal(false)}
        >
          <span
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-[fade-in-up_0.3s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <span className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <span className="text-lg font-semibold text-gray-900">Compartir imagen</span>
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 transition"
              >
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>

            {/* Image preview */}
            <span className="block p-4 bg-gray-50">
              <img
                src={src}
                alt={alt || 'Imagen generada'}
                className="w-full max-h-48 object-contain rounded-xl"
              />
            </span>

            {/* Share options */}
            <span className="block p-6 space-y-3">
              {/* Copy link */}
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition text-left"
              >
                <span className="flex items-center justify-center size-10 rounded-full bg-gray-200">
                  {copied ? (
                    <svg className="size-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="size-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  )}
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-medium text-gray-900">
                    {copied ? '¡Copiado!' : 'Copiar enlace'}
                  </span>
                  <span className="block text-xs text-gray-500">Comparte el enlace directo</span>
                </span>
              </button>

              {/* Social share buttons */}
              <span className="flex items-center gap-2">
                {/* X (Twitter) */}
                <button
                  type="button"
                  onClick={() => handleShare('twitter')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-black hover:bg-gray-800 transition text-white"
                >
                  <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  <span className="text-sm font-medium">X</span>
                </button>

                {/* LinkedIn */}
                <button
                  type="button"
                  onClick={() => handleShare('linkedin')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#0A66C2] hover:bg-[#004182] transition text-white"
                >
                  <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  <span className="text-sm font-medium">LinkedIn</span>
                </button>

                {/* Reddit */}
                <button
                  type="button"
                  onClick={() => handleShare('reddit')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#FF4500] hover:bg-[#CC3700] transition text-white"
                >
                  <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
                  </svg>
                  <span className="text-sm font-medium">Reddit</span>
                </button>
              </span>

              {/* Download */}
              <button
                type="button"
                onClick={handleDownload}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition text-left"
              >
                <span className="flex items-center justify-center size-10 rounded-full bg-green-100">
                  <svg className="size-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-medium text-gray-900">Descargar imagen</span>
                  <span className="block text-xs text-gray-500">Guardar en tu dispositivo</span>
                </span>
              </button>
            </span>
          </span>
        </span>
      )}
    </>
  );
};

export type GeoCulturalAnalysisText = {
  type: 'geocultural_analysis';
  reply: string;
  areaName?: string;
};

type MessageBubbleProps = {
  message: ChatMessage;
  isStreaming?: boolean;
  attachments?: Array<{
    id: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    mimeType?: string;
  }>;
  // Props se mantienen para compatibilidad pero ahora message.generationState es la fuente de verdad
  isGenerating?: boolean;
  generationMode?: 'none' | 'image' | 'video' | 'geocultural';
};

type MarkdownCodeProps = ComponentPropsWithoutRef<'code'> & {
  inline?: boolean;
  className?: string;
};

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Ignore clipboard errors
  }
};

const CodeBlock = ({
  language,
  value,
}: {
  language: string;
  value: string;
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await copyToClipboard(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={handleCopy}
        className="absolute right-3 top-3 rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-medium text-[#111111] opacity-0 shadow-sm transition group-hover:opacity-100"
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
      <pre className="overflow-x-auto rounded-2xl border border-black/10 bg-[#f7f7f7] p-4 text-sm text-[#111111]">
        <code className={`language-${language}`}>{value}</code>
      </pre>
    </div>
  );
};

export function MessageBubble({ message, isStreaming = false, attachments }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  // Estado de generación desde el mensaje
  const generationState = message.generationState;

  // Extract jobId from generationState for job recovery
  const jobId = generationState?.jobId || null;

  // Poll the job if we have a jobId - this is KEY for recovery after app close
  const { data: job, isLoading: isJobLoading } = useGenerationJob(jobId);

  // Determine the actual generation status based on job polling
  // This overrides the local generationState when we have job data
  const effectiveStatus = useMemo(() => {
    if (!jobId) {
      // No job tracking, use local state
      return generationState?.status || null;
    }

    if (isJobLoading && !job) {
      // Still loading job data, assume generating
      return 'generating';
    }

    if (job) {
      // Job data available - use job status as source of truth
      switch (job.status) {
        case 'completed':
          return 'completed';
        case 'failed':
        case 'cancelled':
          return 'error';
        case 'pending':
        case 'queued':
        case 'processing':
        case 'uploading':
        default:
          return 'generating';
      }
    }

    // Fallback to local state
    return generationState?.status || null;
  }, [jobId, job, isJobLoading, generationState?.status]);

  // Check if we're generating media (either from local state or job polling)
  const isGeneratingMedia = effectiveStatus === 'generating';

  // Get the video URL from completed job or from message content
  const jobVideoUrl = job?.status === 'completed' && job.jobType === 'video' ? job.publicUrl : null;
  const jobImageUrl = job?.status === 'completed' && job.jobType === 'image' ? job.publicUrl : null;

  // Get progress message from job
  const jobProgressMessage = job ? getJobStatusMessage(job) : null;

  const { geoCulturalData, geoCulturalText, isLoadingGeoCultural, videoUrl } = useMemo(() => {
    if (isUser || !message.content) return { geoCulturalData: null, geoCulturalText: null, isLoadingGeoCultural: false, videoUrl: null };

    const trimmedContent = message.content.trim();

    // Check if content contains a video tag (generated video result)
    const videoMatch = trimmedContent.match(/<video[^>]*src="([^"]+)"[^>]*>/);
    if (videoMatch) {
      return { geoCulturalData: null, geoCulturalText: null, isLoadingGeoCultural: false, videoUrl: videoMatch[1] };
    }

    const looksLikeJSON = trimmedContent.startsWith('{');

    if (looksLikeJSON) {
      try {
        const parsed = JSON.parse(trimmedContent);

        // Check for new geocultural analysis format (text-only)
        if (parsed.type === 'geocultural_analysis' && 'reply' in parsed) {
          // Si está generando geocultural y reply está vacío, mostrar skeleton
          if (generationState?.type === 'geocultural' && isGeneratingMedia && parsed.reply === '') {
            return { geoCulturalData: null, geoCulturalText: null, isLoadingGeoCultural: true, videoUrl: null };
          }
          return { geoCulturalData: null, geoCulturalText: parsed, isLoadingGeoCultural: false, videoUrl: null };
        }

        // Legacy format (with places and map) - no longer used but kept for compatibility
        if (parsed.reply && parsed.places && parsed.userCoords) {
          return { geoCulturalData: parsed, geoCulturalText: null, isLoadingGeoCultural: false, videoUrl: null };
        }
      } catch {
        // Si está generando geocultural, mostrar skeleton mientras parsea
        if (generationState?.type === 'geocultural' && isGeneratingMedia) {
          return { geoCulturalData: null, geoCulturalText: null, isLoadingGeoCultural: true, videoUrl: null };
        }
        return { geoCulturalData: null, geoCulturalText: null, isLoadingGeoCultural: false, videoUrl: null };
      }
    }

    return { geoCulturalData: null, geoCulturalText: null, isLoadingGeoCultural: false, videoUrl: null };
  }, [message.content, isUser, generationState, isGeneratingMedia]);

  // PRIORITY 1: If job completed with video, show the video (recovery case)
  if (jobVideoUrl) {
    return (
      <div className="flex justify-start">
        <div className="inline-flex rounded-4xl border border-transparent bg-transparent text-black px-4 py-2">
          <ChatVideo src={jobVideoUrl} />
        </div>
      </div>
    );
  }

  // PRIORITY 2: If job completed with image, show the image (recovery case)
  if (jobImageUrl) {
    return (
      <div className="flex justify-start w-full">
        <div className="w-full max-w-[380px] px-2 sm:px-4 py-2">
          <ChatImage src={jobImageUrl} alt="Imagen generada" />
        </div>
      </div>
    );
  }

  // PRIORITY 3: Show skeleton while generating image (with progress from job)
  if (isGeneratingMedia && generationState?.type === 'image') {
    return (
      <div className="flex justify-start w-full">
        <div className="w-full max-w-[380px] px-2 sm:px-4 py-2">
          <ImageGeneratingSkeleton />
          {jobProgressMessage && (
            <p className="text-xs text-gray-500 mt-2 text-center">{jobProgressMessage}</p>
          )}
        </div>
      </div>
    );
  }

  // PRIORITY 4: Show skeleton while generating video (with progress from job)
  if (isGeneratingMedia && generationState?.type === 'video') {
    return (
      <div className="flex justify-start w-full">
        <div className="w-full max-w-[600px] px-2 sm:px-4 py-2">
          <VideoGeneratingSkeleton />
          {jobProgressMessage && (
            <p className="text-xs text-gray-500 mt-2 text-center">{jobProgressMessage}</p>
          )}
        </div>
      </div>
    );
  }

  // PRIORITY 5: Job failed - show error from job
  if (effectiveStatus === 'error' && job?.errorMessage) {
    return (
      <div className="flex justify-start">
        <div className="inline-flex rounded-4xl border border-red-200 bg-red-50 text-red-700 px-4 py-2">
          <p className="text-sm">❌ {job.errorMessage}</p>
        </div>
      </div>
    );
  }

  // PRIORITY 6: Render generated video from content (legacy/fallback)
  if (videoUrl) {
    return (
      <div className="flex justify-start">
        <div className="inline-flex rounded-4xl border border-transparent bg-transparent text-black px-4 py-2">
          <ChatVideo src={videoUrl} />
        </div>
      </div>
    );
  }

  if (isLoadingGeoCultural) {
    return (
      <div className="flex justify-start w-full">
        <div className="inline-flex max-w-full w-full rounded-4xl border border-transparent bg-transparent text-black px-4 py-2">
          <div className="space-y-6 w-full">
            {/* Header skeleton */}
            <div className="flex items-center gap-3 pb-4 border-b border-[#00552b]/10 animate-pulse">
              <div className="size-12 rounded-full bg-gradient-to-br from-[#e8e8e8] to-[#d8d8d8]"></div>
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-[#e8e8e8] rounded w-32"></div>
                <div className="h-5 bg-[#e8e8e8] rounded w-48"></div>
              </div>
            </div>

            {/* Content skeleton */}
            <div className="space-y-6 animate-pulse">
              {/* Section 1 */}
              <div className="space-y-3">
                <div className="h-6 bg-gradient-to-r from-[#00552b]/20 to-[#00552b]/10 rounded w-2/5"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-[#e8e8e8] rounded w-full"></div>
                  <div className="h-4 bg-[#e8e8e8] rounded w-11/12"></div>
                  <div className="h-4 bg-[#e8e8e8] rounded w-10/12"></div>
                  <div className="h-4 bg-[#e8e8e8] rounded w-full"></div>
                </div>
              </div>

              {/* Section 2 */}
              <div className="space-y-3">
                <div className="h-6 bg-gradient-to-r from-[#00552b]/20 to-[#00552b]/10 rounded w-1/3"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-[#e8e8e8] rounded w-full"></div>
                  <div className="h-4 bg-[#e8e8e8] rounded w-10/12"></div>
                  <div className="h-4 bg-[#e8e8e8] rounded w-11/12"></div>
                </div>
              </div>

              {/* Decorative icon */}
              <div className="flex items-center justify-center py-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-[#00552b]/10 rounded-full blur-xl animate-pulse"></div>
                  <svg className="size-12 text-[#00552b]/20 relative animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>

              {/* Section 3 */}
              <div className="space-y-3">
                <div className="h-6 bg-gradient-to-r from-[#00552b]/20 to-[#00552b]/10 rounded w-2/5"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-[#e8e8e8] rounded w-full"></div>
                  <div className="h-4 bg-[#e8e8e8] rounded w-9/12"></div>
                  <div className="h-4 bg-[#e8e8e8] rounded w-10/12"></div>
                </div>
              </div>

              {/* Section 4 */}
              <div className="space-y-3">
                <div className="h-6 bg-gradient-to-r from-[#00552b]/20 to-[#00552b]/10 rounded w-1/2"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-[#e8e8e8] rounded w-full"></div>
                  <div className="h-4 bg-[#e8e8e8] rounded w-11/12"></div>
                  <div className="h-4 bg-[#e8e8e8] rounded w-10/12"></div>
                  <div className="h-4 bg-[#e8e8e8] rounded w-full"></div>
                </div>
              </div>
            </div>

            {/* Footer skeleton */}
            <div className="pt-6 border-t border-[#00552b]/10 animate-pulse">
              <div className="flex items-center justify-center">
                <div className="h-4 bg-[#e8e8e8] rounded w-48"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render geocultural text analysis (new format)
  if (geoCulturalText) {
    return (
      <div className="flex justify-start w-full">
        <div className="inline-flex max-w-full w-full rounded-4xl border border-transparent bg-transparent text-black px-4 py-2">
          <div className="w-full space-y-6">
            {/* Header with area badge */}
            <div className="flex items-center gap-3 pb-4 border-b border-[#00552b]/10">
              <div className="flex-shrink-0">
                <div className="size-12 rounded-full bg-gradient-to-br from-[#00552b] to-[#00aa56] flex items-center justify-center shadow-lg">
                  <svg className="size-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xs font-semibold text-[#00552b]/60 uppercase tracking-wider mb-1">
                  Análisis Geocultural
                </h3>
                {geoCulturalText.areaName && (
                  <h2 className="text-xl font-bold text-[#111111]">
                    {geoCulturalText.areaName}
                  </h2>
                )}
              </div>
            </div>

            {/* Geocultural analysis content with enhanced styling */}
            <div className="geocultural-analysis">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                  h1: (props) => (
                    <h1 {...props} className="text-2xl font-bold text-[#111111] mt-8 mb-4 pb-3 border-b-2 border-[#00552b]/20" />
                  ),
                  h2: (props) => (
                    <h2 {...props} className="text-xl font-bold text-[#00552b] mt-6 mb-3 flex items-center gap-2" />
                  ),
                  h3: (props) => (
                    <h3 {...props} className="text-lg font-semibold text-[#111111] mt-5 mb-2.5" />
                  ),
                  p: (props) => (
                    <p {...props} className="text-[15px] leading-relaxed text-gray-800 mb-4" />
                  ),
                  ul: (props) => (
                    <ul {...props} className="space-y-2 mb-4 ml-6" />
                  ),
                  ol: (props) => (
                    <ol {...props} className="space-y-2 mb-4 ml-6" />
                  ),
                  li: (props) => (
                    <li {...props} className="text-[15px] text-gray-700 leading-relaxed pl-2">
                      <span className="inline-flex items-start gap-2">
                        <span className="text-[#00552b] mt-1.5 shrink-0">•</span>
                        <span className="flex-1">{props.children}</span>
                      </span>
                    </li>
                  ),
                  strong: (props) => (
                    <strong {...props} className="font-semibold text-[#00552b]" />
                  ),
                  em: (props) => (
                    <em {...props} className="italic text-gray-700" />
                  ),
                  blockquote: (props) => (
                    <blockquote {...props} className="border-l-4 border-[#00552b] bg-[#00552b]/5 pl-4 py-3 my-4 italic text-gray-700" />
                  ),
                  hr: (props) => (
                    <hr {...props} className="my-6 border-t-2 border-[#00552b]/10" />
                  ),
                  pre: ({ children }) => {
                    const codeElement = children as React.ReactElement;
                    const codeProps = codeElement?.props as { className?: string; children?: React.ReactNode };
                    const className = codeProps?.className || '';
                    const language = className.replace('language-', '') || 'text';
                    const value = String(codeProps?.children || '');

                    return <CodeBlock language={language} value={value} />;
                  },
                  code({ inline, className, children, ...props }: MarkdownCodeProps) {
                    if (inline) {
                      return (
                        <code
                          {...props}
                          className="rounded-md bg-[#00552b]/10 px-2 py-0.5 text-[0.92em] text-[#00552b] font-medium"
                        >
                          {children}
                        </code>
                      );
                    }
                    return <code {...props} className={className}>{children}</code>;
                  },
                  a: (props) => (
                    <a
                      {...props}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-[#00552b] underline underline-offset-2 hover:text-[#00aa56] transition-colors"
                    />
                  ),
                }}
              >
                {geoCulturalText.reply}
              </ReactMarkdown>
            </div>

            {/* Footer decoration */}
            <div className="pt-6 border-t border-[#00552b]/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-[#00552b]/40">
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">Análisis territorial completo</span>
                </div>
                {!isStreaming && geoCulturalText.reply && (
                  <SpeechButton text={geoCulturalText.reply} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Legacy geocultural format (with map and places)
  if (geoCulturalData) {
    return (
      <div className="flex justify-start w-full">
        <div className="inline-flex max-w-full w-full rounded-4xl border border-transparent bg-transparent text-black px-4 py-2">
          <GeoCulturalResponse data={geoCulturalData} />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className="flex flex-col gap-1">
        <div
          className={`inline-flex max-w-full rounded-4xl border px-4 py-2 text-[15px] leading-relaxed ${
            isUser
              ? 'border-transparent bg-[#00552b] text-white font-medium'
              : 'border-transparent bg-transparent text-black'
          }`}
        >
          <div className="flex w-full flex-col gap-2">
            {isUser && attachments && attachments.length > 0 && (
              <AttachmentsPreview attachments={attachments} />
            )}
            <div className="markdown prose prose-sm max-w-none text-current prose-headings:text-[#111111] prose-strong:text-[#111111]">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                  pre: ({ children }) => {
                    const codeElement = children as React.ReactElement;
                    const codeProps = codeElement?.props as { className?: string; children?: React.ReactNode };
                    const className = codeProps?.className || '';
                    const language = className.replace('language-', '') || 'text';
                    const value = String(codeProps?.children || '');

                    return <CodeBlock language={language} value={value} />;
                  },
                  code({ inline, className, children, ...props }: MarkdownCodeProps) {
                    if (inline) {
                      return (
                        <code
                          {...props}
                          className="rounded-md bg-black/5 px-1.5 py-0.5 text-[0.92em] text-[#111111]"
                        >
                          {children}
                        </code>
                      );
                    }
                    // For non-inline code, let the pre component handle it
                    return <code {...props} className={className}>{children}</code>;
                  },
                  a: (props) => (
                    <a
                      {...props}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-[#111111] underline underline-offset-4"
                    />
                  ),
                  ul: (props) => <ul {...props} className="list-disc pl-6" />,
                  ol: (props) => <ol {...props} className="list-decimal pl-6" />,
                  img: (props) => <ChatImage {...props} />,
                }}
              >
                {message.content || ' '}
              </ReactMarkdown>
            </div>
          </div>
        </div>
        {/* Speech button for assistant messages (not for generated images or videos) */}
        {!isUser && !isStreaming && message.content && !message.content.includes('![Imagen generada]') && !message.content.includes('<video') && (
          <div className="flex justify-start pl-2">
            <SpeechButton text={message.content} />
          </div>
        )}
      </div>
    </div>
  );
}