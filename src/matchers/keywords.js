/**
 * @fileoverview Keyword blacklist and whitelist matching. No browser API dependencies.
 */

/**
 * Normalises a keyword list from storage (comma-separated string → trimmed array).
 * @param {string} raw - Comma-separated keyword string from storage.
 * @returns {string[]}
 */
export function parseKeywordList(raw) {
  return raw
    .split(",")
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Returns whether the comment matches the blacklist.
 * @param {string} text
 * @param {string[]} blacklist - Normalised lowercase array.
 * @returns {{ matched: boolean, keyword: string | null }}
 */
export function matchesBlacklist(text, blacklist) {
  if (blacklist.length === 0) return { matched: false, keyword: null };
  const lower = text.toLowerCase();
  for (const kw of blacklist) {
    if (lower.includes(kw)) return { matched: true, keyword: kw };
  }
  return { matched: false, keyword: null };
}

/**
 * Returns whether the comment is protected by the whitelist.
 * A whitelisted comment is NEVER hidden, regardless of other filters.
 * @param {string} text
 * @param {string[]} whitelist - Normalised lowercase array.
 * @returns {{ protected: boolean, keyword: string | null }}
 */
export function matchesWhitelist(text, whitelist) {
  if (whitelist.length === 0) return { protected: false, keyword: null };
  const lower = text.toLowerCase();
  for (const kw of whitelist) {
    if (lower.includes(kw)) return { protected: true, keyword: kw };
  }
  return { protected: false, keyword: null };
}
