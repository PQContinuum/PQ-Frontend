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
} from 'lucide-react';
import {
  useCharacters,
  usePublicCharacters,
  useFeaturedCharacters,
  useTrendingCharacters,
} from '@/hooks/use-characters';
import { CharacterCard } from '@/app/chat/components/lisa/CharacterCard';
import { CharacterForm } from '@/app/chat/components/lisa/CharacterForm';
import { ShareCharacterModal } from '@/app/chat/components/lisa/ShareCharacterModal';
import { VISUAL_STYLE_OPTIONS, CHARACTER_TYPE_OPTIONS } from '@/lib/lisa/constants';
import type { Character, CharacterType, VisualStyle, PublicCharactersParams } from '@/lib/lisa/types';

type TabType = 'my-characters' | 'public-gallery';
type SortType = 'recent' | 'popular' | 'likes';

export default function CharactersPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('my-characters');
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

  // Queries
  const { data: myCharacters, isLoading: isLoadingMy } = useCharacters();
  const { data: publicData, isLoading: isLoadingPublic } = usePublicCharacters(publicParams);
  const { data: featuredCharacters } = useFeaturedCharacters(4);
  const { data: trendingCharacters } = useTrendingCharacters(4);

  // Filter local characters
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

  // Filter public characters by search
  const filteredPublicCharacters = useMemo(() => {
    if (!publicData?.characters) return [];
    if (!searchQuery) return publicData.characters;
    const query = searchQuery.toLowerCase();
    return publicData.characters.filter((char) => {
      const matchesName = char.name.toLowerCase().includes(query);
      const matchesDesc = char.description?.toLowerCase().includes(query);
      const matchesTitle = char.galleryTitle?.toLowerCase().includes(query);
      return matchesName || matchesDesc || matchesTitle;
    });
  }, [publicData?.characters, searchQuery]);

  const handleCreateSuccess = (character: Character) => {
    setShowCreateForm(false);
  };

  const handleSelect = (character: Character) => {
    router.push(`/characters/${character.id}`);
  };

  const handleEdit = (character: Character) => {
    router.push(`/characters/${character.id}?edit=true`);
  };

  const handleShare = (character: Character) => {
    setSelectedCharacter(character);
    setShowShareModal(true);
  };

  const isLoading = activeTab === 'my-characters' ? isLoadingMy : isLoadingPublic;
  const characters = activeTab === 'my-characters' ? filteredMyCharacters : filteredPublicCharacters;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Personajes</h1>
              <p className="text-gray-600 mt-1">
                Crea y gestiona personajes para tus generaciones
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#00552b] text-white rounded-lg hover:bg-[#00552b]/90 transition"
            >
              <Plus className="w-5 h-5" />
              Crear personaje
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 border-b border-gray-200 -mb-px">
            <button
              onClick={() => setActiveTab('my-characters')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition ${
                activeTab === 'my-characters'
                  ? 'border-[#00552b] text-[#00552b]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="w-4 h-4" />
              Mis Personajes
              {myCharacters && (
                <span className="px-2 py-0.5 text-xs bg-gray-100 rounded-full">
                  {myCharacters.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('public-gallery')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition ${
                activeTab === 'public-gallery'
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
        {/* Featured & Trending (only on public gallery) */}
        {activeTab === 'public-gallery' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Featured */}
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
                      onClick={() => handleSelect(char)}
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

            {/* Trending */}
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
                      onClick={() => handleSelect(char)}
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
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar personajes..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:border-[#00552b] focus:outline-none"
            />
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg transition ${
              showFilters ? 'border-[#00552b] bg-[#00552b]/5' : 'border-gray-300'
            }`}
          >
            <Filter className="w-5 h-5" />
            Filtros
          </button>

          {/* Grid size toggle */}
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

        {/* Filters panel */}
        {showFilters && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Type filter */}
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

              {/* Style filter */}
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

              {/* Sort by (only for public) */}
              {activeTab === 'public-gallery' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ordenar por
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortType)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#00552b] focus:outline-none"
                  >
                    <option value="recent">Mas recientes</option>
                    <option value="popular">Mas populares</option>
                    <option value="likes">Mas gustados</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Characters grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#00552b] animate-spin" />
          </div>
        ) : characters.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeTab === 'my-characters'
                ? 'No tienes personajes'
                : 'No se encontraron personajes'}
            </h3>
            <p className="text-gray-500 mb-6">
              {activeTab === 'my-characters'
                ? 'Crea tu primer personaje para empezar a generar contenido consistente'
                : 'Intenta con otros filtros o busqueda'}
            </p>
            {activeTab === 'my-characters' && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#00552b] text-white rounded-lg hover:bg-[#00552b]/90 transition"
              >
                <Plus className="w-5 h-5" />
                Crear personaje
              </button>
            )}
          </div>
        ) : (
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
                variant={activeTab === 'my-characters' ? 'my-characters' : 'gallery'}
                onSelect={handleSelect}
                onEdit={handleEdit}
                onShare={handleShare}
                showStats={activeTab === 'public-gallery'}
                isOwner={activeTab === 'my-characters'}
              />
            ))}
          </div>
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
