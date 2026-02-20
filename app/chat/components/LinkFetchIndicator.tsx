'use client';

import type { LinkType } from '@/types/link-resolver';

type PlatformMeta = {
  label: string;
  bg: string;
  text: string;
  dot: string;
  icon: JSX.Element;
};

const PLATFORM_META: Record<LinkType, PlatformMeta> = {
  x: {
    label: 'X',
    bg: '#0f0f0f',
    text: '#ffffff',
    dot: '#0f0f0f',
    icon: <span className="text-[11px] font-semibold">X</span>,
  },
  facebook: {
    label: 'Facebook',
    bg: '#1877F2',
    text: '#ffffff',
    dot: '#1877F2',
    icon: <span className="text-[11px] font-semibold">f</span>,
  },
  instagram: {
    label: 'Instagram',
    bg: 'linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
    text: '#ffffff',
    dot: '#dc2743',
    icon: <span className="text-[9px] font-semibold">IG</span>,
  },
  tiktok: {
    label: 'TikTok',
    bg: 'linear-gradient(135deg, #25F4EE 0%, #0f0f0f 45%, #FE2C55 100%)',
    text: '#ffffff',
    dot: '#FE2C55',
    icon: <span className="text-[9px] font-semibold">TT</span>,
  },
  web: {
    label: 'Web',
    bg: '#0f766e',
    text: '#ffffff',
    dot: '#0f766e',
    icon: (
      <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3a9 9 0 100 18 9 9 0 000-18z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.5 2.5 2.5 15 0 18" />
      </svg>
    ),
  },
};

export function LinkFetchIndicator({ linkType }: { linkType: LinkType }) {
  const meta = PLATFORM_META[linkType] ?? PLATFORM_META.web;

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/90 px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-zinc-900/80 dark:text-zinc-200">
      <span
        className="flex h-6 w-6 items-center justify-center rounded-full text-white"
        style={{ background: meta.bg, color: meta.text }}
      >
        {meta.icon}
      </span>
      <span className="whitespace-nowrap">Extrayendo de {meta.label}</span>
      <span className="flex items-center gap-1">
        {[0, 1, 2].map((dot) => (
          <span
            key={dot}
            className="h-1.5 w-1.5 rounded-full"
            style={{
              backgroundColor: meta.dot,
              animation: 'linkDots 1.2s infinite',
              animationDelay: `${dot * 0.2}s`,
            }}
          />
        ))}
      </span>

      <style jsx>{`
        @keyframes linkDots {
          0% {
            opacity: 0.25;
            transform: translateY(0);
          }
          50% {
            opacity: 1;
            transform: translateY(-2px);
          }
          100% {
            opacity: 0.25;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
