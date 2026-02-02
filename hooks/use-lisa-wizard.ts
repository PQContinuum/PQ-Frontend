'use client';

import { create } from 'zustand';
import type {
  LisaWizardState,
  ContentType,
  MediaSubtype,
  VisualStyle,
  QualitySettings,
  LanguageSettings,
  Character,
} from '@/lib/lisa/types';
import {
  DEFAULT_QUALITY_SETTINGS,
  DEFAULT_LANGUAGE_SETTINGS,
  VIDEO_SUBTYPE_OPTIONS,
  IMAGE_SUBTYPE_OPTIONS,
} from '@/lib/lisa/constants';
import { buildPrompt } from '@/lib/lisa/prompt-builder';

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: LisaWizardState = {
  currentStep: 1,
  contentType: null,
  mediaSubtype: null,
  description: '',
  selectedCharacterId: null,
  selectedCharacter: null,
  visualStyle: null,
  quality: DEFAULT_QUALITY_SETTINGS,
  language: DEFAULT_LANGUAGE_SETTINGS,
  compiledPrompt: '',
  isEditing: false,
};

// ============================================================================
// STORE INTERFACE
// ============================================================================

interface LisaWizardStore extends LisaWizardState {
  // Navigation
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;

  // Step 1: Content Type
  setContentType: (type: ContentType) => void;

  // Step 2: Media Subtype
  setMediaSubtype: (subtype: MediaSubtype) => void;

  // Step 3: Description
  setDescription: (description: string) => void;

  // Step 4: Character
  setSelectedCharacter: (character: Character | null) => void;

  // Step 5: Visual Style
  setVisualStyle: (style: VisualStyle) => void;

  // Step 6: Quality
  setQuality: (quality: Partial<QualitySettings>) => void;

  // Step 7: Language
  setLanguage: (language: Partial<LanguageSettings>) => void;

  // Step 8: Preview
  compilePrompt: () => void;
  setCompiledPrompt: (prompt: string) => void;
  toggleEditing: () => void;

  // Reset
  reset: () => void;

  // Computed
  canProceed: () => boolean;
  getProgress: () => number;
}

// ============================================================================
// ZUSTAND STORE
// ============================================================================

export const useLisaWizardStore = create<LisaWizardStore>((set, get) => ({
  ...initialState,

  // ============================================================================
  // NAVIGATION
  // ============================================================================

  nextStep: () => {
    const { currentStep, canProceed } = get();
    if (canProceed() && currentStep < 8) {
      set({ currentStep: currentStep + 1 });

      // Auto-compile prompt when reaching preview step
      if (currentStep + 1 === 8) {
        get().compilePrompt();
      }
    }
  },

  prevStep: () => {
    const { currentStep } = get();
    if (currentStep > 1) {
      set({ currentStep: currentStep - 1 });
    }
  },

  goToStep: (step: number) => {
    if (step >= 1 && step <= 8) {
      set({ currentStep: step });

      // Auto-compile prompt when going to preview step
      if (step === 8) {
        get().compilePrompt();
      }
    }
  },

  // ============================================================================
  // STEP SETTERS
  // ============================================================================

  setContentType: (type: ContentType) => {
    const state = get();

    // Reset subtype when content type changes
    let newQuality = { ...state.quality };

    // Adjust quality defaults based on content type
    if (type === 'video') {
      newQuality = {
        ...DEFAULT_QUALITY_SETTINGS,
        aspectRatio: '16:9',
      };
    } else {
      newQuality = {
        ...DEFAULT_QUALITY_SETTINGS,
        aspectRatio: '1:1',
        fps: undefined,
        duration: undefined,
      };
    }

    set({
      contentType: type,
      mediaSubtype: null,
      quality: newQuality,
    });
  },

  setMediaSubtype: (subtype: MediaSubtype) => {
    const { contentType, quality } = get();

    // Find the subtype option to get default aspect ratio
    const options = contentType === 'video' ? VIDEO_SUBTYPE_OPTIONS : IMAGE_SUBTYPE_OPTIONS;
    const option = options.find((o) => o.value === subtype);

    // Update quality with subtype's default aspect ratio
    let newQuality = { ...quality };
    if (option) {
      const [w, h] = option.aspectRatio.split(':');
      // Map to supported aspect ratios
      if (w === '9' && h === '16') {
        newQuality.aspectRatio = '9:16';
      } else if (w === '16' && h === '9') {
        newQuality.aspectRatio = '16:9';
      } else {
        newQuality.aspectRatio = '1:1';
      }
    }

    set({
      mediaSubtype: subtype,
      quality: newQuality,
    });
  },

  setDescription: (description: string) => {
    set({ description });
  },

  setSelectedCharacter: (character: Character | null) => {
    set({
      selectedCharacter: character,
      selectedCharacterId: character?.id || null,
    });
  },

  setVisualStyle: (style: VisualStyle) => {
    set({ visualStyle: style });
  },

  setQuality: (quality: Partial<QualitySettings>) => {
    set((state) => ({
      quality: { ...state.quality, ...quality },
    }));
  },

  setLanguage: (language: Partial<LanguageSettings>) => {
    set((state) => ({
      language: { ...state.language, ...language },
    }));
  },

  // ============================================================================
  // PREVIEW
  // ============================================================================

  compilePrompt: () => {
    const state = get();
    const prompt = buildPrompt(state);
    set({ compiledPrompt: prompt });
  },

  setCompiledPrompt: (prompt: string) => {
    set({ compiledPrompt: prompt });
  },

  toggleEditing: () => {
    set((state) => ({ isEditing: !state.isEditing }));
  },

  // ============================================================================
  // RESET
  // ============================================================================

  reset: () => {
    set(initialState);
  },

  // ============================================================================
  // COMPUTED
  // ============================================================================

  canProceed: () => {
    const state = get();

    switch (state.currentStep) {
      case 1:
        return state.contentType !== null;
      case 2:
        return state.mediaSubtype !== null;
      case 3:
        return state.description.trim().length >= 10;
      case 4:
        // Character is optional
        return true;
      case 5:
        return state.visualStyle !== null;
      case 6:
        return state.quality.resolution !== undefined;
      case 7:
        // Language is optional for images
        return true;
      case 8:
        return state.compiledPrompt.length > 0;
      default:
        return false;
    }
  },

  getProgress: () => {
    const { currentStep } = get();
    return Math.round((currentStep / 8) * 100);
  },
}));

// ============================================================================
// SELECTOR HOOKS
// ============================================================================

export const useLisaCurrentStep = () => useLisaWizardStore((s) => s.currentStep);
export const useLisaContentType = () => useLisaWizardStore((s) => s.contentType);
export const useLisaMediaSubtype = () => useLisaWizardStore((s) => s.mediaSubtype);
export const useLisaDescription = () => useLisaWizardStore((s) => s.description);
export const useLisaSelectedCharacter = () => useLisaWizardStore((s) => s.selectedCharacter);
export const useLisaVisualStyle = () => useLisaWizardStore((s) => s.visualStyle);
export const useLisaQuality = () => useLisaWizardStore((s) => s.quality);
export const useLisaLanguage = () => useLisaWizardStore((s) => s.language);
export const useLisaCompiledPrompt = () => useLisaWizardStore((s) => s.compiledPrompt);
export const useLisaIsEditing = () => useLisaWizardStore((s) => s.isEditing);
