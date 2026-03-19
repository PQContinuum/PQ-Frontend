'use client';

import React from 'react';
import { Globe } from 'lucide-react';

import type { WebSearchResult } from '@/types/websearch';

export type WebResultsProps = {
  results: WebSearchResult[];
  className?: string;
};

function formatUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.host}${u.pathname === '/' ? '' : u.pathname}`;
  } catch {
    return url;
  }
}

export function WebResults({ results, className }: WebResultsProps) {
  if (!results || results.length === 0) return null;

  return (
    <div
      className={[
        'mt-4 overflow-hidden rounded-2xl border border-black/10 bg-white/70',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#111111]/60">
        <Globe className="size-4" />
        <span>Web results</span>
      </div>

      <div className="divide-y divide-black/5">
        {results.map((r, idx) => (
          <div key={`${r.url}-${idx}`} className="px-4 py-3">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-xs font-medium tabular-nums text-[#111111]/40">
                {idx + 1}
              </span>

              <div className="min-w-0 flex-1">
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block truncate text-sm font-semibold text-[#934f2c] hover:underline underline-offset-2"
                  title={r.title}
                >
                  {r.title || r.url}
                </a>

                <div className="mt-0.5 truncate text-[11px] text-[#111111]/50">
                  {formatUrl(r.url)}
                </div>

                {r.snippet && (
                  <p className="mt-2 text-sm leading-snug text-[#111111]/80">
                    {r.snippet}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

