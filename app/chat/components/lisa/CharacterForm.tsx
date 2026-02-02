'use client';

import { useState } from 'react';
import {
  Loader2,
  Upload,
  X,
  FileText,
  User,
  Palette,
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
  Settings2,
  Dog,
  Sparkles,
  Cat,
  Package,
  Shapes,
  Lock,
} from 'lucide-react';
import { useCreateCharacter, useUploadCharacterReference } from '@/hooks/use-characters';
import {
  VISUAL_STYLE_OPTIONS,
  AGE_OPTIONS,
  GENDER_OPTIONS,
  HAIR_COLOR_OPTIONS,
  HAIR_STYLE_OPTIONS,
  EYE_COLOR_OPTIONS,
  BODY_TYPE_OPTIONS,
  MOOD_OPTIONS,
  CHARACTER_TYPE_OPTIONS,
  CHARACTER_LOCK_OPTIONS,
} from '@/lib/lisa/constants';
import type {
  Character,
  CreateCharacterInput,
  VisualStyle,
  PhysicalTraits,
  PersonalityTraits,
  CharacterType,
  CharacterLocks,
} from '@/lib/lisa/types';

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

const characterTypeIconMap = {
  User,
  Dog,
  Sparkles,
  Cat,
  Package,
  Shapes,
};

interface CharacterFormProps {
  onSuccess: (character: Character) => void;
  onCancel: () => void;
}

export function CharacterForm({ onSuccess, onCancel }: CharacterFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visualStyle, setVisualStyle] = useState<VisualStyle>('realista');
  const [physicalTraits, setPhysicalTraits] = useState<PhysicalTraits>({});
  const [personality, setPersonality] = useState<PersonalityTraits>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [activeSection, setActiveSection] = useState<'basic' | 'physical' | 'style' | 'advanced'>('basic');
  const [characterType, setCharacterType] = useState<CharacterType>('human');
  const [locks, setLocks] = useState<CharacterLocks>({});
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const createMutation = useCreateCharacter();
  const uploadMutation = useUploadCharacterReference();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;

    const input: CreateCharacterInput = {
      name: name.trim(),
      description: description.trim() || undefined,
      visualStyle,
      physicalTraits: Object.keys(physicalTraits).length > 0 ? physicalTraits : undefined,
      personality: Object.keys(personality).length > 0 ? personality : undefined,
      characterType,
      locks: Object.keys(locks).length > 0 ? locks : undefined,
      tags: tags.length > 0 ? tags : undefined,
    };

    try {
      const character = await createMutation.mutateAsync(input);

      // Upload reference image if provided
      if (imageFile && character.id) {
        await uploadMutation.mutateAsync({
          characterId: character.id,
          file: imageFile,
        });
      }

      onSuccess(character);
    } catch (error) {
      console.error('Error creating character:', error);
    }
  };

  const isLoading = createMutation.isPending || uploadMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Section tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2 overflow-x-auto">
        {[
          { id: 'basic', label: 'Básico', icon: FileText },
          { id: 'physical', label: 'Físico', icon: User },
          { id: 'style', label: 'Estilo', icon: Palette },
          { id: 'advanced', label: 'Avanzado', icon: Settings2 },
        ].map((section) => {
          const IconComponent = section.icon;
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveSection(section.id as typeof activeSection)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition ${
                activeSection === section.id
                  ? 'bg-[#00552b] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <IconComponent className="w-4 h-4" />
              {section.label}
            </button>
          );
        })}
      </div>

      {/* Basic section */}
      {activeSection === 'basic' && (
        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del personaje *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: María, El Detective, Robot X-5"
              maxLength={100}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#00552b] focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción breve
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe brevemente a tu personaje..."
              rows={3}
              maxLength={2000}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#00552b] focus:outline-none resize-none"
            />
          </div>

          {/* Reference image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Imagen de referencia (opcional)
            </label>
            {imagePreview ? (
              <div className="relative inline-block">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-24 h-24 rounded-lg object-cover border border-gray-200"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#00552b] hover:bg-[#00552b]/5 transition">
                <Upload className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-500">Subir imagen</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>
      )}

      {/* Physical section */}
      {activeSection === 'physical' && (
        <div className="space-y-4">
          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Género</label>
            <div className="flex flex-wrap gap-2">
              {GENDER_OPTIONS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setPhysicalTraits({ ...physicalTraits, gender: g })}
                  className={`px-3 py-1 text-sm rounded-full border transition ${
                    physicalTraits.gender === g
                      ? 'bg-[#00552b] text-white border-[#00552b]'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Age */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Edad</label>
            <select
              value={physicalTraits.age || ''}
              onChange={(e) => setPhysicalTraits({ ...physicalTraits, age: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#00552b] focus:outline-none"
            >
              <option value="">Seleccionar...</option>
              {AGE_OPTIONS.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          {/* Hair */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color de cabello</label>
              <select
                value={physicalTraits.hairColor || ''}
                onChange={(e) => setPhysicalTraits({ ...physicalTraits, hairColor: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#00552b] focus:outline-none text-sm"
              >
                <option value="">Seleccionar...</option>
                {HAIR_COLOR_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estilo de cabello</label>
              <select
                value={physicalTraits.hairStyle || ''}
                onChange={(e) => setPhysicalTraits({ ...physicalTraits, hairStyle: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#00552b] focus:outline-none text-sm"
              >
                <option value="">Seleccionar...</option>
                {HAIR_STYLE_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Eyes and body */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color de ojos</label>
              <select
                value={physicalTraits.eyeColor || ''}
                onChange={(e) => setPhysicalTraits({ ...physicalTraits, eyeColor: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#00552b] focus:outline-none text-sm"
              >
                <option value="">Seleccionar...</option>
                {EYE_COLOR_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de cuerpo</label>
              <select
                value={physicalTraits.bodyType || ''}
                onChange={(e) => setPhysicalTraits({ ...physicalTraits, bodyType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#00552b] focus:outline-none text-sm"
              >
                <option value="">Seleccionar...</option>
                {BODY_TYPE_OPTIONS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Mood */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado de ánimo</label>
            <div className="flex flex-wrap gap-2">
              {MOOD_OPTIONS.slice(0, 6).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPersonality({ ...personality, mood: m })}
                  className={`px-3 py-1 text-sm rounded-full border transition ${
                    personality.mood === m
                      ? 'bg-[#00552b] text-white border-[#00552b]'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Style section */}
      {activeSection === 'style' && (
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Estilo visual del personaje
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {VISUAL_STYLE_OPTIONS.map((option) => {
              const IconComponent = styleIconMap[option.icon as keyof typeof styleIconMap];
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setVisualStyle(option.value)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition ${
                    visualStyle === option.value
                      ? `border-[#00552b] ${option.bgColor}`
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {IconComponent && (
                    <IconComponent className={`w-6 h-6 ${visualStyle === option.value ? option.color : 'text-gray-500'}`} />
                  )}
                  <span className={`text-xs font-medium ${
                    visualStyle === option.value ? option.color : 'text-gray-700'
                  }`}>
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Advanced section */}
      {activeSection === 'advanced' && (
        <div className="space-y-5">
          {/* Character Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de personaje
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {CHARACTER_TYPE_OPTIONS.map((option) => {
                const IconComponent = characterTypeIconMap[option.icon as keyof typeof characterTypeIconMap];
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setCharacterType(option.value)}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border-2 transition ${
                      characterType === option.value
                        ? 'border-[#00552b] bg-[#00552b]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {IconComponent && (
                      <IconComponent
                        className={`w-5 h-5 ${
                          characterType === option.value ? 'text-[#00552b]' : 'text-gray-500'
                        }`}
                      />
                    )}
                    <span
                      className={`text-xs font-medium ${
                        characterType === option.value ? 'text-[#00552b]' : 'text-gray-700'
                      }`}
                    >
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Locks */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-2">
              <Lock className="w-4 h-4" />
              Rasgos fijos (Locks)
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Los rasgos fijos se mantendrán consistentes en todas las generaciones
            </p>
            <div className="grid grid-cols-2 gap-2">
              {CHARACTER_LOCK_OPTIONS.map((option) => (
                <label
                  key={option.key}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition ${
                    locks[option.key as keyof CharacterLocks]
                      ? 'border-[#00552b] bg-[#00552b]/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={locks[option.key as keyof CharacterLocks] || false}
                    onChange={(e) =>
                      setLocks({
                        ...locks,
                        [option.key]: e.target.checked || undefined,
                      })
                    }
                    className="w-4 h-4 text-[#00552b] border-gray-300 rounded focus:ring-[#00552b]"
                  />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
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
                  placeholder="Añadir etiqueta..."
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
                  Añadir
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!name.trim() || isLoading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-white bg-[#00552b] rounded-lg hover:bg-[#00552b]/90 transition disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creando...
            </>
          ) : (
            'Crear personaje'
          )}
        </button>
      </div>
    </form>
  );
}
