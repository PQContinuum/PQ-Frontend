'use client';

import { useCallback, memo } from 'react';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';

interface SpeechButtonProps {
  text: string;
  className?: string;
}

/**
 * Speech button component for TTS playback
 *
 * States:
 * - Idle: Play icon
 * - Loading: Spinner
 * - Playing: Sound wave icon
 * - After play: Replay icon
 */
function SpeechButtonComponent({ text, className = '' }: SpeechButtonProps) {
  const { speak, stop, isLoading, isPlaying, error } = useTextToSpeech();

  const handleClick = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (isLoading) {
        return; // Prevent double-clicks during loading
      }

      if (isPlaying) {
        stop();
        return;
      }

      await speak(text);
    },
    [speak, stop, isLoading, isPlaying, text]
  );

  // Determine button state and icon
  const getButtonContent = () => {
    if (isLoading) {
      return (
        <svg
          className="size-3.5 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
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

    if (isPlaying) {
      // Sound wave / stop icon
      return (
        <svg
          className="size-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" />
          <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" />
        </svg>
      );
    }

    // Default: Play icon
    return (
      <svg
        className="size-3.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
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
    if (isPlaying) return 'Detener reproducción';
    return 'Reproducir mensaje';
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      className={`
        inline-flex items-center justify-center
        rounded-full p-1.5
        text-[#4c4c4c] hover:text-[#00552b]
        hover:bg-[#00552b]/10
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-[#00552b]/30 focus:ring-offset-1
        disabled:opacity-50 disabled:cursor-not-allowed
        ${isPlaying ? 'text-[#00552b] bg-[#00552b]/10' : ''}
        ${error ? 'text-red-500 hover:text-red-600' : ''}
        ${className}
      `}
      aria-label={getAriaLabel()}
      title={error || getAriaLabel()}
    >
      {getButtonContent()}
    </button>
  );
}

export const SpeechButton = memo(SpeechButtonComponent);
