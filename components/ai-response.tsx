'use client';

import React, { useMemo } from 'react';
import { Streamdown } from 'streamdown';
import { code } from '@streamdown/code';
import { createMathPlugin } from '@streamdown/math';

import { WebResults } from '@/components/web-results';
import { sanitizeMarkdown } from '@/lib/sanitize-markdown';
import type { WebSearchResult } from '@/types/websearch';

const math = createMathPlugin({ singleDollarTextMath: true });

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

  const citationComponents = hasCitations ? {
    p: ({ children, ...props }: React.ComponentPropsWithoutRef<'p'>) => (
      <p {...props}>{injectCitations(children, citations!)}</p>
    ),
    li: ({ children, ...props }: React.ComponentPropsWithoutRef<'li'>) => (
      <li {...props}>{injectCitations(children, citations!)}</li>
    ),
    blockquote: ({ children, ...props }: React.ComponentPropsWithoutRef<'blockquote'>) => (
      <blockquote {...props}>{injectCitations(children, citations!)}</blockquote>
    ),
    h1: ({ children, ...props }: React.ComponentPropsWithoutRef<'h1'>) => (
      <h1 {...props}>{injectCitations(children, citations!)}</h1>
    ),
    h2: ({ children, ...props }: React.ComponentPropsWithoutRef<'h2'>) => (
      <h2 {...props}>{injectCitations(children, citations!)}</h2>
    ),
    h3: ({ children, ...props }: React.ComponentPropsWithoutRef<'h3'>) => (
      <h3 {...props}>{injectCitations(children, citations!)}</h3>
    ),
    h4: ({ children, ...props }: React.ComponentPropsWithoutRef<'h4'>) => (
      <h4 {...props}>{injectCitations(children, citations!)}</h4>
    ),
    h5: ({ children, ...props }: React.ComponentPropsWithoutRef<'h5'>) => (
      <h5 {...props}>{injectCitations(children, citations!)}</h5>
    ),
    h6: ({ children, ...props }: React.ComponentPropsWithoutRef<'h6'>) => (
      <h6 {...props}>{injectCitations(children, citations!)}</h6>
    ),
  } : undefined;

  return (
    <div className={className}>
      <Streamdown
        mode={isStreaming ? 'streaming' : 'static'}
        isAnimating={isStreaming}
        plugins={{ code, math }}
        controls={{ code: { copy: true } }}
        parseIncompleteMarkdown={isStreaming}
        lineNumbers={false}
        components={citationComponents}
      >
        {normalized}
      </Streamdown>
      {hasCitations && <WebResults results={citations!} />}
    </div>
  );
}
