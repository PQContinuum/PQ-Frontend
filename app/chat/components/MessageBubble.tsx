'use client';

import { useState, type ComponentPropsWithoutRef } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';

import type { ChatMessage } from '@/app/chat/store';

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

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`message-bubble inline-flex max-w-[min(90%,640px)] rounded-4xl border px-4 py-2 text-[15px] leading-relaxed ${
          isUser
            ? 'border-transparent bg-[#00552b]/30 text-[#00552b] font-medium'
            : 'border-transparent bg-transparent text-black'
        }`}
      >
        <div className="flex w-full flex-col gap-2">
          <div className="markdown prose prose-sm max-w-none text-current prose-headings:text-[#111111] prose-strong:text-[#111111]">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                code({ inline, className, children, ...props }: MarkdownCodeProps) {
                  const language = className?.replace('language-', '') ?? 'text';
                  const value = String(children);
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
                  return <CodeBlock language={language} value={value} />;
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

      <style jsx>{`
        .message-bubble {
          animation: fadeIn 0.25s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
