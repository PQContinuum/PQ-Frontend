'use client';

import { use, useState, useEffect } from 'react';
import { Heart, Eye, Download, Share2, ArrowLeft, Video, Image as ImageIcon, Calendar, User, Lock, Loader2 } from 'lucide-react';
import { useGalleryVideo, useGalleryImage, useLikeVideo, useLikeImage } from '@/hooks/use-gallery';
import { ApiError } from '@/lib/api-client';
import { HlsVideo } from '@/components/media/HlsVideo';
import { ShareDialog } from '@/components/media/ShareDialog';
import { DownloadDialog } from '@/components/media/DownloadDialog';
import Link from 'next/link';
import type { GalleryItem } from '@/hooks/use-gallery';

interface GalleryPageProps {
  params: Promise<{ mediaType: string; id: string }>;
}

export default function GalleryItemPage({ params }: GalleryPageProps) {
  const { mediaType, id } = use(params);

  if (mediaType !== 'video' && mediaType !== 'image') {
    return <NotFound />;
  }

  return mediaType === 'video' ? <VideoView id={id} /> : <ImageView id={id} />;
}

function VideoView({ id }: { id: string }) {
  const { data: item, isLoading, error } = useGalleryVideo(id);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [synced, setSynced] = useState(false);
  const likeMutation = useLikeVideo();

  useEffect(() => {
    if (item && !synced) {
      setLikeCount(item.likeCount || 0);
      setIsLiked(item.hasLiked || false);
      setSynced(true);
    }
  }, [item, synced]);

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorView error={error} />;
  if (!item) return <NotFound />;

  return (
    <MediaLayout
      item={item}
      isLiked={isLiked}
      likeCount={likeCount}
      onLike={() => {
        const newLiked = !isLiked;
        setIsLiked(newLiked);
        setLikeCount(newLiked ? likeCount + 1 : Math.max(0, likeCount - 1));
        likeMutation.mutate(id);
      }}
    >
      <div className="rounded-2xl overflow-hidden bg-black">
        <HlsVideo
          src={item.videoUrl}
          controls
          autoPlay
          className="w-full max-h-[70vh]"
          poster={item.thumbnailUrl || undefined}
          playsInline
        />
      </div>
    </MediaLayout>
  );
}

function ImageView({ id }: { id: string }) {
  const { data: item, isLoading, error } = useGalleryImage(id);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [synced, setSynced] = useState(false);
  const likeMutation = useLikeImage();

  useEffect(() => {
    if (item && !synced) {
      setLikeCount(item.likeCount || 0);
      setIsLiked(item.hasLiked || false);
      setSynced(true);
    }
  }, [item, synced]);

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorView error={error} />;
  if (!item) return <NotFound />;

  return (
    <MediaLayout
      item={item}
      isLiked={isLiked}
      likeCount={likeCount}
      onLike={() => {
        const newLiked = !isLiked;
        setIsLiked(newLiked);
        setLikeCount(newLiked ? likeCount + 1 : Math.max(0, likeCount - 1));
        likeMutation.mutate(id);
      }}
    >
      <div className="rounded-2xl overflow-hidden bg-gray-50">
        <img
          src={item.imageUrl}
          alt={item.title || 'Imagen generada'}
          className="w-full max-h-[70vh] object-contain"
        />
      </div>
    </MediaLayout>
  );
}

// ============================================================================
// Shared Layout
// ============================================================================

function MediaLayout({
  item,
  isLiked,
  likeCount,
  onLike,
  children,
}: {
  item: GalleryItem;
  isLiked: boolean;
  likeCount: number;
  onLike: () => void;
  children: React.ReactNode;
}) {
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const isVideo = item.mediaType === 'video';
  const formattedDate = new Date(item.createdAt).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTitle = item.title || (isVideo ? 'Video' : 'Imagen') + ' - Continuum AI';
  const downloadUrl = (isVideo ? item.videoUrl : item.imageUrl) || '';

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Back link */}
        <Link
          href="/characters"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a la galería
        </Link>

        {/* Main card */}
        <div className="rounded-[28px] border border-black/10 bg-white shadow-[0_28px_80px_rgba(0,0,0,0.08)] overflow-hidden">
          {/* Media */}
          <div className="bg-black/5">
            {children}
          </div>

          {/* Info */}
          <div className="p-6 sm:p-8">
            {/* Type badge + title */}
            <div className="flex items-start gap-3">
              <span className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg shrink-0 ${
                isVideo ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {isVideo ? <Video className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                {isVideo ? 'Video' : 'Imagen'}
              </span>
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">
                {item.title || 'Sin título'}
              </h1>
            </div>

            {/* Description */}
            {item.description && (
              <p className="mt-3 text-sm text-gray-600 leading-relaxed">{item.description}</p>
            )}

            {/* Prompt */}
            {item.prompt && (
              <div className="mt-4 p-3 bg-gray-50 rounded-xl">
                <p className="text-xs font-medium text-gray-400 mb-1">Prompt</p>
                <p className="text-sm text-gray-700">{item.prompt}</p>
              </div>
            )}

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4">
                {item.tags.map((tag) => (
                  <span key={tag} className="px-2.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-4 mt-5 pt-5 border-t border-gray-100 text-xs text-gray-400">
              {item.creator?.fullName && (
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  {item.creator.fullName}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formattedDate}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                {item.viewCount || 0} vistas
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2 mt-5">
              <button
                onClick={onLike}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition active:scale-95 ${
                  isLiked
                    ? 'bg-red-50 text-red-500 border border-red-200'
                    : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                {likeCount > 0 ? likeCount : 'Me gusta'}
              </button>

              <button
                onClick={() => setShowDownloadDialog(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 transition active:scale-95"
              >
                <Download className="w-4 h-4" />
                Descargar
              </button>

              <button
                onClick={() => setShowShareDialog(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 transition active:scale-95"
              >
                <Share2 className="w-4 h-4" />
                Compartir
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-400">
          Creado con <span className="font-semibold text-gray-500">Continuum AI</span>
        </div>
      </div>

      {/* Share Dialog */}
      {showShareDialog && (
        <ShareDialog
          url={shareUrl}
          title={shareTitle}
          onClose={() => setShowShareDialog(false)}
        />
      )}

      {/* Download Dialog */}
      {showDownloadDialog && (
        <DownloadDialog
          mediaType={item.mediaType}
          url={downloadUrl}
          title={item.title || `${item.mediaType}-${item.id}`}
          thumbnailUrl={item.thumbnailUrl || item.imageUrl}
          onClose={() => setShowDownloadDialog(false)}
        />
      )}
    </div>
  );
}

// ============================================================================
// Error States
// ============================================================================

function ErrorView({ error }: { error: unknown }) {
  const isPrivate = error instanceof ApiError && (error.statusCode === 403 || error.statusCode === 401);

  if (isPrivate) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-gray-400" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Contenido privado</h1>
          <p className="mt-2 text-sm text-gray-500">
            Este contenido es privado y solo puede ser visto por su creador.
          </p>
          <Link
            href="/characters"
            className="inline-flex items-center gap-1.5 mt-6 px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Ir a la galería
          </Link>
        </div>
      </div>
    );
  }

  return <NotFound />;
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="rounded-[28px] border border-black/10 bg-white shadow-lg overflow-hidden">
          <div className="aspect-video bg-gray-100 animate-pulse" />
          <div className="p-6 sm:p-8 space-y-4">
            <div className="h-7 bg-gray-100 rounded-lg w-2/3 animate-pulse" />
            <div className="h-4 bg-gray-100 rounded w-full animate-pulse" />
            <div className="h-4 bg-gray-100 rounded w-3/4 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-gray-900">Contenido no encontrado</h1>
        <p className="mt-2 text-sm text-gray-500">Este contenido no existe o ya no está disponible.</p>
        <Link
          href="/characters"
          className="inline-flex items-center gap-1.5 mt-6 px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Ir a la galería
        </Link>
      </div>
    </div>
  );
}
