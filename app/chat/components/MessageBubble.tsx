'use client';

import { useState, type ComponentPropsWithoutRef, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';

import type { ChatMessage } from '@/app/chat/store';
import { GeoCulturalResponse } from './GeoCulturalResponse';
import { AttachmentsPreview } from './AttachmentsPreview';
import { SpeechButton } from './SpeechButton';

import 'highlight.js/styles/github.css';

// Skeleton component for image generation - creative animated preview
const ImageGeneratingSkeleton = () => (
  <div className="w-[280px] h-[280px] rounded-2xl overflow-hidden relative bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50">
    {/* Animated gradient background */}
    <div className="absolute inset-0 bg-gradient-to-r from-blue-100/50 via-purple-100/50 to-pink-100/50 animate-[gradient-shift_3s_ease-in-out_infinite]" />

    {/* Floating particles effect */}
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400/30 rounded-full animate-[float-particle_2s_ease-in-out_infinite]" />
      <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-purple-400/30 rounded-full animate-[float-particle_2.5s_ease-in-out_infinite_0.5s]" />
      <div className="absolute bottom-1/3 left-1/3 w-2.5 h-2.5 bg-pink-400/30 rounded-full animate-[float-particle_3s_ease-in-out_infinite_1s]" />
      <div className="absolute top-1/2 right-1/3 w-1 h-1 bg-blue-300/40 rounded-full animate-[float-particle_2s_ease-in-out_infinite_0.3s]" />
    </div>

    {/* Center content */}
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
      {/* Animated icon container */}
      <div className="relative">
        {/* Outer glow ring */}
        <div className="absolute -inset-4 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20 rounded-full blur-xl animate-pulse" />

        {/* Spinning ring */}
        <div className="absolute -inset-2 border-2 border-dashed border-gray-300/50 rounded-full animate-[spin_8s_linear_infinite]" />

        {/* Icon background */}
        <div className="relative size-16 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg flex items-center justify-center">
          <svg
            className="size-8 text-gray-400 animate-pulse"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
            />
          </svg>
        </div>
      </div>

      {/* Text with shimmer */}
      <div className="relative">
        <span className="text-sm font-medium text-gray-500">Creando tu imagen</span>
        <span className="ml-1 inline-flex">
          <span className="animate-[bounce_1s_ease-in-out_infinite]">.</span>
          <span className="animate-[bounce_1s_ease-in-out_infinite_0.2s]">.</span>
          <span className="animate-[bounce_1s_ease-in-out_infinite_0.4s]">.</span>
        </span>
      </div>
    </div>

    {/* Bottom shimmer bar */}
    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200/50 overflow-hidden">
      <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-blue-400/60 to-transparent animate-[shimmer-bar_1.5s_ease-in-out_infinite]" />
    </div>
  </div>
);

// Custom image component with smaller size
// Using span instead of div to avoid hydration errors when inside <p> tags
const ChatImage = ({ src, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <span className="block w-full max-w-[280px] aspect-square rounded-2xl bg-gray-100 flex items-center justify-center">
        <span className="text-sm text-gray-400">Error al cargar imagen</span>
      </span>
    );
  }

  return (
    <span className="relative block w-full max-w-[280px]">
      {isLoading && (
        <span className="absolute inset-0 block rounded-2xl bg-gray-100 animate-pulse" />
      )}
      <img
        src={src}
        alt={alt || 'Imagen generada'}
        className="w-full h-auto rounded-2xl shadow-sm border border-black/5"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        {...props}
      />
    </span>
  );
};

export type GeoCulturalAnalysisText = {
  type: 'geocultural_analysis';
  reply: string;
  areaName?: string;
};

type MessageBubbleProps = {
  message: ChatMessage;
  isStreaming?: boolean;
  attachments?: Array<{
    id: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    mimeType?: string;
  }>;
};

type MarkdownCodeProps = ComponentPropsWithoutRef<'code'> & {
  inline?: boolean;
  className?: string;
};

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Ignore clipboard errors
  }
};

const CodeBlock = ({
  language,
  value,
}: {
  language: string;
  value: string;
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await copyToClipboard(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={handleCopy}
        className="absolute right-3 top-3 rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-medium text-[#111111] opacity-0 shadow-sm transition group-hover:opacity-100"
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
      <pre className="overflow-x-auto rounded-2xl border border-black/10 bg-[#f7f7f7] p-4 text-sm text-[#111111]">
        <code className={`language-${language}`}>{value}</code>
      </pre>
    </div>
  );
};

export function MessageBubble({ message, isStreaming = false, attachments }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  const { geoCulturalData, geoCulturalText, isLoadingGeoCultural, isGeneratingImage } = useMemo(() => {
    if (isUser || !message.content) return { geoCulturalData: null, geoCulturalText: null, isLoadingGeoCultural: false, isGeneratingImage: false };

    const trimmedContent = message.content.trim();

    // Check if this is an image generation loading message
    if (trimmedContent.includes('🖼️ Generando imagen')) {
      return { geoCulturalData: null, geoCulturalText: null, isLoadingGeoCultural: false, isGeneratingImage: true };
    }

    const looksLikeJSON = trimmedContent.startsWith('{');

    if (looksLikeJSON) {
      try {
        const parsed = JSON.parse(trimmedContent);

        // Check for new geocultural analysis format (text-only)
        if (parsed.type === 'geocultural_analysis' && 'reply' in parsed) {
          if (isStreaming && parsed.reply === '') {
            // It's the start of a geocultural stream, reply is still empty. Show skeleton.
            return { geoCulturalData: null, geoCulturalText: null, isLoadingGeoCultural: true, isGeneratingImage: false };
          }
          return { geoCulturalData: null, geoCulturalText: parsed, isLoadingGeoCultural: false, isGeneratingImage: false };
        }

        // Legacy format (with places and map) - no longer used but kept for compatibility
        if (parsed.reply && parsed.places && parsed.userCoords) {
          return { geoCulturalData: parsed, geoCulturalText: null, isLoadingGeoCultural: false, isGeneratingImage: false };
        }
      } catch {
        return { geoCulturalData: null, geoCulturalText: null, isLoadingGeoCultural: true, isGeneratingImage: false };
      }
    }

    return { geoCulturalData: null, geoCulturalText: null, isLoadingGeoCultural: false, isGeneratingImage: false };
  }, [message.content, isUser, isStreaming]);

  // Show skeleton while generating image
  if (isGeneratingImage) {
    return (
      <div className="flex justify-start">
        <div className="inline-flex rounded-4xl border border-transparent bg-transparent text-black px-4 py-2">
          <ImageGeneratingSkeleton />
        </div>
      </div>
    );
  }

  if (isLoadingGeoCultural) {
    return (
      <div className="flex justify-start w-full">
        <div className="inline-flex max-w-full w-full rounded-4xl border border-transparent bg-transparent text-black px-4 py-2">
          <div className="space-y-6 w-full">
            {/* Header skeleton */}
            <div className="flex items-center gap-3 pb-4 border-b border-[#00552b]/10 animate-pulse">
              <div className="size-12 rounded-full bg-gradient-to-br from-[#e8e8e8] to-[#d8d8d8]"></div>
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-[#e8e8e8] rounded w-32"></div>
                <div className="h-5 bg-[#e8e8e8] rounded w-48"></div>
              </div>
            </div>

            {/* Content skeleton */}
            <div className="space-y-6 animate-pulse">
              {/* Section 1 */}
              <div className="space-y-3">
                <div className="h-6 bg-gradient-to-r from-[#00552b]/20 to-[#00552b]/10 rounded w-2/5"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-[#e8e8e8] rounded w-full"></div>
                  <div className="h-4 bg-[#e8e8e8] rounded w-11/12"></div>
                  <div className="h-4 bg-[#e8e8e8] rounded w-10/12"></div>
                  <div className="h-4 bg-[#e8e8e8] rounded w-full"></div>
                </div>
              </div>

              {/* Section 2 */}
              <div className="space-y-3">
                <div className="h-6 bg-gradient-to-r from-[#00552b]/20 to-[#00552b]/10 rounded w-1/3"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-[#e8e8e8] rounded w-full"></div>
                  <div className="h-4 bg-[#e8e8e8] rounded w-10/12"></div>
                  <div className="h-4 bg-[#e8e8e8] rounded w-11/12"></div>
                </div>
              </div>

              {/* Decorative icon */}
              <div className="flex items-center justify-center py-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-[#00552b]/10 rounded-full blur-xl animate-pulse"></div>
                  <svg className="size-12 text-[#00552b]/20 relative animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>

              {/* Section 3 */}
              <div className="space-y-3">
                <div className="h-6 bg-gradient-to-r from-[#00552b]/20 to-[#00552b]/10 rounded w-2/5"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-[#e8e8e8] rounded w-full"></div>
                  <div className="h-4 bg-[#e8e8e8] rounded w-9/12"></div>
                  <div className="h-4 bg-[#e8e8e8] rounded w-10/12"></div>
                </div>
              </div>

              {/* Section 4 */}
              <div className="space-y-3">
                <div className="h-6 bg-gradient-to-r from-[#00552b]/20 to-[#00552b]/10 rounded w-1/2"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-[#e8e8e8] rounded w-full"></div>
                  <div className="h-4 bg-[#e8e8e8] rounded w-11/12"></div>
                  <div className="h-4 bg-[#e8e8e8] rounded w-10/12"></div>
                  <div className="h-4 bg-[#e8e8e8] rounded w-full"></div>
                </div>
              </div>
            </div>

            {/* Footer skeleton */}
            <div className="pt-6 border-t border-[#00552b]/10 animate-pulse">
              <div className="flex items-center justify-center">
                <div className="h-4 bg-[#e8e8e8] rounded w-48"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render geocultural text analysis (new format)
  if (geoCulturalText) {
    return (
      <div className="flex justify-start w-full">
        <div className="inline-flex max-w-full w-full rounded-4xl border border-transparent bg-transparent text-black px-4 py-2">
          <div className="w-full space-y-6">
            {/* Header with area badge */}
            <div className="flex items-center gap-3 pb-4 border-b border-[#00552b]/10">
              <div className="flex-shrink-0">
                <div className="size-12 rounded-full bg-gradient-to-br from-[#00552b] to-[#00aa56] flex items-center justify-center shadow-lg">
                  <svg className="size-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xs font-semibold text-[#00552b]/60 uppercase tracking-wider mb-1">
                  Análisis Geocultural
                </h3>
                {geoCulturalText.areaName && (
                  <h2 className="text-xl font-bold text-[#111111]">
                    {geoCulturalText.areaName}
                  </h2>
                )}
              </div>
            </div>

            {/* Geocultural analysis content with enhanced styling */}
            <div className="geocultural-analysis">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                  h1: (props) => (
                    <h1 {...props} className="text-2xl font-bold text-[#111111] mt-8 mb-4 pb-3 border-b-2 border-[#00552b]/20" />
                  ),
                  h2: (props) => (
                    <h2 {...props} className="text-xl font-bold text-[#00552b] mt-6 mb-3 flex items-center gap-2" />
                  ),
                  h3: (props) => (
                    <h3 {...props} className="text-lg font-semibold text-[#111111] mt-5 mb-2.5" />
                  ),
                  p: (props) => (
                    <p {...props} className="text-[15px] leading-relaxed text-gray-800 mb-4" />
                  ),
                  ul: (props) => (
                    <ul {...props} className="space-y-2 mb-4 ml-6" />
                  ),
                  ol: (props) => (
                    <ol {...props} className="space-y-2 mb-4 ml-6" />
                  ),
                  li: (props) => (
                    <li {...props} className="text-[15px] text-gray-700 leading-relaxed pl-2">
                      <span className="inline-flex items-start gap-2">
                        <span className="text-[#00552b] mt-1.5 shrink-0">•</span>
                        <span className="flex-1">{props.children}</span>
                      </span>
                    </li>
                  ),
                  strong: (props) => (
                    <strong {...props} className="font-semibold text-[#00552b]" />
                  ),
                  em: (props) => (
                    <em {...props} className="italic text-gray-700" />
                  ),
                  blockquote: (props) => (
                    <blockquote {...props} className="border-l-4 border-[#00552b] bg-[#00552b]/5 pl-4 py-3 my-4 italic text-gray-700" />
                  ),
                  hr: (props) => (
                    <hr {...props} className="my-6 border-t-2 border-[#00552b]/10" />
                  ),
                  pre: ({ children }) => {
                    const codeElement = children as React.ReactElement;
                    const codeProps = codeElement?.props as { className?: string; children?: React.ReactNode };
                    const className = codeProps?.className || '';
                    const language = className.replace('language-', '') || 'text';
                    const value = String(codeProps?.children || '');

                    return <CodeBlock language={language} value={value} />;
                  },
                  code({ inline, className, children, ...props }: MarkdownCodeProps) {
                    if (inline) {
                      return (
                        <code
                          {...props}
                          className="rounded-md bg-[#00552b]/10 px-2 py-0.5 text-[0.92em] text-[#00552b] font-medium"
                        >
                          {children}
                        </code>
                      );
                    }
                    return <code {...props} className={className}>{children}</code>;
                  },
                  a: (props) => (
                    <a
                      {...props}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-[#00552b] underline underline-offset-2 hover:text-[#00aa56] transition-colors"
                    />
                  ),
                }}
              >
                {geoCulturalText.reply}
              </ReactMarkdown>
            </div>

            {/* Footer decoration */}
            <div className="pt-6 border-t border-[#00552b]/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-[#00552b]/40">
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">Análisis territorial completo</span>
                </div>
                {!isStreaming && geoCulturalText.reply && (
                  <SpeechButton text={geoCulturalText.reply} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Legacy geocultural format (with map and places)
  if (geoCulturalData) {
    return (
      <div className="flex justify-start w-full">
        <div className="inline-flex max-w-full w-full rounded-4xl border border-transparent bg-transparent text-black px-4 py-2">
          <GeoCulturalResponse data={geoCulturalData} />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className="flex flex-col gap-1">
        <div
          className={`inline-flex max-w-full rounded-4xl border px-4 py-2 text-[15px] leading-relaxed ${
            isUser
              ? 'border-transparent bg-[#00552b] text-white font-medium'
              : 'border-transparent bg-transparent text-black'
          }`}
        >
          <div className="flex w-full flex-col gap-2">
            {isUser && attachments && attachments.length > 0 && (
              <AttachmentsPreview attachments={attachments} />
            )}
            <div className="markdown prose prose-sm max-w-none text-current prose-headings:text-[#111111] prose-strong:text-[#111111]">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                  pre: ({ children }) => {
                    const codeElement = children as React.ReactElement;
                    const codeProps = codeElement?.props as { className?: string; children?: React.ReactNode };
                    const className = codeProps?.className || '';
                    const language = className.replace('language-', '') || 'text';
                    const value = String(codeProps?.children || '');

                    return <CodeBlock language={language} value={value} />;
                  },
                  code({ inline, className, children, ...props }: MarkdownCodeProps) {
                    if (inline) {
                      return (
                        <code
                          {...props}
                          className="rounded-md bg-black/5 px-1.5 py-0.5 text-[0.92em] text-[#111111]"
                        >
                          {children}
                        </code>
                      );
                    }
                    // For non-inline code, let the pre component handle it
                    return <code {...props} className={className}>{children}</code>;
                  },
                  a: (props) => (
                    <a
                      {...props}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-[#111111] underline underline-offset-4"
                    />
                  ),
                  ul: (props) => <ul {...props} className="list-disc pl-6" />,
                  ol: (props) => <ol {...props} className="list-decimal pl-6" />,
                  img: (props) => <ChatImage {...props} />,
                }}
              >
                {message.content || ' '}
              </ReactMarkdown>
            </div>
          </div>
        </div>
        {/* Speech button for assistant messages (not for generated images) */}
        {!isUser && !isStreaming && message.content && !message.content.includes('![Imagen generada]') && (
          <div className="flex justify-start pl-2">
            <SpeechButton text={message.content} />
          </div>
        )}
      </div>
    </div>
  );
}