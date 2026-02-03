'use client';

import { useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Heart,
  Eye,
  Share2,
  Copy,
  Edit,
  Sparkles,
  Globe,
  Lock,
  User,
  Palette,
  Clock,
  Check,
  Loader2,
  Users,
  Trash2,
} from 'lucide-react';
import {
  useCharacter,
  usePublicCharacter,
  useCloneCharacter,
  useLikeCharacter,
  useUnlikeCharacter,
  useShareCharacter,
} from '@/hooks/use-characters';
import { ShareCharacterModal } from '@/app/chat/components/lisa/ShareCharacterModal';
import { DeleteCharacterModal } from '@/app/chat/components/lisa/DeleteCharacterModal';
import { VISUAL_STYLE_OPTIONS, CHARACTER_TYPE_OPTIONS, CHARACTER_LOCK_OPTIONS } from '@/lib/lisa/constants';
import type { CharacterLocks } from '@/lib/lisa/types';

export default function CharacterDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  // Validate params
  const characterId = params?.id;
  if (!characterId || typeof characterId !== 'string') {
    notFound();
  }

  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [localLikeState, setLocalLikeState] = useState<{
    characterId: string;
    isLiked: boolean;
    likeCount: number;
  } | null>(null);

  // Try to fetch as owner first, then as public
  const {
    data: ownedCharacter,
    isLoading: isLoadingOwned,
    error: ownedError,
  } = useCharacter(characterId);

  const { data: publicCharacter, isLoading: isLoadingPublic } = usePublicCharacter(
    ownedError ? characterId : null
  );

  const character = ownedCharacter || publicCharacter;
  const isOwner = !!ownedCharacter;
  const isLoading = isLoadingOwned || (ownedError && isLoadingPublic);

  const cloneMutation = useCloneCharacter();
  const likeMutation = useLikeCharacter();
  const unlikeMutation = useUnlikeCharacter();
  const shareMutation = useShareCharacter();

  // Derive like state from character data or local optimistic state
  // Only use local state if it matches the current character
  const localStateForCurrentCharacter = localLikeState?.characterId === character?.id ? localLikeState : null;
  const isLiked = localStateForCurrentCharacter?.isLiked ?? character?.hasLiked ?? false;
  const likeCount = localStateForCurrentCharacter?.likeCount ?? character?.likeCount ?? 0;

  // Memoized options lookup
  const styleOption = useMemo(
    () => VISUAL_STYLE_OPTIONS.find((s) => s.value === character?.visualStyle),
    [character?.visualStyle]
  );
  const typeOption = useMemo(
    () => CHARACTER_TYPE_OPTIONS.find((t) => t.value === character?.characterType),
    [character?.characterType]
  );

  // Get active locks with proper typing
  const activeLocks = useMemo(() => {
    const locks = character?.locks as CharacterLocks | null | undefined;
    if (!locks) return [];
    return (Object.entries(locks) as [keyof CharacterLocks, boolean | undefined][])
      .filter(([, value]) => value === true);
  }, [character?.locks]);

  // Handlers with useCallback for stable references
  const handleLike = useCallback(async () => {
    if (!character) return;

    // Optimistic update
    const newIsLiked = !isLiked;
    const newLikeCount = newIsLiked ? likeCount + 1 : Math.max(0, likeCount - 1);

    setLocalLikeState({ characterId: character.id, isLiked: newIsLiked, likeCount: newLikeCount });

    try {
      if (newIsLiked) {
        await likeMutation.mutateAsync(character.id);
      } else {
        await unlikeMutation.mutateAsync(character.id);
      }
    } catch {
      // Rollback on error
      setLocalLikeState(null);
    }
  }, [character, isLiked, likeCount, likeMutation, unlikeMutation]);

  const handleShare = useCallback(async () => {
    if (!character) return;
    await shareMutation.mutateAsync(character.id);
    const url = `${window.location.origin}/characters/${character.id}`;
    if (navigator.share) {
      navigator.share({ title: character.name, url });
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [character, shareMutation]);

  const handleClone = useCallback(async () => {
    if (!character) return;
    const result = await cloneMutation.mutateAsync(character.id);
    router.push(`/characters/${result.character.id}?edit=true`);
  }, [character, cloneMutation, router]);

  const handleUseInLisa = useCallback(() => {
    if (!character) return;
    router.push(`/chat?character=${character.id}`);
  }, [character, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#00552b] animate-spin" />
      </div>
    );
  }

  if (!character) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Personaje no encontrado</h2>
          <p className="text-gray-500 mb-6">El personaje que buscas no existe o no tienes acceso</p>
          <button
            onClick={() => router.push('/characters')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#00552b] text-white rounded-lg hover:bg-[#00552b]/90 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver a personajes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.push('/characters')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver a personajes
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-white rounded-2xl border border-gray-200 overflow-hidden">
              {character.referenceImageUrl ? (
                <Image
                  src={character.referenceImageUrl}
                  alt={character.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                  <Users className="w-32 h-32 text-gray-300" />
                </div>
              )}

              {/* Badges */}
              <div className="absolute top-4 left-4 flex gap-2">
                {character.isPublic ? (
                  <span className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-green-100 text-green-700 rounded-full">
                    <Globe className="w-4 h-4" />
                    Publico
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-gray-100 text-gray-600 rounded-full">
                    <Lock className="w-4 h-4" />
                    Privado
                  </span>
                )}
                {character.isFeatured && (
                  <span className="px-3 py-1.5 text-sm font-medium bg-yellow-100 text-yellow-700 rounded-full">
                    Destacado
                  </span>
                )}
              </div>
            </div>

            {/* Stats (for public characters) */}
            {character.isPublic && (
              <div className="flex items-center justify-center gap-6 p-4 bg-white rounded-xl border border-gray-200">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-2xl font-bold text-gray-900">
                    <Eye className="w-6 h-6 text-gray-400" />
                    {character.viewCount || 0}
                  </div>
                  <p className="text-sm text-gray-500">Vistas</p>
                </div>
                <div className="w-px h-10 bg-gray-200" />
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-2xl font-bold text-gray-900">
                    <Heart className={`w-6 h-6 ${isLiked ? 'text-red-500 fill-current' : 'text-gray-400'}`} />
                    {likeCount}
                  </div>
                  <p className="text-sm text-gray-500">Likes</p>
                </div>
                <div className="w-px h-10 bg-gray-200" />
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-2xl font-bold text-gray-900">
                    <Share2 className="w-6 h-6 text-gray-400" />
                    {character.shareCount || 0}
                  </div>
                  <p className="text-sm text-gray-500">Compartido</p>
                </div>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            {/* Title and type */}
            <div>
              <div className="flex items-start justify-between gap-4 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  {character.galleryTitle || character.name}
                </h1>
                {character.version && character.version > 1 && (
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                    v{character.version}
                  </span>
                )}
              </div>
              {typeOption && (
                <p className="text-lg text-gray-600">{typeOption.label}</p>
              )}
            </div>

            {/* Description */}
            {(character.galleryDescription || character.description) && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Descripcion</h3>
                <p className="text-gray-600">
                  {character.galleryDescription || character.description}
                </p>
              </div>
            )}

            {/* Style */}
            {styleOption && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                  <Palette className="w-4 h-4" />
                  Estilo visual
                </h3>
                <span
                  className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-full ${styleOption.bgColor} ${styleOption.color}`}
                >
                  {styleOption.label}
                </span>
              </div>
            )}

            {/* Tags */}
            {character.tags && character.tags.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Etiquetas</h3>
                <div className="flex flex-wrap gap-2">
                  {character.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Locks */}
            {activeLocks.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                  <Lock className="w-4 h-4" />
                  Rasgos fijos
                </h3>
                <div className="flex flex-wrap gap-2">
                  {activeLocks.map(([key]) => {
                    const lockOption = CHARACTER_LOCK_OPTIONS.find((l) => l.key === key);
                    return lockOption ? (
                      <span
                        key={key}
                        className="px-3 py-1 text-sm text-[#00552b] bg-[#00552b]/10 rounded-full"
                      >
                        {lockOption.label}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {/* Physical traits */}
            {character.physicalTraits && Object.keys(character.physicalTraits).length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  Rasgos fisicos
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {character.physicalTraits.gender && (
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <span className="text-gray-500">Genero:</span>{' '}
                      <span className="text-gray-900">{character.physicalTraits.gender}</span>
                    </div>
                  )}
                  {character.physicalTraits.age && (
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <span className="text-gray-500">Edad:</span>{' '}
                      <span className="text-gray-900">{character.physicalTraits.age}</span>
                    </div>
                  )}
                  {character.physicalTraits.hairColor && (
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <span className="text-gray-500">Cabello:</span>{' '}
                      <span className="text-gray-900">{character.physicalTraits.hairColor}</span>
                    </div>
                  )}
                  {character.physicalTraits.eyeColor && (
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <span className="text-gray-500">Ojos:</span>{' '}
                      <span className="text-gray-900">{character.physicalTraits.eyeColor}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="text-sm text-gray-500 flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              Creado el {new Date(character.createdAt).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={handleUseInLisa}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#00552b] text-white rounded-lg hover:bg-[#00552b]/90 transition"
              >
                <Sparkles className="w-5 h-5" />
                Usar en LISA
              </button>

              {isOwner ? (
                <>
                  <button
                    onClick={() => router.push(`/characters/${character.id}?edit=true`)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    <Edit className="w-5 h-5" />
                    Editar
                  </button>
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    <Share2 className="w-5 h-5" />
                    Compartir
                  </button>
                </>
              ) : (
                <>
                  {character.isPublic && (
                    <button
                      onClick={handleLike}
                      className={`flex items-center justify-center gap-2 px-4 py-2.5 border rounded-lg transition ${
                        isLiked
                          ? 'border-red-300 bg-red-50 text-red-600'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                      {isLiked ? 'Te gusta' : 'Me gusta'}
                    </button>
                  )}
                  {character.allowCloning && (
                    <button
                      onClick={handleClone}
                      disabled={cloneMutation.isPending}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                    >
                      {cloneMutation.isPending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                      Clonar
                    </button>
                  )}
                  <button
                    onClick={handleShare}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    {copied ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <Share2 className="w-5 h-5" />
                    )}
                    {copied ? 'Copiado' : 'Compartir'}
                  </button>
                </>
              )}
            </div>

            {/* Settings / Danger Zone - Only for owner */}
            {isOwner && (
              <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-xl">
                <h3 className="text-sm font-semibold text-red-800 mb-2">
                  Zona de configuracion
                </h3>
                <p className="text-sm text-red-600 mb-4">
                  Las acciones en esta seccion son irreversibles. Procede con cuidado.
                </p>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-100 transition"
                >
                  <Trash2 className="w-5 h-5" />
                  Eliminar personaje
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Share modal */}
      {isOwner && (
        <ShareCharacterModal
          character={character}
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* Delete modal */}
      {isOwner && (
        <DeleteCharacterModal
          character={character}
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onSuccess={() => router.push('/characters')}
        />
      )}
    </div>
  );
}
