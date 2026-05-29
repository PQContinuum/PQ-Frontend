'use client';

import { useCallback, memo } from 'react';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';

interface SpeechButtonProps {
  text: string;
  className?: string;
}

/**
 * Speech button with play/pause/resume functionality
 *
 * States:
 * - Idle: Play icon (speaker)
 * - Loading: Spinner
 * - Playing: Pause icon
 * - Paused: Play icon (resume)
 */
function SpeechButtonComponent({ text, className = '' }: SpeechButtonProps) {
  const { toggle, isLoading, isPlaying, isPaused, error } = useTextToSpeech();

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      toggle(text);
    },
    [toggle, text]
  );

  // Determine icon based on state
  const getIcon = () => {
    // Loading - spinner
    if (isLoading) {
      return (
        <svg
          className="size-3.5 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      );
    }

    // Playing - show pause icon
    if (isPlaying) {
      return (
        <svg
          className="size-3.5"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <rect x="6" y="4" width="4" height="16" rx="1" />
          <rect x="14" y="4" width="4" height="16" rx="1" />
        </svg>
      );
    }

    // Paused - show play/resume icon
    if (isPaused) {
      return (
        <svg
          className="size-3.5"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M8 5v14l11-7z" />
        </svg>
      );
    }

    // Idle - show speaker icon
    return (
      <svg
        className="size-3.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z"
        />
      </svg>
    );
  };

  const getAriaLabel = () => {
    if (isLoading) return 'Cargando audio...';
    if (isPlaying) return 'Pausar';
    if (isPaused) return 'Reanudar';
    return 'Reproducir';
  };

  const getTitle = () => {
    if (error) return error;
    if (isLoading) return 'Cargando...';
    if (isPlaying) return 'Click para pausar';
    if (isPaused) return 'Click para reanudar';
    return 'Reproducir mensaje';
  };

  const getLabel = () => {
    if (isLoading) return 'Cargando';
    if (isPlaying) return 'Pausar';
    if (isPaused) return 'Reanudar';
    return 'Escuchar';
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      className={`
        inline-flex items-center justify-center gap-1.5
        rounded-full px-2.5 py-1.5
        text-[#4c4c4c] hover:text-[#FF8B3D]
        hover:bg-[#FF8B3D]/10
        text-xs font-medium
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-[#FF8B3D]/30 focus:ring-offset-1
        disabled:cursor-wait
        ${isPlaying ? 'text-[#FF8B3D] bg-[#FF8B3D]/15' : ''}
        ${isPaused ? 'text-[#FF8B3D] bg-[#FF8B3D]/10 ring-2 ring-[#FF8B3D]/20' : ''}
        ${error ? 'text-red-500 hover:text-red-600' : ''}
        ${className}
      `}
      aria-label={getAriaLabel()}
      title={getTitle()}
    >
      {getIcon()}
      <span>{getLabel()}</span>
    </button>
  );
}

export const SpeechButton = memo(SpeechButtonComponent);
