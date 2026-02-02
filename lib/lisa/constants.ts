import type {
  ContentType,
  VideoSubtype,
  ImageSubtype,
  VisualStyle,
  QualitySettings,
  LanguageSettings,
} from './types';

// ============================================================================
// STEP 1: CONTENT TYPE OPTIONS
// ============================================================================

export interface ContentTypeOption {
  value: ContentType;
  label: string;
  description: string;
  icon: string;
  color: string;
}

export const CONTENT_TYPE_OPTIONS: ContentTypeOption[] = [
  {
    value: 'video',
    label: 'Video',
    description: 'Crea videos dinámicos con movimiento y audio',
    icon: 'Video',
    color: 'bg-purple-500',
  },
  {
    value: 'image',
    label: 'Imagen',
    description: 'Genera imágenes estáticas de alta calidad',
    icon: 'Image',
    color: 'bg-blue-500',
  },
];

// ============================================================================
// STEP 2: MEDIA SUBTYPE OPTIONS
// ============================================================================

export interface MediaSubtypeOption {
  value: VideoSubtype | ImageSubtype;
  label: string;
  description: string;
  icon: string;
  aspectRatio: string;
  duration?: string;
  forContentType: ContentType;
}

export const VIDEO_SUBTYPE_OPTIONS: MediaSubtypeOption[] = [
  {
    value: 'reels',
    label: 'Reels / TikTok',
    description: 'Video vertical corto para redes sociales',
    icon: 'Smartphone',
    aspectRatio: '9:16',
    duration: '5-10s',
    forContentType: 'video',
  },
  {
    value: 'cinematic',
    label: 'Cinemático',
    description: 'Video horizontal con estilo cinematográfico',
    icon: 'Clapperboard',
    aspectRatio: '16:9',
    duration: '10s',
    forContentType: 'video',
  },
  {
    value: 'commercial',
    label: 'Comercial',
    description: 'Ideal para publicidad y promoción',
    icon: 'Tv',
    aspectRatio: '16:9',
    duration: '5-10s',
    forContentType: 'video',
  },
  {
    value: 'tutorial',
    label: 'Tutorial',
    description: 'Contenido educativo paso a paso',
    icon: 'GraduationCap',
    aspectRatio: '16:9',
    duration: '10s',
    forContentType: 'video',
  },
  {
    value: 'social',
    label: 'Red Social',
    description: 'Formato cuadrado para Instagram/Facebook',
    icon: 'Share2',
    aspectRatio: '1:1',
    duration: '5s',
    forContentType: 'video',
  },
];

export const IMAGE_SUBTYPE_OPTIONS: MediaSubtypeOption[] = [
  {
    value: 'portrait',
    label: 'Retrato',
    description: 'Formato vertical ideal para personas',
    icon: 'UserCircle',
    aspectRatio: '2:3',
    forContentType: 'image',
  },
  {
    value: 'landscape',
    label: 'Paisaje',
    description: 'Formato horizontal panorámico',
    icon: 'Mountain',
    aspectRatio: '3:2',
    forContentType: 'image',
  },
  {
    value: 'product',
    label: 'Producto',
    description: 'Ideal para mostrar productos',
    icon: 'Package',
    aspectRatio: '1:1',
    forContentType: 'image',
  },
  {
    value: 'social',
    label: 'Red Social',
    description: 'Optimizado para redes sociales',
    icon: 'Share2',
    aspectRatio: '1:1',
    forContentType: 'image',
  },
  {
    value: 'artistic',
    label: 'Artístico',
    description: 'Sin restricciones de formato',
    icon: 'Palette',
    aspectRatio: '1:1',
    forContentType: 'image',
  },
];

// ============================================================================
// STEP 5: VISUAL STYLE OPTIONS
// ============================================================================

export interface VisualStyleOption {
  value: VisualStyle;
  label: string;
  description: string;
  icon: string;
  promptSuffix: string;
  color: string;
  bgColor: string;
}

export const VISUAL_STYLE_OPTIONS: VisualStyleOption[] = [
  {
    value: 'realista',
    label: 'Realista',
    description: 'Fotorrealista, altamente detallado',
    icon: 'Camera',
    promptSuffix: 'photorealistic style, highly detailed, professional photography',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
  },
  {
    value: 'cinematic',
    label: 'Cinemático',
    description: 'Iluminación dramática, calidad de cine',
    icon: 'Clapperboard',
    promptSuffix: 'cinematic style, dramatic lighting, movie quality, depth of field',
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
  },
  {
    value: 'anime',
    label: 'Anime',
    description: 'Estilo de animación japonesa',
    icon: 'Zap',
    promptSuffix: 'anime style, vibrant colors, Japanese animation aesthetic',
    color: 'text-pink-700',
    bgColor: 'bg-pink-100',
  },
  {
    value: '3d',
    label: '3D Render',
    description: 'Renderizado 3D de alta calidad',
    icon: 'Box',
    promptSuffix: '3D rendered, CGI quality, volumetric lighting, octane render',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
  },
  {
    value: 'cartoon',
    label: 'Cartoon',
    description: 'Estilo de caricatura colorido',
    icon: 'Smile',
    promptSuffix: 'cartoon style, bold outlines, vibrant colors, playful',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
  },
  {
    value: 'watercolor',
    label: 'Acuarela',
    description: 'Textura de pintura acuarela',
    icon: 'Droplets',
    promptSuffix: 'watercolor painting style, soft edges, artistic, delicate',
    color: 'text-cyan-700',
    bgColor: 'bg-cyan-100',
  },
  {
    value: 'oil_painting',
    label: 'Óleo',
    description: 'Estilo de pintura al óleo clásica',
    icon: 'Brush',
    promptSuffix: 'oil painting style, rich textures, classical art, museum quality',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
  },
  {
    value: 'sketch',
    label: 'Boceto',
    description: 'Dibujo a lápiz detallado',
    icon: 'Pencil',
    promptSuffix: 'pencil sketch style, detailed linework, hand drawn',
    color: 'text-slate-700',
    bgColor: 'bg-slate-100',
  },
  {
    value: 'pixel_art',
    label: 'Pixel Art',
    description: 'Estética retro de videojuegos',
    icon: 'Grid3x3',
    promptSuffix: 'pixel art style, retro gaming aesthetic, 8-bit',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
  },
  {
    value: 'minimalist',
    label: 'Minimalista',
    description: 'Líneas limpias, composición simple',
    icon: 'Minus',
    promptSuffix: 'minimalist style, clean lines, simple composition, elegant',
    color: 'text-neutral-700',
    bgColor: 'bg-neutral-100',
  },
];

// ============================================================================
// STEP 6: QUALITY OPTIONS
// ============================================================================

export interface ResolutionOption {
  value: '720p' | '1080p' | '4k';
  label: string;
  description: string;
  premium: boolean;
}

export const RESOLUTION_OPTIONS: ResolutionOption[] = [
  { value: '720p', label: '720p HD', description: 'Buena calidad', premium: false },
  { value: '1080p', label: '1080p Full HD', description: 'Alta calidad', premium: false },
  { value: '4k', label: '4K UHD', description: 'Máxima calidad', premium: true },
];

export interface FpsOption {
  value: '24' | '30' | '60';
  label: string;
  description: string;
  premium: boolean;
}

export const FPS_OPTIONS: FpsOption[] = [
  { value: '24', label: '24 fps', description: 'Estilo cine', premium: false },
  { value: '30', label: '30 fps', description: 'Estándar', premium: false },
  { value: '60', label: '60 fps', description: 'Ultra fluido', premium: true },
];

export interface DurationOption {
  value: '5' | '10';
  label: string;
  description: string;
  premium: boolean;
}

export const DURATION_OPTIONS: DurationOption[] = [
  { value: '5', label: '5 segundos', description: 'Clip corto', premium: false },
  { value: '10', label: '10 segundos', description: 'Clip largo', premium: true },
];

export interface AspectRatioOption {
  value: '16:9' | '9:16' | '1:1';
  label: string;
  description: string;
  icon: string;
}

export const ASPECT_RATIO_OPTIONS: AspectRatioOption[] = [
  { value: '16:9', label: '16:9', description: 'Horizontal', icon: 'RectangleHorizontal' },
  { value: '9:16', label: '9:16', description: 'Vertical', icon: 'RectangleVertical' },
  { value: '1:1', label: '1:1', description: 'Cuadrado', icon: 'Square' },
];

// ============================================================================
// STEP 7: LANGUAGE OPTIONS
// ============================================================================

export interface LanguageOption {
  value: 'es' | 'en';
  label: string;
  code: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { value: 'es', label: 'Español', code: 'ES' },
  { value: 'en', label: 'English', code: 'EN' },
];

export interface VoiceStyleOption {
  value: 'neutral' | 'professional' | 'casual' | 'energetic';
  label: string;
  description: string;
}

export const VOICE_STYLE_OPTIONS: VoiceStyleOption[] = [
  { value: 'neutral', label: 'Neutral', description: 'Tono equilibrado' },
  { value: 'professional', label: 'Profesional', description: 'Tono formal y serio' },
  { value: 'casual', label: 'Casual', description: 'Tono relajado y cercano' },
  { value: 'energetic', label: 'Energético', description: 'Tono dinámico y emocionante' },
];

// ============================================================================
// DEFAULT VALUES
// ============================================================================

export const DEFAULT_QUALITY_SETTINGS: QualitySettings = {
  resolution: '1080p',
  fps: '30',
  duration: '5',
  aspectRatio: '16:9',
  format: 'mp4',
};

export const DEFAULT_LANGUAGE_SETTINGS: LanguageSettings = {
  language: 'es',
  voiceOver: false,
  voiceStyle: 'neutral',
  subtitles: false,
};

// ============================================================================
// PHYSICAL TRAITS OPTIONS (for character creation)
// ============================================================================

export const AGE_OPTIONS = [
  'bebé', 'niño', 'adolescente', 'joven adulto (20-30)',
  'adulto (30-45)', 'adulto maduro (45-60)', 'tercera edad (60+)',
];

export const GENDER_OPTIONS = ['masculino', 'femenino', 'no binario', 'otro'];

export const SKIN_TONE_OPTIONS = [
  'pálido', 'claro', 'medio', 'oliva', 'moreno', 'oscuro',
];

export const HAIR_COLOR_OPTIONS = [
  'negro', 'castaño oscuro', 'castaño', 'castaño claro',
  'rubio oscuro', 'rubio', 'rubio platino', 'pelirrojo',
  'gris', 'blanco', 'azul', 'verde', 'rosa', 'púrpura',
];

export const HAIR_STYLE_OPTIONS = [
  'corto', 'medio', 'largo', 'muy largo', 'rapado', 'calvo',
  'rizado', 'ondulado', 'lacio', 'afro', 'trenzas', 'coleta',
  'moño', 'flequillo', 'despeinado', 'peinado hacia atrás',
];

export const EYE_COLOR_OPTIONS = [
  'negro', 'café oscuro', 'café', 'avellana', 'verde',
  'azul', 'gris', 'ámbar', 'heterocromía',
];

export const BODY_TYPE_OPTIONS = [
  'delgado', 'promedio', 'atlético', 'musculoso', 'corpulento', 'robusto',
];

// ============================================================================
// CLOTHING STYLE OPTIONS
// ============================================================================

export const CLOTHING_STYLE_OPTIONS = [
  'casual', 'formal', 'deportivo', 'elegante', 'bohemio',
  'vintage', 'gótico', 'punk', 'minimalista', 'streetwear',
  'business casual', 'tradicional', 'futurista', 'fantasía',
];

export const MOOD_OPTIONS = [
  'alegre', 'serio', 'pensativo', 'enojado', 'triste',
  'sorprendido', 'confiado', 'tímido', 'misterioso', 'relajado',
];
