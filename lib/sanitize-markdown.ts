/**
 * Sanitize malformed markdown from AI model output.
 *
 * Fixes common issues with bold markers, list delimiters, and punctuation.
 * Uses parity-based ** detection (even index = opening, odd = closing)
 * to correctly distinguish opening from closing markers.
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

  // ── Comprehensive bold marker fixer (parity-based, single pass) ──
  //
  // Builds output left-to-right, using ** index parity to know which
  // marker is opening (even) vs closing (odd). Handles ALL bold issues:
  //   - Remove spaces after opening **:    "** text**"   → "**text**"
  //   - Remove spaces before closing **:   "**text **"   → "**text**"
  //   - Add space before opening **:       "word**text**" → "word **text**"
  //   - Add space after closing **:        "**text**word" → "**text** word"
  //
  const WORD_CHAR = /[a-záéíóúñüA-ZÁÉÍÓÚÑÜ\w:;,.]/;
  const NEEDS_SPACE_AFTER = /[a-záéíóúñüA-ZÁÉÍÓÚÑÜ\w¿¡(\["«]/;

  result = result.replace(/^.*$/gm, (line) => {
    // Find all ** marker positions
    const markers: number[] = [];
    let si = 0;
    while (true) {
      const idx = line.indexOf('**', si);
      if (idx === -1) break;
      markers.push(idx);
      si = idx + 2;
    }
    if (markers.length < 2) return line;

    // Only process complete pairs (ignore trailing orphaned **)
    const pairEnd = Math.floor(markers.length / 2) * 2;
    let out = '';
    let cursor = 0;

    for (let i = 0; i < pairEnd; i++) {
      const pos = markers[i];
      const isOpening = i % 2 === 0;

      if (isOpening) {
        // ── Opening ** ──
        let textBefore = line.slice(cursor, pos);

        // Add space before ** if last char is a word char / punctuation
        if (textBefore.length > 0 && WORD_CHAR.test(textBefore[textBefore.length - 1])) {
          textBefore += ' ';
        }
        out += textBefore;

        // Emit **
        out += '**';
        cursor = pos + 2;

        // Skip whitespace after opening ** (fixes "** text**" → "**text**")
        while (cursor < line.length && (line[cursor] === ' ' || line[cursor] === '\t')) {
          cursor++;
        }
      } else {
        // ── Closing ** ──
        // Emit text before closing **, trimming trailing whitespace
        // (fixes "**text **" → "**text**")
        let textBefore = line.slice(cursor, pos);
        textBefore = textBefore.replace(/[ \t]+$/, '');
        out += textBefore;

        // Emit **
        out += '**';
        cursor = pos + 2;

        // Add space after ** if followed by word char / opening punctuation
        if (cursor < line.length && NEEDS_SPACE_AFTER.test(line[cursor])) {
          out += ' ';
        }
      }
    }

    // Emit remaining text (including any orphaned ** markers)
    out += line.slice(cursor);
    return out;
  });

  // ── Remove orphaned ** that split words ──

  // When a line has an odd number of ** markers, one is orphaned (unpaired).
  // If that orphan sits between word characters (splitting a word), remove it.
  // e.g. "**autoriza expresamente** al**bacea" → "**autoriza expresamente** albacea"
  result = result.replace(/^.*$/gm, (line) => {
    const markerCount = line.split('**').length - 1;
    if (markerCount === 0 || markerCount % 2 === 0) return line;
    return line.replace(
      /([a-záéíóúñüA-ZÁÉÍÓÚÑÜ\w])\*\*([a-záéíóúñüA-ZÁÉÍÓÚÑÜ\w])/,
      '$1$2',
    );
  });

  // ── Normalize list delimiters ──

  // Lines starting with "N)" → "N."
  result = result.replace(/^(\d+)\)\s*/gm, '$1. ');

  // Inline "N)" merged into previous line → split onto new line
  result = result.replace(/([.!?:;])\s+(\d+)\)\s*/g, '$1\n$2. ');

  // ── Fix punctuation spacing ──

  // Remove extra spaces before punctuation
  result = result.replace(/ +([,;.!?:])/g, '$1');

  // Ensure space after comma/semicolon when followed by a letter
  result = result.replace(/([,;])([a-záéíóúñüA-ZÁÉÍÓÚÑÜ])/gi, '$1 $2');

  // ── Restore preserved blocks ──
  result = result.replace(/\x00(\d+)\x00/g, (_, i) => preserved[Number(i)]);

  return result;
}
