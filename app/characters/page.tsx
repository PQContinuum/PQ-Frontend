'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  Filter,
  Users,
  Globe,
  Sparkles,
  TrendingUp,
  Loader2,
  Grid3x3,
  LayoutGrid,
  Video,
  Image as ImageIcon,
  Play,
  Eye,
  Heart,
  Clock,
  Download,
  Share2,
  MoreHorizontal,
  Lock,
  Check,
  MessageSquare,
} from 'lucide-react';
import {
  useCharacters,
  usePublicCharacters,
  useFeaturedCharacters,
  useTrendingCharacters,
} from '@/hooks/use-characters';
import {
  useMyMedia,
  useMyVideos,
  useMyImages,
  usePublicGallery,
  useFeaturedMedia,
  useLikeVideo,
  useLikeImage,
  type GalleryItem,
} from '@/hooks/use-gallery';
import { CharacterCard } from '@/app/chat/components/lisa/CharacterCard';
import { CharacterForm } from '@/app/chat/components/lisa/CharacterForm';
import { ShareCharacterModal } from '@/app/chat/components/lisa/ShareCharacterModal';
import { VISUAL_STYLE_OPTIONS, CHARACTER_TYPE_OPTIONS } from '@/lib/lisa/constants';
import type { Character, CharacterType, VisualStyle, PublicCharactersParams } from '@/lib/lisa/types';

type MainTabType = 'my-content' | 'public-gallery';
type ContentType = 'all' | 'videos' | 'images' | 'characters';
type SortType = 'recent' | 'popular' | 'likes';

// Media Card Component
function MediaCard({
  item,
  onSelect,
  isOwner = false,
}: {
  item: GalleryItem;
  onSelect: (item: GalleryItem) => void;
  isOwner?: boolean;
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

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = item.mediaType === 'video' ? item.videoUrl : item.imageUrl;
    if (url) {
      const a = document.createElement('a');
      a.href = url;
      a.download = item.title || `${item.mediaType}-${item.id}`;
      a.click();
    }
  };

  const thumbnailUrl = item.mediaType === 'video' ? item.thumbnailUrl : item.imageUrl;

  return (
    <div
      onClick={() => onSelect(item)}
      className="group relative bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-100">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            {item.mediaType === 'video' ? (
              <Video className="w-12 h-12 text-gray-300" />
            ) : (
              <ImageIcon className="w-12 h-12 text-gray-300" />
            )}
          </div>
        )}

        {/* Play button for videos */}
        {item.mediaType === 'video' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 bg-black/50 rounded-full flex items-center justify-center group-hover:bg-black/70 transition">
              <Play className="w-7 h-7 text-white fill-white ml-1" />
            </div>
          </div>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />

        {/* Duration badge for videos */}
        {item.mediaType === 'video' && item.duration && (
          <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 text-white text-xs rounded">
            {item.duration}
          </div>
        )}

        {/* Type badge */}
        <div className="absolute top-2 left-2">
          <span className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
            item.mediaType === 'video'
              ? 'bg-purple-100 text-purple-700'
              : 'bg-blue-100 text-blue-700'
          }`}>
            {item.mediaType === 'video' ? (
              <Video className="w-3 h-3" />
            ) : (
              <ImageIcon className="w-3 h-3" />
            )}
            {item.mediaType === 'video' ? 'Video' : 'Imagen'}
          </span>
        </div>

        {/* Featured badge */}
        {item.isFeatured && (
          <div className="absolute top-2 right-2">
            <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
              Destacado
            </span>
          </div>
        )}

        {/* Menu button */}
        {isOwner && (
          <div className="absolute top-2 right-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1.5 bg-white/80 rounded-full hover:bg-white transition"
            >
              <MoreHorizontal className="w-4 h-4 text-gray-600" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                <button
                  onClick={handleDownload}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Download className="w-4 h-4" />
                  Descargar
                </button>
                <button
                  onClick={handleShare}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Share2 className="w-4 h-4" />
                  Compartir
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Title */}
        <h3 className="font-medium text-gray-900 line-clamp-1 mb-1">
          {item.title || 'Sin titulo'}
        </h3>

        {/* Prompt preview */}
        {item.prompt && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-2">
            {item.prompt}
          </p>
        )}

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {item.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-1.5 py-0.5 text-xs text-gray-500 bg-gray-100 rounded"
              >
                {tag}
              </span>
            ))}
            {item.tags.length > 3 && (
              <span className="px-1.5 py-0.5 text-xs text-gray-400">
                +{item.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1 text-sm transition ${
              isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            {likeCount > 0 && <span>{likeCount}</span>}
          </button>
          <span className="flex items-center gap-1 text-sm text-gray-500">
            <Eye className="w-4 h-4" />
            {item.viewCount || 0}
          </span>
          <button
            onClick={handleShare}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition ml-auto"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Created at */}
        <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
          <Clock className="w-3 h-3" />
          {new Date(item.createdAt).toLocaleDateString('es-ES')}
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

export default function MultimediaPage() {
  const router = useRouter();
  const [mainTab, setMainTab] = useState<MainTabType>('my-content');
  const [contentType, setContentType] = useState<ContentType>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
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
  const { data: featuredCharacters } = useFeaturedCharacters(4);
  const { data: trendingCharacters } = useTrendingCharacters(4);

  // Media queries
  const { data: myMedia, isLoading: isLoadingMyMedia } = useMyMedia({ sortBy });
  const { data: myVideos, isLoading: isLoadingMyVideos } = useMyVideos({ sortBy });
  const { data: myImages, isLoading: isLoadingMyImages } = useMyImages({ sortBy });
  const { data: publicMedia, isLoading: isLoadingPublicMedia } = usePublicGallery({ sortBy });
  const { data: featuredMedia } = useFeaturedMedia(4);

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

  const handleCreateSuccess = (character: Character) => {
    setShowCreateForm(false);
  };

  const handleSelectCharacter = (character: Character) => {
    router.push(`/characters/${character.id}`);
  };

  const handleEditCharacter = (character: Character) => {
    router.push(`/characters/${character.id}?edit=true`);
  };

  const handleShareCharacter = (character: Character) => {
    setSelectedCharacter(character);
    setShowShareModal(true);
  };

  const handleSelectMedia = (item: GalleryItem) => {
    // For now, could open a modal or navigate to detail page
    const url = item.mediaType === 'video' ? item.videoUrl : item.imageUrl;
    if (url) {
      window.open(url, '_blank');
    }
  };

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Multimedia</h1>
              <p className="text-gray-600 mt-1">
                Videos, imagenes y personajes generados
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/chat')}
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition"
              >
                <MessageSquare className="w-5 h-5" />
                <span className="hidden sm:inline">Ir al Chat</span>
              </button>
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#00552b] text-white rounded-lg hover:bg-[#00552b]/90 transition"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Crear personaje</span>
              </button>
            </div>
          </div>

          {/* Main Tabs */}
          <div className="flex gap-4 border-b border-gray-200 -mb-px">
            <button
              onClick={() => setMainTab('my-content')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition ${
                mainTab === 'my-content'
                  ? 'border-[#00552b] text-[#00552b]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Lock className="w-4 h-4" />
              Mi Contenido
              <span className="px-2 py-0.5 text-xs bg-gray-100 rounded-full">
                {myTotalCount}
              </span>
            </button>
            <button
              onClick={() => setMainTab('public-gallery')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition ${
                mainTab === 'public-gallery'
                  ? 'border-[#00552b] text-[#00552b]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Globe className="w-4 h-4" />
              Galeria Publica
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Content Type Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setContentType('all')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition ${
              contentType === 'all'
                ? 'bg-[#00552b] text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Todo
          </button>
          <button
            onClick={() => setContentType('videos')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition ${
              contentType === 'videos'
                ? 'bg-[#00552b] text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Video className="w-4 h-4" />
            Videos
            {mainTab === 'my-content' && myVideosCount > 0 && (
              <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                contentType === 'videos' ? 'bg-white/20' : 'bg-gray-100'
              }`}>
                {myVideosCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setContentType('images')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition ${
              contentType === 'images'
                ? 'bg-[#00552b] text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            Imagenes
            {mainTab === 'my-content' && myImagesCount > 0 && (
              <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                contentType === 'images' ? 'bg-white/20' : 'bg-gray-100'
              }`}>
                {myImagesCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setContentType('characters')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition ${
              contentType === 'characters'
                ? 'bg-[#00552b] text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Users className="w-4 h-4" />
            Personajes
            {mainTab === 'my-content' && myCharactersCount > 0 && (
              <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                contentType === 'characters' ? 'bg-white/20' : 'bg-gray-100'
              }`}>
                {myCharactersCount}
              </span>
            )}
          </button>
        </div>

        {/* Featured (only on public gallery) */}
        {mainTab === 'public-gallery' && contentType !== 'characters' && featuredMedia && featuredMedia.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              <h2 className="font-semibold text-gray-900">Contenido Destacado</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {featuredMedia.slice(0, 4).map((item) => {
                const thumbnailSrc = item.mediaType === 'video' ? item.thumbnailUrl : item.imageUrl;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectMedia(item)}
                    className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden cursor-pointer group"
                  >
                    {thumbnailSrc ? (
                      <img
                        src={thumbnailSrc}
                        alt={item.title || 'Media'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {item.mediaType === 'video' ? (
                          <Video className="w-8 h-8 text-gray-400" />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                    )}
                    {item.mediaType === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Play className="w-8 h-8 text-white drop-shadow-lg" />
                      </div>
                    )}
                    <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                      <p className="text-xs text-white font-medium truncate">{item.title || 'Sin titulo'}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Featured Characters (only on public gallery with characters) */}
        {mainTab === 'public-gallery' && contentType === 'characters' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {featuredCharacters && featuredCharacters.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                  <h2 className="font-semibold text-gray-900">Destacados</h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {featuredCharacters.slice(0, 4).map((char) => (
                    <div
                      key={char.id}
                      onClick={() => handleSelectCharacter(char)}
                      className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition"
                    >
                      {char.referenceImageUrl ? (
                        <img
                          src={char.referenceImageUrl}
                          alt={char.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                          <Users className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {char.galleryTitle || char.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {trendingCharacters && trendingCharacters.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <h2 className="font-semibold text-gray-900">Tendencia</h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {trendingCharacters.slice(0, 4).map((char) => (
                    <div
                      key={char.id}
                      onClick={() => handleSelectCharacter(char)}
                      className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition"
                    >
                      {char.referenceImageUrl ? (
                        <img
                          src={char.referenceImageUrl}
                          alt={char.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                          <Users className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {char.galleryTitle || char.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={contentType === 'characters' ? 'Buscar personajes...' : 'Buscar contenido...'}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:border-[#00552b] focus:outline-none"
            />
          </div>

          {contentType === 'characters' && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg transition ${
                showFilters ? 'border-[#00552b] bg-[#00552b]/5' : 'border-gray-300'
              }`}
            >
              <Filter className="w-5 h-5" />
              Filtros
            </button>
          )}

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortType)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:border-[#00552b] focus:outline-none bg-white"
          >
            <option value="recent">Mas recientes</option>
            <option value="popular">Mas populares</option>
            <option value="likes">Mas gustados</option>
          </select>

          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setGridSize('normal')}
              className={`p-2.5 transition ${
                gridSize === 'normal' ? 'bg-gray-100' : 'hover:bg-gray-50'
              }`}
            >
              <LayoutGrid className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => setGridSize('compact')}
              className={`p-2.5 transition ${
                gridSize === 'compact' ? 'bg-gray-100' : 'hover:bg-gray-50'
              }`}
            >
              <Grid3x3 className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Filters panel (for characters) */}
        {showFilters && contentType === 'characters' && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as CharacterType | 'all')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#00552b] focus:outline-none"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estilo
                </label>
                <select
                  value={selectedStyle}
                  onChange={(e) => setSelectedStyle(e.target.value as VisualStyle | 'all')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#00552b] focus:outline-none"
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
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#00552b] animate-spin" />
          </div>
        ) : (
          <>
            {/* Mixed content (all) */}
            {contentType === 'all' && (
              <>
                {/* Media items */}
                {(() => {
                  const mediaItems = mainTab === 'my-content'
                    ? filterMedia(getMyMediaItems())
                    : filterMedia(getPublicMediaItems());
                  const characters = mainTab === 'my-content'
                    ? filteredMyCharacters
                    : filteredPublicCharacters;

                  if (mediaItems.length === 0 && characters.length === 0) {
                    return (
                      <div className="text-center py-20">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Video className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          {mainTab === 'my-content' ? 'No tienes contenido' : 'No hay contenido'}
                        </h3>
                        <p className="text-gray-500">
                          {mainTab === 'my-content'
                            ? 'Genera videos e imagenes desde el chat'
                            : 'No se encontro contenido publico'}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div
                      className={`grid gap-4 ${
                        gridSize === 'compact'
                          ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
                          : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                      }`}
                    >
                      {mediaItems.map((item) => (
                        <MediaCard
                          key={item.id}
                          item={item}
                          onSelect={handleSelectMedia}
                          isOwner={mainTab === 'my-content'}
                        />
                      ))}
                      {characters.map((character) => (
                        <CharacterCard
                          key={character.id}
                          character={character}
                          onSelect={handleSelectCharacter}
                          onEdit={handleEditCharacter}
                          onShare={handleShareCharacter}
                          showStats={mainTab === 'public-gallery'}
                          isOwner={mainTab === 'my-content'}
                        />
                      ))}
                    </div>
                  );
                })()}
              </>
            )}

            {/* Videos only */}
            {contentType === 'videos' && (
              <>
                {(() => {
                  const items = mainTab === 'my-content'
                    ? filterMedia(myVideos?.items || [])
                    : filterMedia(publicMedia?.items.filter(i => i.mediaType === 'video') || []);

                  if (items.length === 0) {
                    return (
                      <div className="text-center py-20">
                        <Video className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          {mainTab === 'my-content' ? 'No tienes videos' : 'No hay videos'}
                        </h3>
                        <p className="text-gray-500">
                          {mainTab === 'my-content'
                            ? 'Genera videos desde el chat para verlos aqui'
                            : 'No se encontraron videos publicos'}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div
                      className={`grid gap-4 ${
                        gridSize === 'compact'
                          ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
                          : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                      }`}
                    >
                      {items.map((item) => (
                        <MediaCard
                          key={item.id}
                          item={item}
                          onSelect={handleSelectMedia}
                          isOwner={mainTab === 'my-content'}
                        />
                      ))}
                    </div>
                  );
                })()}
              </>
            )}

            {/* Images only */}
            {contentType === 'images' && (
              <>
                {(() => {
                  const items = mainTab === 'my-content'
                    ? filterMedia(myImages?.items || [])
                    : filterMedia(publicMedia?.items.filter(i => i.mediaType === 'image') || []);

                  if (items.length === 0) {
                    return (
                      <div className="text-center py-20">
                        <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          {mainTab === 'my-content' ? 'No tienes imagenes' : 'No hay imagenes'}
                        </h3>
                        <p className="text-gray-500">
                          {mainTab === 'my-content'
                            ? 'Genera imagenes desde el chat para verlas aqui'
                            : 'No se encontraron imagenes publicas'}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div
                      className={`grid gap-4 ${
                        gridSize === 'compact'
                          ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
                          : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                      }`}
                    >
                      {items.map((item) => (
                        <MediaCard
                          key={item.id}
                          item={item}
                          onSelect={handleSelectMedia}
                          isOwner={mainTab === 'my-content'}
                        />
                      ))}
                    </div>
                  );
                })()}
              </>
            )}

            {/* Characters only */}
            {contentType === 'characters' && (
              <>
                {(() => {
                  const characters = mainTab === 'my-content'
                    ? filteredMyCharacters
                    : filteredPublicCharacters;

                  if (characters.length === 0) {
                    return (
                      <div className="text-center py-20">
                        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          {mainTab === 'my-content' ? 'No tienes personajes' : 'No hay personajes'}
                        </h3>
                        <p className="text-gray-500 mb-6">
                          {mainTab === 'my-content'
                            ? 'Crea tu primer personaje para empezar'
                            : 'No se encontraron personajes publicos'}
                        </p>
                        {mainTab === 'my-content' && (
                          <button
                            onClick={() => setShowCreateForm(true)}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#00552b] text-white rounded-lg hover:bg-[#00552b]/90 transition"
                          >
                            <Plus className="w-5 h-5" />
                            Crear personaje
                          </button>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div
                      className={`grid gap-4 ${
                        gridSize === 'compact'
                          ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
                          : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                      }`}
                    >
                      {characters.map((character) => (
                        <CharacterCard
                          key={character.id}
                          character={character}
                          onSelect={handleSelectCharacter}
                          onEdit={handleEditCharacter}
                          onShare={handleShareCharacter}
                          showStats={mainTab === 'public-gallery'}
                          isOwner={mainTab === 'my-content'}
                        />
                      ))}
                    </div>
                  );
                })()}
              </>
            )}
          </>
        )}
      </div>

      {/* Create character modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative w-full max-w-lg mx-4 bg-white rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 rounded-t-2xl">
              <h2 className="text-lg font-semibold text-gray-900">Crear personaje</h2>
            </div>
            <div className="p-4">
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
    </div>
  );
}
