'use client';

import { useState } from 'react';
import { Plus, X, User } from 'lucide-react';
import { useLisaWizardStore } from '@/hooks/use-lisa-wizard';
import { useCharacters } from '@/hooks/use-characters';
import { CharacterGallery } from '../CharacterGallery';
import { CharacterForm } from '../CharacterForm';
import type { Character } from '@/lib/lisa/types';

export function CharacterStep() {
  const [showForm, setShowForm] = useState(false);
  const selectedCharacter = useLisaWizardStore((s) => s.selectedCharacter);
  const setSelectedCharacter = useLisaWizardStore((s) => s.setSelectedCharacter);

  const { data: characters = [], isLoading } = useCharacters();

  const handleSelect = (character: Character) => {
    setSelectedCharacter(character);
  };

  const handleDeselect = () => {
    setSelectedCharacter(null);
  };

  const handleCreateSuccess = (character: Character) => {
    setSelectedCharacter(character);
    setShowForm(false);
  };

  if (showForm) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Crear personaje
          </h2>
          <button
            onClick={() => setShowForm(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <CharacterForm
          onSuccess={handleCreateSuccess}
          onCancel={() => setShowForm(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900">
          Personaje (opcional)
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Selecciona o crea un personaje para tu escena
        </p>
      </div>

      {/* Selected character preview */}
      {selectedCharacter && (
        <div className="relative bg-[#FF8B3D]/5 border-2 border-[#FF8B3D] rounded-xl p-4">
          <button
            onClick={handleDeselect}
            className="absolute top-2 right-2 p-1 hover:bg-gray-200 rounded-full transition"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
          <div className="flex items-center gap-4">
            {selectedCharacter.referenceImageUrl ? (
              <img
                src={selectedCharacter.referenceImageUrl}
                alt={selectedCharacter.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="w-8 h-8 text-gray-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-[#FF8B3D]">
                {selectedCharacter.name}
              </h3>
              {selectedCharacter.description && (
                <p className="text-sm text-gray-600 truncate">
                  {selectedCharacter.description}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                Personaje seleccionado
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Create new character button */}
      <button
        onClick={() => setShowForm(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-[#FF8B3D] hover:text-[#FF8B3D] hover:bg-[#FF8B3D]/5 transition"
      >
        <Plus className="w-5 h-5" />
        <span>Crear nuevo personaje</span>
      </button>

      {/* Character gallery */}
      {characters.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Tus personajes ({characters.length})
          </h3>
          <CharacterGallery
            characters={characters}
            selectedId={selectedCharacter?.id}
            onSelect={handleSelect}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* Skip hint */}
      {!selectedCharacter && characters.length === 0 && !isLoading && (
        <p className="text-center text-sm text-gray-500">
          Puedes continuar sin un personaje si tu escena no lo requiere
        </p>
      )}
    </div>
  );
}
