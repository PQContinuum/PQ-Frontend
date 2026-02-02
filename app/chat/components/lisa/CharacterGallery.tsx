'use client';

import {
  User,
  Loader2,
  Check,
  Camera,
  Clapperboard,
  Zap,
  Box,
  Smile,
  Droplets,
  Brush,
  Pencil,
  Grid3x3,
  Minus,
} from 'lucide-react';
import type { Character } from '@/lib/lisa/types';
import { VISUAL_STYLE_OPTIONS } from '@/lib/lisa/constants';

const styleIconMap = {
  Camera,
  Clapperboard,
  Zap,
  Box,
  Smile,
  Droplets,
  Brush,
  Pencil,
  Grid3x3,
  Minus,
};

interface CharacterGalleryProps {
  characters: Character[];
  selectedId?: string;
  onSelect: (character: Character) => void;
  isLoading?: boolean;
}

export function CharacterGallery({
  characters,
  selectedId,
  onSelect,
  isLoading,
}: CharacterGalleryProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (characters.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <User className="w-12 h-12 mx-auto mb-2 text-gray-300" />
        <p className="text-sm">No tienes personajes guardados</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {characters.map((character) => {
        const isSelected = selectedId === character.id;
        const styleOption = VISUAL_STYLE_OPTIONS.find(
          (o) => o.value === character.visualStyle
        );

        return (
          <button
            key={character.id}
            onClick={() => onSelect(character)}
            className={`relative flex flex-col items-center p-4 rounded-xl border-2 transition-all ${
              isSelected
                ? 'border-[#00552b] bg-[#00552b]/5 shadow-md'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            {/* Selection indicator */}
            {isSelected && (
              <div className="absolute top-2 right-2 w-4 h-4 bg-[#00552b] rounded-full flex items-center justify-center">
                <Check className="w-2.5 h-2.5 text-white" />
              </div>
            )}

            {/* Avatar */}
            {character.referenceImageUrl ? (
              <img
                src={character.referenceImageUrl}
                alt={character.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-white shadow"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                <User className="w-8 h-8 text-gray-400" />
              </div>
            )}

            {/* Name */}
            <h4
              className={`mt-2 text-sm font-medium truncate max-w-full ${
                isSelected ? 'text-[#00552b]' : 'text-gray-900'
              }`}
            >
              {character.name}
            </h4>

            {/* Style badge */}
            {styleOption && (() => {
              const IconComponent = styleIconMap[styleOption.icon as keyof typeof styleIconMap];
              return (
                <span
                  className={`mt-1 text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${styleOption.bgColor} ${styleOption.color}`}
                >
                  {IconComponent && <IconComponent className="w-3 h-3" />}
                  {styleOption.label}
                </span>
              );
            })()}

            {/* Description preview */}
            {character.description && (
              <p className="mt-1 text-xs text-gray-500 line-clamp-2 text-center">
                {character.description}
              </p>
            )}
          </button>
        );
      })}
    </div>
  );
}
