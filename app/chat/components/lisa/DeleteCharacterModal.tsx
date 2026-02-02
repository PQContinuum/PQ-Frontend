'use client';

import { useState } from 'react';
import { X, Trash2, Loader2, AlertTriangle, Users } from 'lucide-react';
import { useDeleteCharacter } from '@/hooks/use-characters';
import type { Character } from '@/lib/lisa/types';

interface DeleteCharacterModalProps {
  character: Character;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function DeleteCharacterModal({
  character,
  isOpen,
  onClose,
  onSuccess,
}: DeleteCharacterModalProps) {
  const [confirmName, setConfirmName] = useState('');
  const deleteMutation = useDeleteCharacter();

  const canDelete = confirmName.toLowerCase() === character.name.toLowerCase();

  const handleDelete = async () => {
    if (!canDelete) return;

    try {
      await deleteMutation.mutateAsync(character.id);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error deleting character:', error);
    }
  };

  const handleClose = () => {
    setConfirmName('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header con gradiente de advertencia */}
        <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 text-white">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-full">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Eliminar personaje</h2>
              <p className="text-white/80 text-sm">Esta accion no se puede deshacer</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Character preview */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            {character.referenceImageUrl ? (
              <img
                src={character.referenceImageUrl}
                alt={character.name}
                className="w-16 h-16 rounded-xl object-cover opacity-60 grayscale"
              />
            ) : (
              <div className="w-16 h-16 bg-gray-200 rounded-xl flex items-center justify-center">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">{character.name}</p>
              <p className="text-sm text-gray-500">
                {character.isPublic ? 'Publico' : 'Privado'} · {character.visualStyle || 'Sin estilo'}
              </p>
              {character.isPublic && (character.viewCount || 0) > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  {character.viewCount} vistas · {character.likeCount || 0} likes
                </p>
              )}
            </div>
          </div>

          {/* Warning message */}
          <div className="text-sm text-gray-600 space-y-2">
            <p>Al eliminar este personaje:</p>
            <ul className="list-disc list-inside text-gray-500 space-y-1 ml-2">
              <li>Se eliminara permanentemente de tu cuenta</li>
              <li>No podras recuperarlo despues</li>
              {character.isPublic && <li>Desaparecera de la galeria publica</li>}
            </ul>
          </div>

          {/* Confirmation input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Escribe <span className="font-bold text-red-600">"{character.name}"</span> para confirmar
            </label>
            <input
              type="text"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder="Nombre del personaje"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:outline-none transition-colors"
              autoComplete="off"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={deleteMutation.isPending}
              className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition font-medium disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={!canDelete || deleteMutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-white bg-red-500 rounded-xl hover:bg-red-600 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="w-5 h-5" />
                  Eliminar
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
