/**
 * IMAGE GENERATION STYLE PRESETS
 * ==============================
 *
 * Presets de estilos para Continuum Canvas
 * Cada preset modifica el prompt para lograr un estilo específico
 * Compatible con text-to-image y image-to-image
 */

export type ImageStylePreset = {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  // Prompt modifier que se agrega al prompt del usuario
  promptModifier: string;
  // Si es premium (solo para planes pagados)
  premium?: boolean;
  // Keywords para detectar este estilo automáticamente
  keywords?: string[];
};

/**
 * PRESETS DE ESTILOS DISPONIBLES
 * Los más populares y virales de 2025
 */
export const IMAGE_STYLE_PRESETS: ImageStylePreset[] = [
  {
    id: 'auto',
    name: 'Auto',
    description: 'Se elige el mejor estilo automáticamente',
    icon: '✨',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200',
    promptModifier: '',
  },
  {
    id: 'ghibli',
    name: 'Ghibli',
    description: 'Estilo Studio Ghibli anime',
    icon: '🏯',
    color: 'text-sky-600',
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-200',
    promptModifier: 'in the style of Studio Ghibli anime, soft watercolor textures, whimsical atmosphere, hand-drawn quality, warm nostalgic lighting',
    keywords: ['ghibli', 'miyazaki', 'totoro', 'spirited'],
  },
  {
    id: 'pixar',
    name: 'Pixar',
    description: 'Animación 3D estilo Pixar',
    icon: '🎬',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    promptModifier: 'Pixar 3D animation style, cute expressive characters, vibrant colors, smooth CGI rendering, cinematic lighting, family-friendly aesthetic',
    keywords: ['pixar', 'disney', '3d', 'cartoon'],
  },
  {
    id: 'photo',
    name: 'Foto',
    description: 'Fotografía hiperrealista',
    icon: '📷',
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
    promptModifier: 'photorealistic, professional DSLR photography, ultra high definition, natural lighting, shallow depth of field, 8K resolution',
    keywords: ['foto', 'photo', 'real', 'realista'],
  },
  {
    id: 'anime',
    name: 'Anime',
    description: 'Estilo anime japonés moderno',
    icon: '🎌',
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
    promptModifier: 'modern anime style, crisp linework, vibrant colors, expressive eyes, dynamic composition, Japanese animation aesthetic',
    keywords: ['anime', 'manga', 'japonés', 'otaku'],
  },
  {
    id: 'cinematic',
    name: 'Cine',
    description: 'Cinematográfico profesional',
    icon: '🎥',
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-200',
    promptModifier: 'cinematic film still, dramatic lighting, movie scene composition, anamorphic lens flare, professional color grading, Hollywood production quality',
    premium: true,
    keywords: ['cine', 'película', 'movie', 'film'],
  },
  {
    id: 'watercolor',
    name: 'Acuarela',
    description: 'Pintura en acuarela artística',
    icon: '🎨',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200',
    promptModifier: 'delicate watercolor painting, soft color washes, organic paint textures, artistic brushstrokes, dreamy atmospheric quality',
    keywords: ['acuarela', 'watercolor', 'pintura', 'arte'],
  },
  {
    id: 'oil',
    name: 'Óleo',
    description: 'Pintura al óleo clásica',
    icon: '🖼️',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    promptModifier: 'classical oil painting style, rich textures, masterful brushwork, Renaissance lighting, museum-quality fine art aesthetic',
    premium: true,
    keywords: ['óleo', 'oil', 'clásico', 'renaissance'],
  },
  {
    id: 'minimalist',
    name: 'Minimal',
    description: 'Diseño minimalista moderno',
    icon: '◻️',
    color: 'text-neutral-600',
    bgColor: 'bg-neutral-50',
    borderColor: 'border-neutral-200',
    promptModifier: 'minimalist design, clean composition, negative space, simple geometric forms, modern aesthetic, subtle color palette',
    keywords: ['minimal', 'simple', 'clean', 'moderno'],
  },
  {
    id: 'retro',
    name: 'Retro',
    description: 'Estética vintage 80s/90s',
    icon: '📼',
    color: 'text-fuchsia-600',
    bgColor: 'bg-fuchsia-50',
    borderColor: 'border-fuchsia-200',
    promptModifier: 'retro 80s aesthetic, synthwave colors, neon glow, VHS texture, nostalgic vintage vibe, vaporwave inspired',
    keywords: ['retro', '80s', '90s', 'vintage', 'neon'],
  },
  {
    id: 'comic',
    name: 'Cómic',
    description: 'Estilo cómic americano',
    icon: '💥',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    promptModifier: 'American comic book style, bold outlines, halftone dots, dynamic action poses, vibrant primary colors, Marvel/DC aesthetic',
    keywords: ['comic', 'marvel', 'dc', 'superhero'],
  },
  {
    id: 'concept',
    name: 'Concept',
    description: 'Arte conceptual profesional',
    icon: '🚀',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    promptModifier: 'professional concept art, detailed environment design, dramatic composition, cinematic atmosphere, AAA game or film production quality',
    premium: true,
    keywords: ['concept', 'concepto', 'game', 'videojuego'],
  },
];

/**
 * Obtiene un preset por ID
 */
export function getStylePreset(id: string): ImageStylePreset {
  return IMAGE_STYLE_PRESETS.find(p => p.id === id) || IMAGE_STYLE_PRESETS[0];
}

/**
 * Obtiene los presets disponibles para un plan
 */
export function getAvailablePresets(isPremium: boolean): ImageStylePreset[] {
  if (isPremium) {
    return IMAGE_STYLE_PRESETS;
  }
  return IMAGE_STYLE_PRESETS.filter(p => !p.premium);
}

/**
 * Aplica el modificador de estilo al prompt del usuario
 */
export function applyStyleToPrompt(userPrompt: string, styleId: string): string {
  const preset = getStylePreset(styleId);

  if (!preset.promptModifier) {
    return userPrompt;
  }

  // Construir el prompt final
  return `${userPrompt}, ${preset.promptModifier}`;
}

/**
 * Detecta automáticamente el estilo basado en keywords del prompt
 */
export function detectStyleFromPrompt(prompt: string): string | null {
  const lowerPrompt = prompt.toLowerCase();

  for (const preset of IMAGE_STYLE_PRESETS) {
    if (preset.keywords) {
      for (const keyword of preset.keywords) {
        if (lowerPrompt.includes(keyword.toLowerCase())) {
          return preset.id;
        }
      }
    }
  }

  return null;
}
