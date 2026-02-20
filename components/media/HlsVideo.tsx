'use client';

import { useEffect, useRef } from 'react';
import type { VideoHTMLAttributes } from 'react';
import Hls from 'hls.js';

export type HlsVideoProps = VideoHTMLAttributes<HTMLVideoElement> & {
  src?: string | null;
};

function isHlsSource(src?: string | null): boolean {
  if (!src) return false;
  return src.includes('.m3u8');
}

export function HlsVideo({ src, ...props }: HlsVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!src) {
      video.removeAttribute('src');
      video.load();
      return;
    }

    const isHls = isHlsSource(src);

    if (!isHls) {
      video.src = src;
      return;
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      return;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hls.loadSource(src);
      hls.attachMedia(video);

      return () => {
        hls.destroy();
      };
    }

    video.src = src;
  }, [src]);

  const shouldSetSrc = src && !isHlsSource(src);

  return (
    <video
      ref={videoRef}
      src={shouldSetSrc ? src ?? undefined : undefined}
      {...props}
    />
  );
}
