// ============================================================================
// LISA WIZARD TYPES
// ============================================================================

// Step 1: Content Type
export type ContentType = 'video' | 'image';

// Step 2: Media Subtype
export type VideoSubtype =
  | 'reels'
  | 'cinematic'
  | 'commercial'
  | 'tutorial'
  | 'social';

export type ImageSubtype =
  | 'portrait'
  | 'landscape'
  | 'product'
  | 'social'
  | 'artistic';

export type MediaSubtype = VideoSubtype | ImageSubtype;

// Step 5: Visual Style
export type VisualStyle =
  | 'realista'
  | 'anime'
  | '3d'
  | 'cartoon'
  | 'watercolor'
  | 'oil_painting'
  | 'sketch'
  | 'pixel_art'
  | 'cinematic'
  | 'minimalist';

// Step 6: Quality Settings
export interface QualitySettings {
  resolution: '720p' | '1080p' | '4k';
  fps?: '24' | '30' | '60';
  duration?: '5' | '10';
  aspectRatio: '16:9' | '9:16' | '1:1';
  format?: 'mp4' | 'webm' | 'gif';
}

// Step 7: Language Settings
export interface LanguageSettings {
  language: 'es' | 'en';
  voiceOver: boolean;
  voiceStyle?: 'neutral' | 'professional' | 'casual' | 'energetic';
  subtitles: boolean;
}

// ============================================================================
// CHARACTER TYPES
// ============================================================================

export interface PhysicalTraits {
  age?: string;
  gender?: string;
  skinTone?: string;
  hairColor?: string;
  hairStyle?: string;
  eyeColor?: string;
  height?: string;
  bodyType?: string;
  facialFeatures?: string;
  distinguishingMarks?: string;
}

export interface ClothingStyle {
  style?: string;
  topWear?: string;
  bottomWear?: string;
  footwear?: string;
  accessories?: string[];
  colors?: string[];
}

export interface PersonalityTraits {
  traits?: string[];
  voiceTone?: string;
  speechStyle?: string;
  mannerisms?: string;
  mood?: string;
}

export interface Character {
  id: string;
  userId: string;
  name: string;
  description?: string;
  physicalTraits?: PhysicalTraits;
  clothing?: ClothingStyle;
  personality?: PersonalityTraits;
  visualStyle?: VisualStyle;
  referenceImageUrl?: string;
  referenceImagePath?: string;
  compiledPrompt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCharacterInput {
  name: string;
  description?: string;
  physicalTraits?: PhysicalTraits;
  clothing?: ClothingStyle;
  personality?: PersonalityTraits;
  visualStyle?: VisualStyle;
  referenceImageUrl?: string;
}

export interface UpdateCharacterInput extends Partial<CreateCharacterInput> {
  id: string;
}

// ============================================================================
// WIZARD STATE
// ============================================================================

export interface LisaWizardState {
  // Current step (1-8)
  currentStep: number;

  // Step 1: Content Type
  contentType: ContentType | null;

  // Step 2: Media Subtype
  mediaSubtype: MediaSubtype | null;

  // Step 3: Description
  description: string;

  // Step 4: Character
  selectedCharacterId: string | null;
  selectedCharacter: Character | null;

  // Step 5: Visual Style
  visualStyle: VisualStyle | null;

  // Step 6: Quality Settings
  quality: QualitySettings;

  // Step 7: Language Settings
  language: LanguageSettings;

  // Step 8: Preview
  compiledPrompt: string;
  isEditing: boolean;
}

// ============================================================================
// WIZARD STEP CONFIG
// ============================================================================

export interface WizardStep {
  id: number;
  name: string;
  title: string;
  description: string;
  icon: string;
  isOptional: boolean;
}

export const WIZARD_STEPS: WizardStep[] = [
  {
    id: 1,
    name: 'content-type',
    title: 'Tipo de contenido',
    description: '¿Qué quieres crear?',
    icon: 'Target',
    isOptional: false,
  },
  {
    id: 2,
    name: 'media-subtype',
    title: 'Formato',
    description: 'Elige el formato específico',
    icon: 'LayoutGrid',
    isOptional: false,
  },
  {
    id: 3,
    name: 'description',
    title: 'Descripción',
    description: 'Describe tu escena',
    icon: 'PenLine',
    isOptional: false,
  },
  {
    id: 4,
    name: 'character',
    title: 'Personaje',
    description: 'Selecciona o crea un personaje',
    icon: 'User',
    isOptional: true,
  },
  {
    id: 5,
    name: 'visual-style',
    title: 'Estilo visual',
    description: 'Define la estética',
    icon: 'Palette',
    isOptional: false,
  },
  {
    id: 6,
    name: 'quality',
    title: 'Calidad',
    description: 'Resolución y formato',
    icon: 'Settings',
    isOptional: false,
  },
  {
    id: 7,
    name: 'language',
    title: 'Idioma',
    description: 'Voz y subtítulos',
    icon: 'Languages',
    isOptional: true,
  },
  {
    id: 8,
    name: 'preview',
    title: 'Preview',
    description: 'Revisa y genera',
    icon: 'Eye',
    isOptional: false,
  },
];
