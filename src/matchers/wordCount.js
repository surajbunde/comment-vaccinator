/**
 * @fileoverview Word-count filter logic. No browser API dependencies.
 */

/**
 * Strips emoji characters, time patterns, and punctuation from a string.
 * Used before word counting to remove noise from low-effort comments.
 * @param {string} text
 * @returns {string}
 */
export function stripEmoji(text) {
  return text
    .replace(
      /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff]|\ufe0e|\ufe0f|\u200d)/g,
      ""
    )
    .replace(/\b\d{1,2}:\d{2}(?:\s*(?:am|pm))?\b/gi, "")
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "")
    .trim();
}

/**
 * Counts whitespace-delimited words in text.
 * @param {string} text
 * @returns {number}
 */
export function countWords(text) {
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}

/**
 * Returns whether a comment should be hidden based on word-count rules.
 * @param {string} text - Raw comment text.
 * @param {{ mode: 'max'|'min'|'off', threshold: number, stripEmoji: boolean }} opts
 * @returns {{ matched: boolean, wordCount: number }}
 */
export function matchesWordCount(text, opts) {
  if (opts.mode === "off") return { matched: false, wordCount: 0 };

  const cleaned = opts.stripEmoji ? stripEmoji(text) : text.trim();
  const wordCount = countWords(cleaned);

  const matched =
    (opts.mode === "max" && wordCount < opts.threshold) ||
    (opts.mode === "min" && wordCount > opts.threshold);

  return { matched, wordCount };
}
