import type {
  LisaWizardState,
  Character,
  VisualStyle,
  QualitySettings,
  LanguageSettings,
  ContentType,
  MediaSubtype,
} from './types';
import {
  VISUAL_STYLE_OPTIONS,
  VIDEO_SUBTYPE_OPTIONS,
  IMAGE_SUBTYPE_OPTIONS,
} from './constants';

// ============================================================================
// PROMPT BUILDER
// ============================================================================

/**
 * Builds a complete prompt from LISA wizard state.
 * Combines all elements into a structured prompt for generation.
 */
export function buildPrompt(state: LisaWizardState): string {
  const parts: string[] = [];

  // 1. Content type context
  const contentTypeContext = getContentTypeContext(state.contentType, state.mediaSubtype);
  if (contentTypeContext) {
    parts.push(contentTypeContext);
  }

  // 2. Scene description (user input)
  if (state.description) {
    parts.push(`SCENE: ${state.description}`);
  }

  // 3. Character (if selected)
  if (state.selectedCharacter) {
    const characterPrompt = getCharacterPrompt(state.selectedCharacter);
    if (characterPrompt) {
      parts.push(`CHARACTER: ${characterPrompt}`);
    }
  }

  // 4. Visual style
  if (state.visualStyle) {
    const stylePrompt = getStylePrompt(state.visualStyle);
    if (stylePrompt) {
      parts.push(`STYLE: ${stylePrompt}`);
    }
  }

  // 5. Quality specifications
  const qualityPrompt = getQualityPrompt(state.quality, state.contentType);
  if (qualityPrompt) {
    parts.push(`QUALITY: ${qualityPrompt}`);
  }

  // 6. Language/Audio (for video)
  if (state.contentType === 'video' && state.language) {
    const audioPrompt = getAudioPrompt(state.language);
    if (audioPrompt) {
      parts.push(`AUDIO: ${audioPrompt}`);
    }
  }

  return parts.join('\n\n');
}

/**
 * Gets the context string for the content type and subtype.
 */
function getContentTypeContext(
  contentType: ContentType | null,
  mediaSubtype: MediaSubtype | null
): string | null {
  if (!contentType) return null;

  const isVideo = contentType === 'video';
  const options = isVideo ? VIDEO_SUBTYPE_OPTIONS : IMAGE_SUBTYPE_OPTIONS;
  const subtypeOption = options.find((o) => o.value === mediaSubtype);

  if (!subtypeOption) {
    return isVideo ? 'VIDEO GENERATION' : 'IMAGE GENERATION';
  }

  const baseType = isVideo ? 'VIDEO GENERATION' : 'IMAGE GENERATION';
  return `${baseType} - ${subtypeOption.label}: ${subtypeOption.description}. Aspect ratio: ${subtypeOption.aspectRatio}${subtypeOption.duration ? `, Duration: ${subtypeOption.duration}` : ''}`;
}

/**
 * Gets the prompt portion for a character.
 */
function getCharacterPrompt(character: Character): string | null {
  // If character has a compiled prompt, use it
  if (character.compiledPrompt) {
    return character.compiledPrompt;
  }

  // Otherwise build from attributes
  const parts: string[] = [];

  if (character.name) {
    parts.push(`Character named "${character.name}"`);
  }

  if (character.description) {
    parts.push(character.description);
  }

  // Physical traits
  if (character.physicalTraits) {
    const traits = character.physicalTraits;
    const physicalParts: string[] = [];

    if (traits.gender) physicalParts.push(traits.gender);
    if (traits.age) physicalParts.push(`${traits.age}`);
    if (traits.skinTone) physicalParts.push(`${traits.skinTone} skin`);
    if (traits.hairColor && traits.hairStyle) {
      physicalParts.push(`${traits.hairColor} ${traits.hairStyle} hair`);
    } else if (traits.hairColor || traits.hairStyle) {
      physicalParts.push(`${traits.hairColor || ''} ${traits.hairStyle || ''} hair`.trim());
    }
    if (traits.eyeColor) physicalParts.push(`${traits.eyeColor} eyes`);
    if (traits.bodyType) physicalParts.push(`${traits.bodyType} build`);

    if (physicalParts.length > 0) {
      parts.push(physicalParts.join(', '));
    }
  }

  // Clothing
  if (character.clothing) {
    const clothing = character.clothing;
    const clothingParts: string[] = [];

    if (clothing.style) clothingParts.push(`${clothing.style} clothing`);
    if (clothing.topWear) clothingParts.push(`wearing ${clothing.topWear}`);
    if (clothing.bottomWear) clothingParts.push(clothing.bottomWear);

    if (clothingParts.length > 0) {
      parts.push(clothingParts.join(', '));
    }
  }

  // Personality/mood
  if (character.personality?.mood) {
    parts.push(`${character.personality.mood} expression`);
  }

  return parts.length > 0 ? parts.join('. ') : null;
}

/**
 * Gets the style prompt suffix.
 */
function getStylePrompt(visualStyle: VisualStyle): string | null {
  const option = VISUAL_STYLE_OPTIONS.find((o) => o.value === visualStyle);
  return option?.promptSuffix || null;
}

/**
 * Gets the quality specifications as prompt text.
 */
function getQualityPrompt(
  quality: QualitySettings,
  contentType: ContentType | null
): string | null {
  const parts: string[] = [];

  if (quality.resolution) {
    parts.push(quality.resolution);
  }

  if (quality.aspectRatio) {
    parts.push(`${quality.aspectRatio} aspect ratio`);
  }

  if (contentType === 'video') {
    if (quality.fps) {
      parts.push(`${quality.fps}fps`);
    }
    if (quality.duration) {
      parts.push(`${quality.duration} seconds`);
    }
  }

  return parts.length > 0 ? parts.join(', ') : null;
}

/**
 * Gets the audio/language specifications.
 */
function getAudioPrompt(language: LanguageSettings): string | null {
  const parts: string[] = [];

  if (language.voiceOver) {
    const lang = language.language === 'es' ? 'Spanish' : 'English';
    const style = language.voiceStyle || 'neutral';
    parts.push(`${lang} voiceover, ${style} tone`);
  }

  if (language.subtitles) {
    const lang = language.language === 'es' ? 'Spanish' : 'English';
    parts.push(`${lang} subtitles`);
  }

  return parts.length > 0 ? parts.join(', ') : null;
}

// ============================================================================
// PROMPT EXTRACTION (for simple mode)
// ============================================================================

/**
 * Extracts just the scene description from wizard state.
 * Used when passing to existing generation hooks.
 */
export function extractSceneDescription(state: LisaWizardState): string {
  let prompt = state.description;

  // Add character context if selected
  if (state.selectedCharacter) {
    const characterPrompt = getCharacterPrompt(state.selectedCharacter);
    if (characterPrompt) {
      prompt = `${prompt}. ${characterPrompt}`;
    }
  }

  // Add style suffix
  if (state.visualStyle) {
    const styleOption = VISUAL_STYLE_OPTIONS.find((o) => o.value === state.visualStyle);
    if (styleOption) {
      prompt = `${prompt}. ${styleOption.promptSuffix}`;
    }
  }

  return prompt;
}

/**
 * Validates if the wizard state has minimum required data.
 */
export function validateWizardState(state: LisaWizardState): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!state.contentType) {
    errors.push('Selecciona un tipo de contenido');
  }

  if (!state.mediaSubtype) {
    errors.push('Selecciona un formato');
  }

  if (!state.description || state.description.trim().length < 10) {
    errors.push('La descripción debe tener al menos 10 caracteres');
  }

  if (!state.visualStyle) {
    errors.push('Selecciona un estilo visual');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
