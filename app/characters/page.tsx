'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  Filter,
  Users,
  Globe,
  Loader2,
  Grid3x3,
  LayoutGrid,
  Video,
  Image as ImageIcon,
  Play,
  Eye,
  Heart,
  Download,
  Share2,
  MoreHorizontal,
  Lock,
  Check,
  MessageSquare,
  Trash2,
  X,
} from 'lucide-react';
import {
  useCharacters,
  usePublicCharacters,
} from '@/hooks/use-characters';
import {
  useMyMedia,
  useMyVideos,
  useMyImages,
  usePublicGallery,
  useLikeVideo,
  useLikeImage,
  useDeleteVideo,
  useDeleteImage,
  type GalleryItem,
} from '@/hooks/use-gallery';
import { CharacterCard } from '@/app/chat/components/lisa/CharacterCard';
import { CharacterForm } from '@/app/chat/components/lisa/CharacterForm';
import { ShareCharacterModal } from '@/app/chat/components/lisa/ShareCharacterModal';
import { DeleteCharacterModal } from '@/app/chat/components/lisa/DeleteCharacterModal';
import { VISUAL_STYLE_OPTIONS, CHARACTER_TYPE_OPTIONS } from '@/lib/lisa/constants';
import type { Character, CharacterType, VisualStyle, PublicCharactersParams } from '@/lib/lisa/types';
import { downloadVideoMp4 } from '@/lib/media-download';

type MainTabType = 'my-content' | 'public-gallery';
type ContentType = 'all' | 'videos' | 'images' | 'characters';
type SortType = 'recent' | 'popular' | 'likes';

// ============================================================================
// Media Card Component
// ============================================================================

function MediaCard({
  item,
  onSelect,
  isOwner = false,
  onDelete,
}: {
  item: GalleryItem;
  onSelect: (item: GalleryItem) => void;
  isOwner?: boolean;
  onDelete?: (item: GalleryItem) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [isLiked, setIsLiked] = useState(item.hasLiked || false);
  const [likeCount, setLikeCount] = useState(item.likeCount || 0);
  const [copied, setCopied] = useState(false);

  const likeVideoMutation = useLikeVideo();
  const likeImageMutation = useLikeImage();

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setLikeCount(newLiked ? likeCount + 1 : Math.max(0, likeCount - 1));

    if (item.mediaType === 'video') {
      await likeVideoMutation.mutateAsync(item.id);
    } else {
      await likeImageMutation.mutateAsync(item.id);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/gallery/${item.mediaType}/${item.id}`;
    if (navigator.share) {
      navigator.share({ title: item.title, url });
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = item.mediaType === 'video' ? item.videoUrl : item.imageUrl;
    if (!url) return;

    if (item.mediaType === 'video') {
      try {
        await downloadVideoMp4(url, item.title || `video-${item.id}.mp4`);
      } catch (error) {
        console.error('Error downloading video:', error);
      }
      return;
    }

    const a = document.createElement('a');
    a.href = url;
    a.download = item.title || `${item.mediaType}-${item.id}`;
    a.click();
  };

  const thumbnailUrl = item.mediaType === 'video' ? item.thumbnailUrl : item.imageUrl;
  const previewUrl = item.mediaType === 'video' ? item.previewUrl : null;
  const videoUrl = item.mediaType === 'video' ? item.videoUrl : null;
  const hasThumbnail = Boolean(thumbnailUrl);
  const hasPreview = Boolean(previewUrl);
  // Use video element with preload="metadata" when no thumbnail and no preview
  const useVideoPreview = item.mediaType === 'video' && !hasThumbnail && !hasPreview && Boolean(videoUrl);

  return (
    <div
      onClick={() => onSelect(item)}
      className="group relative bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:border-gray-200 transition-all duration-300 cursor-pointer hover:-translate-y-0.5"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-50">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={item.title || ''}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : useVideoPreview ? (
          <video
            src={videoUrl!}
            preload="metadata"
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            {item.mediaType === 'video' ? (
              <Video className="w-10 h-10 text-gray-300" />
            ) : (
              <ImageIcon className="w-10 h-10 text-gray-300" />
            )}
          </div>
        )}

        {item.mediaType === 'video' && previewUrl && (
          <img
            src={previewUrl}
            alt=""
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
              hasThumbnail ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
            }`}
            loading="lazy"
          />
        )}

        {/* Play button for videos */}
        {item.mediaType === 'video' && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm">
              <Play className="w-5 h-5 text-gray-900 ml-0.5" fill="currentColor" />
            </div>
          </div>
        )}

        {/* Subtle overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />

        {/* Duration badge for videos */}
        {item.mediaType === 'video' && item.duration && (
          <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 text-white text-xs rounded-md backdrop-blur-sm font-medium">
            {item.duration}
          </div>
        )}

        {/* Type badge */}
        <div className="absolute top-2 left-2">
          <span className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg backdrop-blur-sm ${
            item.mediaType === 'video'
              ? 'bg-purple-500/80 text-white'
              : 'bg-blue-500/80 text-white'
          }`}>
            {item.mediaType === 'video' ? (
              <Video className="w-3 h-3" />
            ) : (
              <ImageIcon className="w-3 h-3" />
            )}
            {item.mediaType === 'video' ? 'Video' : 'Imagen'}
          </span>
        </div>

        {/* Menu button */}
        {isOwner && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1.5 bg-white/90 rounded-lg hover:bg-white transition backdrop-blur-sm shadow-sm"
            >
              <MoreHorizontal className="w-4 h-4 text-gray-600" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-10">
                <button
                  onClick={handleDownload}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Download className="w-4 h-4" />
                  Descargar
                </button>
                <button
                  onClick={handleShare}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Share2 className="w-4 h-4" />
                  Compartir
                </button>
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      onDelete(item);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="font-semibold text-gray-900 line-clamp-1 text-sm">
          {item.title || item.prompt?.slice(0, 50) || 'Media'}
        </h3>

        {item.prompt && (
          <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">
            {item.prompt}
          </p>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-50">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1 text-xs transition ${
              isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
            {likeCount > 0 && <span>{likeCount}</span>}
          </button>
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Eye className="w-3.5 h-3.5" />
            {item.viewCount || 0}
          </span>
          <button
            onClick={handleShare}
            className="flex items-center text-xs text-gray-400 hover:text-gray-600 transition ml-auto"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-green-500" />
            ) : (
              <Share2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Click outside to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(false);
          }}
        />
      )}
    </div>
  );
}

// ============================================================================
// Delete Media Confirmation Modal
// ============================================================================

function DeleteMediaModal({
  item,
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
}: {
  item: GalleryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}) {
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-sm mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-red-500 to-red-600 p-5 text-white">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Eliminar {item.mediaType === 'video' ? 'video' : 'imagen'}</h2>
              <p className="text-white/80 text-sm">Esta accion no se puede deshacer</p>
            </div>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-600">
            Se eliminara permanentemente <strong>&quot;{item.title || 'este contenido'}&quot;</strong> de tu cuenta.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition font-medium disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-white bg-red-500 rounded-xl hover:bg-red-600 transition font-medium disabled:opacity-50"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Page
// ============================================================================

export default function MultimediaPage() {
  const router = useRouter();
  const [mainTab, setMainTab] = useState<MainTabType>('my-content');
  const [contentType, setContentType] = useState<ContentType>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeleteCharacterModal, setShowDeleteCharacterModal] = useState(false);
  const [characterToDelete, setCharacterToDelete] = useState<Character | null>(null);
  const [mediaToDelete, setMediaToDelete] = useState<GalleryItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [gridSize, setGridSize] = useState<'normal' | 'compact'>('normal');

  // Filters
  const [selectedType, setSelectedType] = useState<CharacterType | 'all'>('all');
  const [selectedStyle, setSelectedStyle] = useState<VisualStyle | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortType>('recent');

  // Build params for public characters
  const publicParams: PublicCharactersParams = {
    page: 1,
    limit: 50,
    sortBy,
    ...(selectedType !== 'all' && { characterType: selectedType }),
    ...(selectedStyle !== 'all' && { visualStyle: selectedStyle }),
  };

  // Character queries
  const { data: myCharacters, isLoading: isLoadingMyCharacters } = useCharacters();
  const { data: publicData, isLoading: isLoadingPublic } = usePublicCharacters(publicParams);

  // Media queries
  const { data: myMedia, isLoading: isLoadingMyMedia } = useMyMedia({ sortBy });
  const { data: myVideos, isLoading: isLoadingMyVideos } = useMyVideos({ sortBy });
  const { data: myImages, isLoading: isLoadingMyImages } = useMyImages({ sortBy });
  const { data: publicMedia, isLoading: isLoadingPublicMedia } = usePublicGallery({ sortBy });

  // Delete mutations
  const deleteVideoMutation = useDeleteVideo();
  const deleteImageMutation = useDeleteImage();

  // Get the right data based on tabs
  const getMyMediaItems = (): GalleryItem[] => {
    if (contentType === 'videos') return myVideos?.items || [];
    if (contentType === 'images') return myImages?.items || [];
    if (contentType === 'all') return myMedia?.items || [];
    return [];
  };

  const getPublicMediaItems = (): GalleryItem[] => {
    if (contentType === 'all' || contentType === 'videos' || contentType === 'images') {
      return publicMedia?.items || [];
    }
    return [];
  };

  // Filter characters
  const filteredMyCharacters = useMemo(() => {
    if (!myCharacters) return [];
    return myCharacters.filter((char) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = char.name.toLowerCase().includes(query);
        const matchesDesc = char.description?.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc) return false;
      }
      if (selectedType !== 'all' && char.characterType !== selectedType) return false;
      if (selectedStyle !== 'all' && char.visualStyle !== selectedStyle) return false;
      return true;
    });
  }, [myCharacters, searchQuery, selectedType, selectedStyle]);

  const filteredPublicCharacters = useMemo(() => {
    const characters = publicData?.characters;
    if (!characters) return [];
    if (!searchQuery) return characters;
    const query = searchQuery.toLowerCase();
    return characters.filter((char) => {
      const matchesName = char.name.toLowerCase().includes(query);
      const matchesDesc = char.description?.toLowerCase().includes(query);
      const matchesTitle = char.galleryTitle?.toLowerCase().includes(query);
      return matchesName || matchesDesc || matchesTitle;
    });
  }, [publicData, searchQuery]);

  // Filter media by search
  const filterMedia = (items: GalleryItem[]): GalleryItem[] => {
    if (!searchQuery) return items;
    const query = searchQuery.toLowerCase();
    return items.filter((item) => {
      const matchesTitle = item.title?.toLowerCase().includes(query);
      const matchesPrompt = item.prompt?.toLowerCase().includes(query);
      const matchesTags = item.tags?.some(tag => tag.toLowerCase().includes(query));
      return matchesTitle || matchesPrompt || matchesTags;
    });
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
  };

  const handleSelectCharacter = useCallback((character: Character) => {
    router.push(`/characters/${character.id}`);
  }, [router]);

  const handleEditCharacter = useCallback((character: Character) => {
    router.push(`/characters/${character.id}?edit=true`);
  }, [router]);

  const handleShareCharacter = useCallback((character: Character) => {
    setSelectedCharacter(character);
    setShowShareModal(true);
  }, []);

  const handleDeleteCharacter = useCallback((character: Character) => {
    setCharacterToDelete(character);
    setShowDeleteCharacterModal(true);
  }, []);

  const handleDeleteMedia = useCallback((item: GalleryItem) => {
    setMediaToDelete(item);
  }, []);

  const confirmDeleteMedia = useCallback(async () => {
    if (!mediaToDelete) return;
    try {
      if (mediaToDelete.mediaType === 'video') {
        await deleteVideoMutation.mutateAsync(mediaToDelete.id);
      } else {
        await deleteImageMutation.mutateAsync(mediaToDelete.id);
      }
      setMediaToDelete(null);
    } catch (error) {
      console.error('Error deleting media:', error);
    }
  }, [mediaToDelete, deleteVideoMutation, deleteImageMutation]);

  const handleSelectMedia = useCallback((item: GalleryItem) => {
    const url = item.mediaType === 'video' ? item.videoUrl : item.imageUrl;
    if (url) {
      window.open(url, '_blank');
    }
  }, []);

  // Determine loading state
  const isLoading = mainTab === 'my-content'
    ? (contentType === 'characters' ? isLoadingMyCharacters :
       contentType === 'videos' ? isLoadingMyVideos :
       contentType === 'images' ? isLoadingMyImages :
       isLoadingMyMedia || isLoadingMyCharacters)
    : (contentType === 'characters' ? isLoadingPublic : isLoadingPublicMedia);

  // Counts for tabs
  const myVideosCount = myVideos?.total || 0;
  const myImagesCount = myImages?.total || 0;
  const myCharactersCount = myCharacters?.length || 0;
  const myTotalCount = myVideosCount + myImagesCount + myCharactersCount;

  // Grid class helper
  const gridClass = gridSize === 'compact'
    ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3'
    : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4';

  // Render content grid
  const renderContentGrid = (mediaItems: GalleryItem[], characters: Character[]) => {
    if (mediaItems.length === 0 && characters.length === 0) {
      return (
        <div className="text-center py-24">
          <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            {contentType === 'characters' ? (
              <Users className="w-9 h-9 text-gray-300" />
            ) : contentType === 'videos' ? (
              <Video className="w-9 h-9 text-gray-300" />
            ) : contentType === 'images' ? (
              <ImageIcon className="w-9 h-9 text-gray-300" />
            ) : (
              <Video className="w-9 h-9 text-gray-300" />
            )}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {mainTab === 'my-content' ? 'No tienes contenido' : 'No hay contenido'}
          </h3>
          <p className="text-gray-400 text-sm max-w-xs mx-auto">
            {mainTab === 'my-content'
              ? 'Genera videos, imagenes o crea personajes desde el chat'
              : 'No se encontro contenido publico'}
          </p>
          {mainTab === 'my-content' && contentType === 'characters' && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-[#00552b] text-white rounded-xl hover:bg-[#00552b]/90 transition font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              Crear personaje
            </button>
          )}
        </div>
      );
    }

    return (
      <div className={`grid ${gridClass}`}>
        {mediaItems.map((item) => (
          <MediaCard
            key={item.id}
            item={item}
            onSelect={handleSelectMedia}
            isOwner={mainTab === 'my-content'}
            onDelete={mainTab === 'my-content' ? handleDeleteMedia : undefined}
          />
        ))}
        {characters.map((character) => (
          <CharacterCard
            key={character.id}
            character={character}
            onSelect={handleSelectCharacter}
            onEdit={handleEditCharacter}
            onShare={handleShareCharacter}
            onDelete={mainTab === 'my-content' ? handleDeleteCharacter : undefined}
            showStats={mainTab === 'public-gallery'}
            isOwner={mainTab === 'my-content'}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Multimedia</h1>
              <p className="text-gray-500 text-sm mt-0.5">
                Videos, imagenes y personajes generados
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push('/chat')}
                className="flex items-center gap-2 px-3.5 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition text-sm font-medium"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="hidden sm:inline">Chat</span>
              </button>
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-2 px-3.5 py-2 bg-[#00552b] text-white rounded-xl hover:bg-[#00552b]/90 transition text-sm font-medium shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Crear</span>
              </button>
            </div>
          </div>

          {/* Main Tabs */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
            <button
              onClick={() => setMainTab('my-content')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition ${
                mainTab === 'my-content'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Lock className="w-4 h-4" />
              Mi Contenido
              {myTotalCount > 0 && (
                <span className={`px-1.5 py-0.5 text-xs rounded-md ${
                  mainTab === 'my-content' ? 'bg-[#00552b]/10 text-[#00552b]' : 'bg-gray-200 text-gray-500'
                }`}>
                  {myTotalCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setMainTab('public-gallery')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition ${
                mainTab === 'public-gallery'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Globe className="w-4 h-4" />
              Galeria Publica
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {/* Content Type Tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {[
            { key: 'all' as ContentType, label: 'Todo', icon: null, count: null },
            { key: 'videos' as ContentType, label: 'Videos', icon: Video, count: mainTab === 'my-content' ? myVideosCount : null },
            { key: 'images' as ContentType, label: 'Imagenes', icon: ImageIcon, count: mainTab === 'my-content' ? myImagesCount : null },
            { key: 'characters' as ContentType, label: 'Personajes', icon: Users, count: mainTab === 'my-content' ? myCharactersCount : null },
          ].map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              onClick={() => setContentType(key)}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-xl whitespace-nowrap transition ${
                contentType === key
                  ? 'bg-[#00552b] text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              {label}
              {count !== null && count > 0 && (
                <span className={`px-1.5 py-0.5 text-xs rounded-md ${
                  contentType === key ? 'bg-white/20' : 'bg-gray-100'
                }`}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={contentType === 'characters' ? 'Buscar personajes...' : 'Buscar contenido...'}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#00552b] focus:ring-1 focus:ring-[#00552b]/20 focus:outline-none text-sm transition"
            />
          </div>

          {contentType === 'characters' && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3.5 py-2.5 border rounded-xl transition text-sm ${
                showFilters ? 'border-[#00552b] bg-[#00552b]/5 text-[#00552b]' : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filtros
            </button>
          )}

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortType)}
            className="px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-[#00552b] focus:outline-none text-sm text-gray-600"
          >
            <option value="recent">Recientes</option>
            <option value="popular">Populares</option>
            <option value="likes">Mas gustados</option>
          </select>

          <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setGridSize('normal')}
              className={`p-2.5 transition ${
                gridSize === 'normal' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setGridSize('compact')}
              className={`p-2.5 transition ${
                gridSize === 'compact' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters panel (for characters) */}
        {showFilters && contentType === 'characters' && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
                  Tipo
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as CharacterType | 'all')}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:border-[#00552b] focus:outline-none text-sm"
                >
                  <option value="all">Todos los tipos</option>
                  {CHARACTER_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
                  Estilo
                </label>
                <select
                  value={selectedStyle}
                  onChange={(e) => setSelectedStyle(e.target.value as VisualStyle | 'all')}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:border-[#00552b] focus:outline-none text-sm"
                >
                  <option value="all">Todos los estilos</option>
                  {VISUAL_STYLE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Content Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-[#00552b] animate-spin mb-3" />
            <p className="text-sm text-gray-400">Cargando contenido...</p>
          </div>
        ) : (
          <>
            {contentType === 'all' && (() => {
              const mediaItems = mainTab === 'my-content'
                ? filterMedia(getMyMediaItems())
                : filterMedia(getPublicMediaItems());
              const characters = mainTab === 'my-content'
                ? filteredMyCharacters
                : filteredPublicCharacters;
              return renderContentGrid(mediaItems, characters);
            })()}

            {contentType === 'videos' && (() => {
              const items = mainTab === 'my-content'
                ? filterMedia(myVideos?.items || [])
                : filterMedia(publicMedia?.items.filter(i => i.mediaType === 'video') || []);
              return renderContentGrid(items, []);
            })()}

            {contentType === 'images' && (() => {
              const items = mainTab === 'my-content'
                ? filterMedia(myImages?.items || [])
                : filterMedia(publicMedia?.items.filter(i => i.mediaType === 'image') || []);
              return renderContentGrid(items, []);
            })()}

            {contentType === 'characters' && (() => {
              const characters = mainTab === 'my-content'
                ? filteredMyCharacters
                : filteredPublicCharacters;
              return renderContentGrid([], characters);
            })()}
          </>
        )}
      </div>

      {/* Create character modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 rounded-t-2xl flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Crear personaje</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <CharacterForm
                onSuccess={handleCreateSuccess}
                onCancel={() => setShowCreateForm(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Share modal */}
      {selectedCharacter && (
        <ShareCharacterModal
          character={selectedCharacter}
          isOpen={showShareModal}
          onClose={() => {
            setShowShareModal(false);
            setSelectedCharacter(null);
          }}
          onSuccess={() => {
            setShowShareModal(false);
            setSelectedCharacter(null);
          }}
        />
      )}

      {/* Delete character modal */}
      {characterToDelete && (
        <DeleteCharacterModal
          character={characterToDelete}
          isOpen={showDeleteCharacterModal}
          onClose={() => {
            setShowDeleteCharacterModal(false);
            setCharacterToDelete(null);
          }}
          onSuccess={() => {
            setShowDeleteCharacterModal(false);
            setCharacterToDelete(null);
          }}
        />
      )}

      {/* Delete media confirmation */}
      <DeleteMediaModal
        item={mediaToDelete}
        isOpen={!!mediaToDelete}
        onClose={() => setMediaToDelete(null)}
        onConfirm={confirmDeleteMedia}
        isDeleting={deleteVideoMutation.isPending || deleteImageMutation.isPending}
      />
    </div>
  );
}
