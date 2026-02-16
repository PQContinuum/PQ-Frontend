'use client';

import { Globe, Loader2 } from 'lucide-react';

import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useWebSearchStore } from '@/store/useWebSearchStore';

export type WebSearchToggleProps = {
  className?: string;
};

export function WebSearchToggle({ className }: WebSearchToggleProps) {
  const enableWebSearch = useWebSearchStore((s) => s.enableWebSearch);
  const setEnableWebSearch = useWebSearchStore((s) => s.setEnableWebSearch);
  const isSearching = useWebSearchStore((s) => s.isSearching);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={[
            'flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-2.5 py-1.5 shadow-sm',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <span className="relative flex items-center">
            {isSearching ? (
              <Loader2 className="size-4 animate-spin text-[#00552b]" />
            ) : (
              <Globe className="size-4 text-[#111111]/70" />
            )}
          </span>

          <span className="hidden sm:inline text-xs font-medium text-[#111111]/70">
            Web Search
          </span>

          <Switch
            checked={enableWebSearch}
            onCheckedChange={setEnableWebSearch}
            aria-label="Enable Web Search"
          />
        </div>
      </TooltipTrigger>
      <TooltipContent>Enable Web Search</TooltipContent>
    </Tooltip>
  );
}

