'use client';

import React from 'react';
import { MathJax, MathJaxContext } from 'better-react-mathjax';

/**
 * MathJax config (TeX input).
 *
 * Notes:
 * - Loads the AMS TeX package for environments like align, cases, matrices, etc.
 * - Enables common delimiters:
 *   - Inline: $...$ and \(...\)
 *   - Display: $$...$$ and \[...\]
 * - Skips code/pre blocks so we don't typeset inside Markdown code fences.
 */
const MATHJAX_CONFIG = {
  loader: { load: ['[tex]/ams'] },
  tex: {
    packages: { '[+]': ['ams'] },
    inlineMath: [['$', '$'], ['\\(', '\\)']],
    displayMath: [['$$', '$$'], ['\\[', '\\]']],
  },
  options: {
    skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
  },
} as const;

export type MathProviderProps = {
  /** Wrap the subtree that contains any math content. */
  children: React.ReactNode;
};

/**
 * MathProvider
 *
 * Wrap this once around the part of the app that renders math.
 * The library recommends using a single <MathJaxContext> in your app.
 */
export function MathProvider({ children }: MathProviderProps) {
  return <MathJaxContext config={MATHJAX_CONFIG}>{children}</MathJaxContext>;
}

export type MathContentProps = {
  /** Any React subtree that may contain TeX delimiters ($$...$$, $...$, etc.). */
  children: React.ReactNode;
  /**
   * When true, re-typesets when children change.
   * Tip: for streaming responses, you can render without MathContent while streaming
   * and mount MathContent when streaming ends.
   */
  dynamic?: boolean;
};

/**
 * MathContent
 *
 * Wrap existing rendered content (e.g. Markdown output) so MathJax can typeset
 * expressions written with TeX delimiters.
 */
export function MathContent({ children, dynamic = true }: MathContentProps) {
  return (
    <MathJax dynamic={dynamic} hideUntilTypeset="first">
      {children}
    </MathJax>
  );
}

export type MathRendererProps = {
  /** LaTeX expression WITHOUT delimiters. Example: "E = mc^2" */
  latex: string;
  /** When true, renders inline math (\(...\)). Default is display math (\[...\]). */
  inline?: boolean;
  /** Optional wrapper className for styling. */
  className?: string;
};

/**
 * MathRenderer
 *
 * Renders a single LaTeX expression using MathJax.
 *
 * Requirements:
 * - Must be rendered under <MathProvider> (or any <MathJaxContext>)
 */
export function MathRenderer({ latex, inline = false, className }: MathRendererProps) {
  // MathJax scans text nodes for delimiters, so we add them here.
  const tex = inline ? `\\(${latex}\\)` : `\\[${latex}\\]`;

  return (
    <MathJax dynamic hideUntilTypeset="first">
      {/* Wrapper element allows styling while keeping TeX as text content. */}
      <span className={className}>{tex}</span>
    </MathJax>
  );
}
