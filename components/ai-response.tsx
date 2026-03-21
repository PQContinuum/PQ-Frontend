'use client';

import React, { useMemo, useState, type ComponentPropsWithoutRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

import { MathContent } from '@/components/math-renderer';
import { WebResults } from '@/components/web-results';
import { sanitizeMarkdown } from '@/lib/sanitize-markdown';
import type { WebSearchResult } from '@/types/websearch';

type MarkdownCodeProps = ComponentPropsWithoutRef<'code'> & {
  inline?: boolean;
  className?: string;
};

function normalizeMathDelimiters(markdown: string): string {
  const fenceParts = markdown.split(/```/);
  const normalizedFenceParts = fenceParts.map((part, fenceIndex) => {
    if (fenceIndex % 2 === 1) return part;

    const inlineParts = part.split(/`/);
    return inlineParts
      .map((inlinePart, inlineIndex) => {
        if (inlineIndex % 2 === 1) return inlinePart;

        const withStandardDelims = inlinePart
          .replace(/\\\[/g, '$$')
          .replace(/\\\]/g, '$$')
          .replace(/\\\(/g, '$')
          .replace(/\\\)/g, '$');

        return withStandardDelims.replace(
          /(^|\n)([ \t]*)\[\s*([\s\S]*?)\s*\](?=\n|$)/g,
          (match, prefix, indent, body) => {
            if (!/\\[A-Za-z]/.test(body)) return match;
            return `${prefix}${indent}$$${body}$$`;
          }
        );
      })
      .join('`');
  });

  return normalizedFenceParts.join('```');
}

function CitationSup({
  index,
  href,
}: {
  index: number;
  href?: string;
}) {
  const label = String(index);
  const content = (
    <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-md border border-black/10 bg-white px-1.5 py-0.5 text-[11px] font-semibold text-[#934f2c] hover:bg-black/5">
      {label}
    </span>
  );

  return (
    <sup className="ml-1 align-super leading-none">
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`Open source ${index}`}>
          {content}
        </a>
      ) : (
        content
      )}
    </sup>
  );
}

function splitTextWithCitations(text: string, citations: WebSearchResult[]): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const re = /\[\[(\d+)\]\]|\[(\d+)\]/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    const start = match.index;
    if (start > lastIndex) {
      parts.push(text.slice(lastIndex, start));
    }

    const raw = match[1] ?? match[2];
    const n = raw ? Number.parseInt(raw, 10) : NaN;
    if (Number.isFinite(n) && n >= 1) {
      const citation = citations[n - 1];
      parts.push(
        <CitationSup
          key={`cite-${start}-${n}`}
          index={n}
          href={citation?.url}
        />
      );
    } else {
      parts.push(match[0]);
    }

    lastIndex = start + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

function injectCitations(node: React.ReactNode, citations: WebSearchResult[]): React.ReactNode {
  if (typeof node === 'string') {
    return splitTextWithCitations(node, citations);
  }

  if (Array.isArray(node)) {
    return node.map((child, i) => (
      <React.Fragment key={(child as { key?: string } | null)?.key ?? i}>
        {injectCitations(child, citations)}
      </React.Fragment>
    ));
  }

  if (React.isValidElement(node)) {
    // Avoid transforming inside code blocks.
    if (node.type === 'code' || node.type === 'pre') {
      return node;
    }

    const children = (node.props as { children?: React.ReactNode }).children;
    if (!children) return node;

    return React.cloneElement(node, undefined, injectCitations(children, citations));
  }

  return node;
}

function copyToClipboard(text: string) {
  return navigator.clipboard.writeText(text).catch(() => undefined);
}

function CodeBlock({ language, value }: { language: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await copyToClipboard(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="group relative max-w-full overflow-hidden">
      <button
        type="button"
        onClick={handleCopy}
        className="absolute right-3 top-3 rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-medium text-[#111111] opacity-0 shadow-sm transition group-hover:opacity-100 z-10"
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
      <pre className="overflow-x-auto rounded-2xl border border-black/10 bg-[#f7f7f7] p-4 text-sm text-[#111111] max-w-full">
        <code className={`language-${language} whitespace-pre-wrap break-all`}>{value}</code>
      </pre>
    </div>
  );
}

export type AIResponseProps = {
  content: string;
  citations?: WebSearchResult[] | null;
  isStreaming?: boolean;
  className?: string;
};

export function AIResponse({
  content,
  citations,
  isStreaming = false,
  className,
}: AIResponseProps) {
  const normalized = useMemo(() => normalizeMathDelimiters(sanitizeMarkdown(content || ' ')), [content]);
  const hasCitations = !!citations && citations.length > 0;

  const markdown = (
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
                className="rounded-md bg-black/5 px-1.5 py-0.5 text-[0.92em] text-[#111111] font-medium"
              >
                {children}
              </code>
            );
          }
          return (
            <code {...props} className={className}>
              {children}
            </code>
          );
        },
        a: ({ children, ...props }) => (
          <a
            {...props}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[#934f2c] underline underline-offset-2 hover:text-[#d9753e] transition-colors break-words"
          >
            {children}
          </a>
        ),
        // Inject citations into common text containers (avoids code/pre via injectCitations guard).
        p: ({ children, ...props }) => (
          <p {...props}>{hasCitations ? injectCitations(children, citations!) : children}</p>
        ),
        li: ({ children, ...props }) => (
          <li {...props}>{hasCitations ? injectCitations(children, citations!) : children}</li>
        ),
        blockquote: ({ children, ...props }) => (
          <blockquote {...props} className="border-l-4 border-black/10 pl-4 italic text-[#111111]/80">
            {hasCitations ? injectCitations(children, citations!) : children}
          </blockquote>
        ),
        h1: ({ children, ...props }) => (
          <h1 {...props}>{hasCitations ? injectCitations(children, citations!) : children}</h1>
        ),
        h2: ({ children, ...props }) => (
          <h2 {...props}>{hasCitations ? injectCitations(children, citations!) : children}</h2>
        ),
        h3: ({ children, ...props }) => (
          <h3 {...props}>{hasCitations ? injectCitations(children, citations!) : children}</h3>
        ),
        h4: ({ children, ...props }) => (
          <h4 {...props}>{hasCitations ? injectCitations(children, citations!) : children}</h4>
        ),
        h5: ({ children, ...props }) => (
          <h5 {...props}>{hasCitations ? injectCitations(children, citations!) : children}</h5>
        ),
        h6: ({ children, ...props }) => (
          <h6 {...props}>{hasCitations ? injectCitations(children, citations!) : children}</h6>
        ),
      }}
    >
      {normalized}
    </ReactMarkdown>
  );

  return (
    <div className={className}>
      {isStreaming ? markdown : <MathContent>{markdown}</MathContent>}
      {hasCitations && <WebResults results={citations!} />}
    </div>
  );
}

