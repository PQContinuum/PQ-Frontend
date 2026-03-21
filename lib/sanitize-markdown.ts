/**
 * Sanitize malformed markdown from AI model output.
 *
 * Fixes common issues:
 * - Duplicate text after bold markers: **text**text → **text**
 * - Unclosed bold with duplicated text:  **texttext  → **text**
 * - Missing space after closing bold:    **text**word → **text** word
 * - Space before punctuation:            word ,next  → word, next
 * - Missing space after punctuation:     word,next   → word, next
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

  // 1. Bold text followed immediately by the same text (closed bold + duplicate)
  //    e.g. "**no cumplió**no cumplió" → "**no cumplió**"
  result = result.replace(/\*\*(.+?)\*\*\1/g, '**$1**');

  // 2. Unclosed bold with duplicated content (no closing **)
  //    e.g. "**no cumplióno cumplió" → "**no cumplió**"
  result = result.replace(/\*\*([^*\n]{3,}?)\1/g, '**$1**');

  // 3. Italic text followed immediately by the same text
  //    e.g. "*texto*texto" → "*texto*"
  result = result.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)\1/g, '*$1*');

  // 4. Space after closing bold when immediately followed by a word character
  //    e.g. "**texto**palabra" → "**texto** palabra"
  //    Require content to start with a non-space to avoid matching across bold pairs
  //    (e.g. "**a** o **b**" should NOT match "** o **" as bold content)
  result = result.replace(
    /\*\*([^\s*][^*]*?)\*\*(?=[a-záéíóúñüA-ZÁÉÍÓÚÑÜ\w])/g,
    '**$1** ',
  );

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
