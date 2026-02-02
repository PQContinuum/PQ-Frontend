'use client';

import { useState } from 'react';
import {
  X,
  Globe,
  Lock,
  Copy,
  Check,
  Loader2,
  Users,
} from 'lucide-react';
import { useUpdateCharacterVisibility } from '@/hooks/use-characters';
import type { Character, UpdateCharacterVisibilityInput } from '@/lib/lisa/types';

interface ShareCharacterModalProps {
  character: Character;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (character: Character) => void;
}

export function ShareCharacterModal({
  character,
  isOpen,
  onClose,
  onSuccess,
}: ShareCharacterModalProps) {
  const [isPublic, setIsPublic] = useState(character.isPublic || false);
  const [galleryTitle, setGalleryTitle] = useState(character.galleryTitle || character.name);
  const [galleryDescription, setGalleryDescription] = useState(
    character.galleryDescription || character.description || ''
  );
  const [tags, setTags] = useState<string[]>(character.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [allowCloning, setAllowCloning] = useState(character.allowCloning || false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  const updateVisibility = useUpdateCharacterVisibility();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data: UpdateCharacterVisibilityInput & { id: string } = {
      id: character.id,
      isPublic,
      galleryTitle: galleryTitle.trim() || undefined,
      galleryDescription: galleryDescription.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
      allowCloning,
    };

    try {
      const result = await updateVisibility.mutateAsync(data);
      if (isPublic) {
        setShowSuccess(true);
      } else {
        onSuccess?.(result.character);
        onClose();
      }
    } catch (error) {
      console.error('Error updating visibility:', error);
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/characters/${character.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    if (showSuccess && onSuccess) {
      onSuccess(character);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {showSuccess ? 'Compartido' : 'Compartir personaje'}
          </h2>
          <button
            onClick={handleClose}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {showSuccess ? (
          /* Success state */
          <div className="p-6 text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Personaje publicado
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Tu personaje ahora es visible en la galería pública
            </p>

            {/* Copy link */}
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg mb-4">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/characters/${character.id}`}
                className="flex-1 text-sm text-gray-600 bg-transparent border-none focus:outline-none"
              />
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-[#00552b] rounded-lg hover:bg-[#00552b]/90 transition"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>

            <button
              onClick={handleClose}
              className="w-full px-4 py-2.5 text-white bg-[#00552b] rounded-lg hover:bg-[#00552b]/90 transition"
            >
              Cerrar
            </button>
          </div>
        ) : (
          /* Form state */
          <form onSubmit={handleSubmit} className="p-4 space-y-5">
            {/* Character preview */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              {character.referenceImageUrl ? (
                <img
                  src={character.referenceImageUrl}
                  alt={character.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{character.name}</p>
                <p className="text-sm text-gray-500 capitalize">
                  {character.visualStyle || 'Sin estilo'}
                </p>
              </div>
            </div>

            {/* Visibility toggle */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                {isPublic ? (
                  <Globe className="w-5 h-5 text-green-600" />
                ) : (
                  <Lock className="w-5 h-5 text-gray-500" />
                )}
                <span className="font-medium text-gray-900">
                  {isPublic ? 'Público' : 'Privado'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsPublic(!isPublic)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  isPublic ? 'bg-[#00552b]' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    isPublic ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {isPublic && (
              <>
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Titulo en galeria
                  </label>
                  <input
                    type="text"
                    value={galleryTitle}
                    onChange={(e) => setGalleryTitle(e.target.value)}
                    placeholder="Nombre para mostrar en galeria"
                    maxLength={100}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#00552b] focus:outline-none"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripcion (opcional)
                  </label>
                  <textarea
                    value={galleryDescription}
                    onChange={(e) => setGalleryDescription(e.target.value)}
                    placeholder="Describe tu personaje para otros usuarios..."
                    rows={3}
                    maxLength={500}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#00552b] focus:outline-none resize-none"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Etiquetas (max. 5)
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {tags.map((tag, index) => (
                      <span
                        key={index}
                        className="flex items-center gap-1 px-2 py-1 text-sm bg-gray-100 text-gray-700 rounded-full"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => setTags(tags.filter((_, i) => i !== index))}
                          className="p-0.5 hover:bg-gray-200 rounded-full"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  {tags.length < 5 && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && tagInput.trim()) {
                            e.preventDefault();
                            if (!tags.includes(tagInput.trim())) {
                              setTags([...tags, tagInput.trim()]);
                            }
                            setTagInput('');
                          }
                        }}
                        placeholder="Anadir etiqueta..."
                        maxLength={30}
                        className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:border-[#00552b] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (tagInput.trim() && !tags.includes(tagInput.trim())) {
                            setTags([...tags, tagInput.trim()]);
                            setTagInput('');
                          }
                        }}
                        disabled={!tagInput.trim()}
                        className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                      >
                        Anadir
                      </button>
                    </div>
                  )}
                </div>

                {/* Allow cloning */}
                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowCloning}
                    onChange={(e) => setAllowCloning(e.target.checked)}
                    className="w-4 h-4 text-[#00552b] border-gray-300 rounded focus:ring-[#00552b]"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Permitir clonacion</p>
                    <p className="text-xs text-gray-500">
                      Otros usuarios podran copiar este personaje
                    </p>
                  </div>
                </label>
              </>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={updateVisibility.isPending}
                className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={updateVisibility.isPending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-white bg-[#00552b] rounded-lg hover:bg-[#00552b]/90 transition disabled:opacity-50"
              >
                {updateVisibility.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Guardando...
                  </>
                ) : isPublic ? (
                  'Publicar'
                ) : (
                  'Guardar'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
