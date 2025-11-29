'use client';

import { useState, type ComponentPropsWithoutRef, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';

import type { ChatMessage } from '@/app/chat/store';
import { GeoCulturalResponse } from './GeoCulturalResponse';

import 'highlight.js/styles/github.css';

type MessageBubbleProps = {
  message: ChatMessage;
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

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  const { geoCulturalData, isLoadingGeoCultural } = useMemo(() => {
    if (isUser || !message.content) return { geoCulturalData: null, isLoadingGeoCultural: false };

    const trimmedContent = message.content.trim();
    const looksLikeJSON = trimmedContent.startsWith('{');

    if (looksLikeJSON) {
      try {
        const parsed = JSON.parse(trimmedContent);
        // FIX: Check for the new response structure
        if (parsed.reply && parsed.places && parsed.userCoords) {
          return { geoCulturalData: parsed, isLoadingGeoCultural: false };
        }
      } catch {
        return { geoCulturalData: null, isLoadingGeoCultural: true };
      }
    }

    return { geoCulturalData: null, isLoadingGeoCultural: false };
  }, [message.content, isUser]);

  if (isLoadingGeoCultural) {
    return (
      <div className="flex justify-start w-full">
        <div className="inline-flex max-w-full w-full rounded-4xl border border-transparent bg-transparent text-black px-4 py-2">
          <div className="space-y-6 w-full">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-[#e8e8e8] rounded w-3/4"></div>
              <div className="h-4 bg-[#e8e8e8] rounded w-1/2"></div>
            </div>
            <div className="relative overflow-hidden rounded-2xl border border-black/10 shadow-lg h-64 bg-gradient-to-br from-[#f6f6f6] via-[#e8e8e8] to-[#f6f6f6] animate-pulse">
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-2">
                  <svg className="size-8 text-[#00552b]/30 mx-auto animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-sm text-[#4c4c4c]/50 font-medium">Preparando recomendaciones...</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-5 bg-[#e8e8e8] rounded w-48 animate-pulse"></div>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-xl border border-black/10 bg-gradient-to-br from-white to-[#f6f6f6] p-4 animate-pulse">
                    <div className="space-y-2">
                      <div className="h-5 bg-[#e8e8e8] rounded w-2/3"></div>
                      <div className="h-4 bg-[#e8e8e8] rounded w-full"></div>
                      <div className="h-4 bg-[#e8e8e8] rounded w-4/5"></div>
                      <div className="flex gap-2 pt-2">
                        <div className="h-6 bg-[#e8e8e8] rounded-full w-20"></div>
                        <div className="h-6 bg-[#e8e8e8] rounded-full w-20"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
      <div
        className={`inline-flex max-w-full rounded-4xl border px-4 py-2 text-[15px] leading-relaxed ${
          isUser
            ? 'border-transparent bg-[#00552b] text-white font-medium'
            : 'border-transparent bg-transparent text-black'
        }`}
      >
        <div className="flex w-full flex-col gap-2">
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
              }}
            >
              {message.content || ' '}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}
