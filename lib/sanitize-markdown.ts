/**
 * Sanitize malformed markdown from AI model output.
 *
 * Fixes common issues:
 * - Spaces inside bold markers:          ** text**    → **text**
 * - Duplicate text after bold markers:   **text**text → **text**
 * - Unclosed bold with duplicated text:  **texttext   → **text**
 * - Missing space after closing bold:    **text**word → **text** word
 * - Space before punctuation:            word ,next   → word, next
 * - Missing space after punctuation:     word,next    → word, next
 *
 * Uses pair-matching instead of lookbehinds for reliable cross-engine
 * support.  The content pattern `(?:[^*]|\*(?!\*))` allows a single `*`
 * inside bold content but prevents matching across separate bold pairs.
 */
export function sanitizeMarkdown(text: string): string {
  if (!text) return text;

  // ── Preserve code blocks & inline code from processing ──
  const preserved: string[] = [];
  let result = text
    .replace(/```[\s\S]*?```/g, (m) => {
      preserved.push(m);
      return `\x00${preserved.length - 1}\x00`;
    })
    .replace(/`[^`]+`/g, (m) => {
      preserved.push(m);
      return `\x00${preserved.length - 1}\x00`;
    });

  // ── Fix spaces inside bold markers (pair-matching approach) ──

  // 0a. Remove leading spaces after opening **:  "** text**" → "**text**"
  //     Anchor: start-of-line or whitespace/punctuation before the opening **.
  //     Content: one or more chars that are NOT "**" (single * is fine).
  //     Captures the anchor so it is re-emitted without being consumed.
  result = result.replace(
    /(^|[\s,;:.!?({\[>])\*\* +((?:[^*]|\*(?!\*))+?)\*\*/gm,
    '$1**$2**',
  );

  // 0b. Remove trailing spaces before closing **:  "**text **" → "**text**"
  result = result.replace(
    /(^|[\s,;:.!?({\[>])\*\*((?:[^*]|\*(?!\*))+?) +\*\*/gm,
    '$1**$2**',
  );

  // ── Fix duplicate text around bold markers ──

  // 1. Bold text followed immediately by the same text (closed bold + duplicate)
  //    e.g. "**no cumplió**no cumplió" → "**no cumplió**"
  result = result.replace(/\*\*(.+?)\*\*\1/g, '**$1**');

  // 2. Unclosed bold with duplicated content (no closing **)
  //    e.g. "**no cumplióno cumplió" → "**no cumplió**"
  result = result.replace(/\*\*([^*\n]{3,}?)\1/g, '**$1**');

  // 3. Italic text followed immediately by the same text
  //    e.g. "*texto*texto" → "*texto*"
  result = result.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)\1/g, '*$1*');

  // ── Fix spacing around bold markers ──

  // 4. Space after closing bold when immediately followed by a word character
  //    e.g. "**texto**palabra" → "**texto** palabra"
  //    Require content to start with a non-space to avoid matching across bold pairs
  result = result.replace(
    /\*\*([^\s*][^*]*?)\*\*(?=[a-záéíóúñüA-ZÁÉÍÓÚÑÜ\w])/g,
    '**$1** ',
  );

  // ── Fix punctuation spacing ──

  // 5. Remove extra spaces before punctuation
  //    e.g. "word ,next" → "word,next"  (step 6 will add the space after)
  result = result.replace(/ +([,;.!?:])/g, '$1');

  // 6. Ensure single space after comma/semicolon when followed by a letter
  //    e.g. ",impugnable" → ", impugnable"
  result = result.replace(/([,;])([a-záéíóúñüA-ZÁÉÍÓÚÑÜ])/gi, '$1 $2');

  // ── Restore preserved blocks ──
  result = result.replace(/\x00(\d+)\x00/g, (_, i) => preserved[Number(i)]);

  return result;
}
