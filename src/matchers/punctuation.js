/**
 * @fileoverview Spam punctuation and repetition detection.
 * This module has NO browser API dependencies — it is importable in Node.js.
 */

/**
 * Repeated punctuation: 3+ "!", 3+ "?", or 4+ ".".
 * @type {RegExp}
 */
const REPEATED_PUNCTUATION = /!{3,}|\?{3,}|\.{4,}/;

/**
 * The same character repeated 3+ times (dots and punctuation excluded).
 * @type {RegExp}
 */
const REPEATED_CHAR = /([^\s.!?])\1{2,}/;

/**
 * A word of 4+ characters repeated back to back.
 * @type {RegExp}
 */
const REPEATED_WORD = /\b([a-z0-9]{4,})(?:\s+\1)+\b/i;

/**
 * Three or more single letters separated by spaces.
 * @type {RegExp}
 */
const SPACED_LETTERS = /\b(?:[a-z]\s){3,}[a-z]\b/i;

/**
 * Doubled words that are legitimate in English.
 * @type {Set<string>}
 */
const LEGIT_DOUBLES = new Set([
  "that", "this", "will", "been", "they", "them", "with", "from", "just",
  "like", "some", "what", "your", "when", "then", "than", "into", "over",
  "such", "only", "also", "even", "much", "very", "yeah", "good", "well",
  "best", "done", "said", "still", "here", "does", "was", "were", "had",
  "who", "why", "how", "all", "can", "get", "got", "not", "but", "for",
]);

/**
 * Returns whether the comment shows spam punctuation or repetition.
 * @param {string} text - Raw comment text.
 * @returns {{ matched: boolean, kind: string|null }}
 */
export function matchesSpamPunctuation(text) {
  if (!text) return { matched: false, kind: null };

  if (REPEATED_PUNCTUATION.test(text)) {
    return { matched: true, kind: "repeated-punctuation" };
  }
  if (REPEATED_CHAR.test(text)) {
    return { matched: true, kind: "repeated-character" };
  }

  const wordMatch = text.match(REPEATED_WORD);
  if (wordMatch && !LEGIT_DOUBLES.has(wordMatch[1].toLowerCase())) {
    return { matched: true, kind: "repeated-word" };
  }

  if (SPACED_LETTERS.test(text)) {
    return { matched: true, kind: "spaced-letters" };
  }

  return { matched: false, kind: null };
}
