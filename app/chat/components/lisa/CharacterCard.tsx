'use client';

import { useState } from 'react';
import {
  Eye,
  Heart,
  Share2,
  Copy,
  Edit,
  Sparkles,
  Globe,
  Lock,
  MoreHorizontal,
  Users,
} from 'lucide-react';
import { useCloneCharacter, useLikeCharacter, useUnlikeCharacter, useShareCharacter } from '@/hooks/use-characters';
import type { Character } from '@/lib/lisa/types';
import { VISUAL_STYLE_OPTIONS, CHARACTER_TYPE_OPTIONS } from '@/lib/lisa/constants';

interface CharacterCardProps {
  character: Character;
  variant?: 'gallery' | 'my-characters';
  onSelect?: (character: Character) => void;
  onEdit?: (character: Character) => void;
  onShare?: (character: Character) => void;
  onClone?: (character: Character) => void;
  showStats?: boolean;
  isOwner?: boolean;
}

export function CharacterCard({
  character,
  variant = 'gallery',
  onSelect,
  onEdit,
  onShare,
  onClone,
  showStats = true,
  isOwner = false,
}: CharacterCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isLiked, setIsLiked] = useState(character.hasLiked || false);
  const [likeCount, setLikeCount] = useState(character.likeCount || 0);

  const cloneMutation = useCloneCharacter();
  const likeMutation = useLikeCharacter();
  const unlikeMutation = useUnlikeCharacter();
  const shareMutation = useShareCharacter();

  const styleOption = VISUAL_STYLE_OPTIONS.find((s) => s.value === character.visualStyle);
  const typeOption = CHARACTER_TYPE_OPTIONS.find((t) => t.value === character.characterType);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLiked) {
      setIsLiked(false);
      setLikeCount(Math.max(0, likeCount - 1));
      await unlikeMutation.mutateAsync(character.id);
    } else {
      setIsLiked(true);
      setLikeCount(likeCount + 1);
      await likeMutation.mutateAsync(character.id);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await shareMutation.mutateAsync(character.id);
    if (onShare) {
      onShare(character);
    } else {
      // Default share behavior
      const url = `${window.location.origin}/characters/${character.id}`;
      if (navigator.share) {
        navigator.share({ title: character.name, url });
      } else {
        navigator.clipboard.writeText(url);
      }
    }
  };

  const handleClone = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    if (onClone) {
      onClone(character);
    } else {
      await cloneMutation.mutateAsync(character.id);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    onEdit?.(character);
  };

  const handleCardClick = () => {
    onSelect?.(character);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer"
    >
      {/* Image */}
      <div className="relative aspect-square bg-gray-100">
        {character.referenceImageUrl ? (
          <img
            src={character.referenceImageUrl}
            alt={character.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <Users className="w-16 h-16 text-gray-300" />
          </div>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200">
          <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect?.(character);
              }}
              className="p-2.5 bg-white/90 rounded-full hover:bg-white transition"
            >
              <Sparkles className="w-5 h-5 text-[#00552b]" />
            </button>
            {isOwner && (
              <button
                onClick={handleEdit}
                className="p-2.5 bg-white/90 rounded-full hover:bg-white transition"
              >
                <Edit className="w-5 h-5 text-gray-700" />
              </button>
            )}
          </div>
        </div>

        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1.5">
          {character.isPublic ? (
            <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
              <Globe className="w-3 h-3" />
              Publico
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
              <Lock className="w-3 h-3" />
              Privado
            </span>
          )}
          {character.isFeatured && (
            <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
              Destacado
            </span>
          )}
        </div>

        {/* Menu button */}
        {(isOwner || character.allowCloning) && (
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
                {isOwner && (
                  <>
                    <button
                      onClick={handleEdit}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Edit className="w-4 h-4" />
                      Editar
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                        onShare?.(character);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Share2 className="w-4 h-4" />
                      Compartir
                    </button>
                  </>
                )}
                {character.allowCloning && !isOwner && (
                  <button
                    onClick={handleClone}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Copy className="w-4 h-4" />
                    Clonar
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Name and type */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-medium text-gray-900 line-clamp-1">
            {character.galleryTitle || character.name}
          </h3>
          {typeOption && (
            <span className="text-xs text-gray-500 whitespace-nowrap">
              {typeOption.label}
            </span>
          )}
        </div>

        {/* Style badge */}
        {styleOption && (
          <div className="mb-2">
            <span
              className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${styleOption.bgColor} ${styleOption.color}`}
            >
              {styleOption.label}
            </span>
          </div>
        )}

        {/* Tags */}
        {character.tags && character.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {character.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-1.5 py-0.5 text-xs text-gray-500 bg-gray-100 rounded"
              >
                {tag}
              </span>
            ))}
            {character.tags.length > 3 && (
              <span className="px-1.5 py-0.5 text-xs text-gray-400">
                +{character.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Stats */}
        {showStats && character.isPublic && (
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
              {character.viewCount || 0}
            </span>
            <button
              onClick={handleShare}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        )}
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
