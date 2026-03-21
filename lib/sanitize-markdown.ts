/**
 * Sanitize malformed markdown from AI model output.
 *
 * Fixes common issues:
 * - Spaces inside bold markers:          ** text**    → **text**
 * - Duplicate text after bold markers:   **text**text → **text**
 * - Unclosed bold with duplicated text:  **texttext   → **text**
 * - Missing space before opening bold:   word**text** → word **text**
 * - Missing space after closing bold:    **text**word → **text** word
 * - Orphaned ** splitting a word:       al**bacea    → albacea
 * - Space before punctuation:            word ,next   → word, next
 * - Missing space after punctuation:     word,next    → word, next
 * - Paren list delimiter without space:  2)text       → 2. text
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

  // 0a. Remove leading whitespace after opening **:  "** text**" → "**text**"
  //     Anchor: start-of-line or whitespace/punctuation before the opening **.
  //     Content: one or more chars that are NOT "**" (single * is fine).
  //     Captures the anchor so it is re-emitted without being consumed.
  //     Uses [ \t]+ to catch spaces and tabs but NOT newlines (avoids cross-line matching).
  result = result.replace(
    /(^|[\s,;:.!?({\[>])\*\*[ \t]+((?:[^*]|\*(?!\*))+?)\*\*/gm,
    '$1**$2**',
  );

  // 0b. Remove trailing whitespace before closing **:  "**text **" → "**text**"
  result = result.replace(
    /(^|[\s,;:.!?({\[>])\*\*((?:[^*]|\*(?!\*))+?)[ \t]+\*\*/gm,
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

  // 3b. Space before opening bold when preceded by a word character or punctuation
  //     Uses pair-matching to only target complete **text** pairs, avoiding
  //     false positives on orphaned ** markers.
  //     e.g. "vendemos**cumplimiento**"  → "vendemos **cumplimiento**"
  //     e.g. "patrón:**B2B**"            → "patrón: **B2B**"
  //     e.g. "tu**margen.**"             → "tu **margen.**"
  //     e.g. "con**5**"                  → "con **5**"
  result = result.replace(
    /([a-záéíóúñüA-ZÁÉÍÓÚÑÜ\w:;,.])\*\*((?:[^*]|\*(?!\*))+?)\*\*/g,
    '$1 **$2**',
  );

  // 3c. Same fix for italic: word*italic* → word *italic*
  //     Only matches single * (not **) using negative lookahead/behind.
  result = result.replace(
    /([a-záéíóúñüA-ZÁÉÍÓÚÑÜ\w:;,.])\*(?!\*)((?:[^*\n])+?)\*(?!\*)/g,
    '$1 *$2*',
  );

  // 4. Space after closing bold when immediately followed by a word character
  //    e.g. "**texto**palabra" → "**texto** palabra"
  //    Require content to start with a non-space to avoid matching across bold pairs.
  //    [^*\n] prevents matching across lines (which would pair the closing **
  //    of one bold section with the opening ** of another on a different line).
  result = result.replace(
    /\*\*([^\s*][^*\n]*?)\*\*(?=[a-záéíóúñüA-ZÁÉÍÓÚÑÜ\w])/g,
    '**$1** ',
  );

  // ── Remove orphaned ** that split words ──

  // 4b. When a line has an odd number of ** markers, one is orphaned (unpaired).
  //     If that orphan sits between word characters (splitting a word), remove it.
  //     e.g. "**autoriza expresamente** al**bacea" → "**autoriza expresamente** albacea"
  //     Only the first mid-word ** is removed (making the count even).
  result = result.replace(/^.*$/gm, (line) => {
    const markerCount = line.split('**').length - 1;
    if (markerCount === 0 || markerCount % 2 === 0) return line;
    // Odd count: remove first ** between word characters
    return line.replace(
      /([a-záéíóúñüA-ZÁÉÍÓÚÑÜ\w])\*\*([a-záéíóúñüA-ZÁÉÍÓÚÑÜ\w])/,
      '$1$2',
    );
  });

  // ── Normalize list delimiters ──

  // 4c. Lines starting with "N)" (paren delimiter) → "N." (dot delimiter)
  //     Also ensures a space after the delimiter so the parser sees a valid list item.
  //     e.g. "2)texto" → "2. texto", "3) texto" → "3. texto"
  result = result.replace(/^(\d+)\)\s*/gm, '$1. ');

  // 4d. Inline "N)" that the model merged into the previous line.
  //     Split onto its own line so the parser sees a new list item.
  //     e.g. "...SLA. 12)Pregunta guía:" → "...SLA.\n12. Pregunta guía:"
  //     e.g. "...después. 5)Narrativo:"  → "...después.\n5. Narrativo:"
  //     Only matches when preceded by sentence-ending punctuation + space.
  result = result.replace(/([.!?:;])\s+(\d+)\)\s*/g, '$1\n$2. ');

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
