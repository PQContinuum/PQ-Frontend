'use client';

import { useMemo, useState } from 'react';
import { Streamdown } from 'streamdown';
import { code } from '@streamdown/code';
import { createMathPlugin } from '@streamdown/math';
import { Link as LinkIcon, X, Linkedin, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { sanitizeMarkdown } from '@/lib/sanitize-markdown';

const math = createMathPlugin({ singleDollarTextMath: true });

interface ShareResponseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  content: string;
  shareUrl: string;
}

const shareIconClasses =
  'size-12 rounded-full bg-[#ff7a00] text-white shadow-lg shadow-[#ff7a00]/25 transition-transform duration-200 group-hover:-translate-y-1 flex items-center justify-center';

const RedditIcon = ({ className = '' }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12.5" r="8.5" />
    <circle cx="9" cy="12" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="15" cy="12" r="0.9" fill="currentColor" stroke="none" />
    <path d="M8 15c1.6 1 6.4 1 8 0" />
    <path d="M15.5 7l2-1" />
    <circle cx="18.6" cy="5.8" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);

export function ShareResponseModal({ open, onOpenChange, title, content, shareUrl }: ShareResponseModalProps) {
  const [linkCopied, setLinkCopied] = useState(false);

  const previewContent = useMemo(() => sanitizeMarkdown(content.trim()), [content]);

  const shareUrls = useMemo(
    () => ({
      x: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      reddit: `https://www.reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(title)}`,
    }),
    [shareUrl, title]
  );

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 5000);
    } catch {
      setLinkCopied(false);
    }
  };

  const handleShare = (platform: keyof typeof shareUrls) => {
    const url = shareUrls[platform];
    if (!url) return;
    window.open(url, '_blank', 'width=640,height=640');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[760px] w-[calc(100%-2rem)] sm:w-full bg-[#f7f7f7] border-black/10 rounded-[32px] px-6 py-6 sm:px-8 sm:py-8 gap-6 max-h-[85vh] overflow-y-auto"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-semibold text-[#111111] tracking-tight">
              {title}
            </h2>
            <p className="text-sm text-[#111111]/60">Comparte esta respuesta.</p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex size-10 items-center justify-center rounded-full border border-black/10 bg-white text-[#111111]/70 transition hover:text-[#111111] hover:shadow-sm"
            aria-label="Cerrar"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="relative rounded-[26px] border border-black/10 bg-white px-6 py-5 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
          <div className="max-h-[320px] overflow-y-auto pr-2 space-y-4 text-[15px] leading-relaxed text-[#111111] continuum-prose">
            <Streamdown
              mode="static"
              plugins={{ code, math }}
              controls={{ code: { copy: true } }}
              lineNumbers={false}
            >
              {previewContent}
            </Streamdown>
          </div>
          <div className="mt-6 flex justify-end text-sm font-semibold text-[#111111]/70">ContinuumAI</div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
          <button
            type="button"
            onClick={handleCopyLink}
            className="group flex flex-col items-center gap-2"
          >
            <span className={cn(shareIconClasses, linkCopied && 'bg-emerald-500 shadow-emerald-500/25')}>
              {linkCopied ? <Check className="mx-auto size-5" /> : <LinkIcon className="mx-auto size-5" />}
            </span>
            <span className="text-xs font-medium text-[#111111]/70">Copy link</span>
          </button>
          <button
            type="button"
            onClick={() => handleShare('x')}
            className="group flex flex-col items-center gap-2"
          >
            <span className={shareIconClasses}>
              <X className="mx-auto size-5" />
            </span>
            <span className="text-xs font-medium text-[#111111]/70">X</span>
          </button>
          <button
            type="button"
            onClick={() => handleShare('linkedin')}
            className="group flex flex-col items-center gap-2"
          >
            <span className={shareIconClasses}>
              <Linkedin className="mx-auto size-5" />
            </span>
            <span className="text-xs font-medium text-[#111111]/70">LinkedIn</span>
          </button>
          <button
            type="button"
            onClick={() => handleShare('reddit')}
            className="group flex flex-col items-center gap-2"
          >
            <span className={shareIconClasses}>
              <RedditIcon className="mx-auto size-5" />
            </span>
            <span className="text-xs font-medium text-[#111111]/70">Reddit</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
