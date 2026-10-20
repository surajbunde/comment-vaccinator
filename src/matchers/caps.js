/**
 * @fileoverview All-caps / shouting detection.
 * This module has NO browser API dependencies — it is importable in Node.js.
 */

/** Default minimum number of letters before the rule applies. */
export const DEFAULT_MIN_LETTERS = 15;

/** Share of words that must be fully uppercase. */
const CAPS_WORD_RATIO = 0.8;

/** Minimum number of fully uppercase words required. */
const MIN_CAPS_WORDS = 3;

/**
 * Splits text into words with surrounding punctuation removed.
 * @param {string} text
 * @returns {string[]}
 */
function splitWords(text) {
  return text
    .split(/\s+/)
    .map((w) => w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ""))
    .filter(Boolean);
}

/**
 * Returns whether a word contains no lowercase letters.
 * @param {string} word
 * @returns {boolean}
 */
function isAllCaps(word) {
  return word.length >= 2 && !/\p{Ll}/u.test(word);
}

/**
 * Returns whether the comment is written in all caps.
 * @param {string} text - Raw comment text.
 * @param {{minLength?: number}} options
 * @returns {{ matched: boolean, uppercaseWords: number, wordCount: number }}
 */
export function matchesCaps(text, options = {}) {
  const minLength = options.minLength ?? DEFAULT_MIN_LETTERS;
  if (!text) return { matched: false, uppercaseWords: 0, wordCount: 0 };

  const letters = text.match(/\p{L}/gu) || [];
  if (letters.length < minLength) {
    return { matched: false, uppercaseWords: 0, wordCount: 0 };
  }

  const words = splitWords(text).filter((w) => w.length >= 2);
  const uppercaseWords = words.filter(isAllCaps).length;

  if (uppercaseWords < MIN_CAPS_WORDS) {
    return { matched: false, uppercaseWords, wordCount: words.length };
  }
  if (words.length === 0 || uppercaseWords / words.length < CAPS_WORD_RATIO) {
    return { matched: false, uppercaseWords, wordCount: words.length };
  }

  return { matched: true, uppercaseWords, wordCount: words.length };
}
