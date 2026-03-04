'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { VideoHTMLAttributes } from 'react';
import Hls from 'hls.js';

export type HlsVideoProps = VideoHTMLAttributes<HTMLVideoElement> & {
  src?: string | null;
  /** Max retry attempts for recoverable errors (default: 4) */
  maxRetries?: number;
};

function isHlsSource(src?: string | null): boolean {
  if (!src) return false;
  return src.includes('.m3u8');
}

const RETRY_DELAYS = [2000, 4000, 8000, 15000]; // exponential backoff

export function HlsVideo({ src, maxRetries = 4, onError, ...props }: HlsVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hlsActiveRef = useRef(false);

  const fireError = useCallback(() => {
    // Mark hls as no longer active so the native error event passes through
    hlsActiveRef.current = false;
    videoRef.current?.dispatchEvent(new Event('error'));
  }, []);

  const destroyHls = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    hlsActiveRef.current = false;
  }, []);

  const retryLoad = useCallback(
    (hls: Hls, hlsSrc: string) => {
      const attempt = retryCountRef.current;
      if (attempt >= maxRetries) {
        fireError();
        return;
      }

      const delay = RETRY_DELAYS[Math.min(attempt, RETRY_DELAYS.length - 1)];
      retryCountRef.current = attempt + 1;

      retryTimerRef.current = setTimeout(() => {
        if (!hlsRef.current || !videoRef.current) return;
        hls.loadSource(hlsSrc);
        hls.attachMedia(videoRef.current);
      }, delay);
    },
    [maxRetries, fireError],
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Reset retry count on src change
    retryCountRef.current = 0;
    destroyHls();

    if (!src) {
      video.removeAttribute('src');
      video.load();
      return;
    }

    const isHls = isHlsSource(src);

    // Non-HLS: let the browser handle it natively
    if (!isHls) {
      video.src = src;
      return;
    }

    // Safari / iOS: native HLS support
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      return;
    }

    // Other browsers: use hls.js
    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        // Don't let hls.js retry infinitely on its own; we control retries
        manifestLoadingMaxRetry: 2,
        levelLoadingMaxRetry: 2,
        fragLoadingMaxRetry: 2,
      });
      hlsRef.current = hls;
      hlsActiveRef.current = true;

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (!data.fatal) return; // non-fatal errors recover automatically

        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            // Manifest 404/403 usually means Cloudflare is still processing
            // Retry with backoff
            retryLoad(hls, src);
            break;

          case Hls.ErrorTypes.MEDIA_ERROR:
            // Try to recover from media decode errors
            hls.recoverMediaError();
            break;

          default:
            // Unrecoverable error — notify parent
            destroyHls();
            fireError();
            break;
        }
      });

      hls.loadSource(src);
      hls.attachMedia(video);

      return () => {
        destroyHls();
      };
    }

    // Fallback: try native
    video.src = src;
  }, [src, destroyHls, retryLoad, fireError]);

  // Suppress native video errors while hls.js is active (it handles retries internally)
  const handleVideoError = useCallback(
    (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
      if (hlsActiveRef.current) return;
      onError?.(e);
    },
    [onError],
  );

  const shouldSetSrc = src && !isHlsSource(src);

  return (
    <video
      ref={videoRef}
      src={shouldSetSrc ? src ?? undefined : undefined}
      onError={handleVideoError}
      {...props}
    />
  );
}
