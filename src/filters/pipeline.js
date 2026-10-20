/**
 * @fileoverview Composes matchers into a single decision function.
 */

import { matchesDate } from "../matchers/datePatterns.js";
import { matchesWordCount } from "../matchers/wordCount.js";
import { matchesBlacklist, matchesWhitelist } from "../matchers/keywords.js";
import { runSpamFilters } from "../matchers/spamFilters.js";

/**
 * @typedef {Object} FilterResult
 * @property {boolean} hide         - True if the comment should be hidden.
 * @property {string}  reasonCode   - Stable machine-readable reason (empty if visible).
 * @property {string}  reason       - Human-readable reason for hiding (empty if visible).
 * @property {string}  patternName  - Which specific pattern/keyword triggered (empty if none).
 */

/**
 * Runs a comment through the full filter pipeline.
 * Whitelist always wins — a whitelisted comment is never hidden.
 *
 * @param {string} text - The raw comment text.
 * @param {import('../storage/settingsCache.js').Settings} settings
 * @returns {FilterResult}
 */
export function runPipeline(text, settings) {
  // 1. Whitelist check — always first, always wins.
  if (settings.whitelist.length > 0) {
    const wl = matchesWhitelist(text, settings.whitelist);
    if (wl.protected) {
      return { hide: false, reasonCode: "whitelist", reason: "", patternName: "" };
    }
  }

  // 2. Emoji-only check.
  if (settings.emojiOnlyEnabled) {
    const emojiRegex =
      /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff]|\ufe0e|\ufe0f|\u200d)/g;
    const stripped = text.replace(emojiRegex, "").replace(/\s+/g, "").trim();
    if (stripped.length === 0) {
      return {
        hide: true,
        reasonCode: "emoji-only",
        reason: "emoji only",
        patternName: "emoji-only",
      };
    }
  }

  // 3. Keyword blacklist.
  if (settings.keywordEnabled && settings.blacklist.length > 0) {
    const kw = matchesBlacklist(text, settings.blacklist);
    if (kw.matched) {
      return {
        hide: true,
        reasonCode: "keyword",
        reason: "keyword blacklist",
        patternName: kw.keyword,
      };
    }
  }

  // 4. Spam filter pack (links, contacts, all-caps, punctuation, locale dates).
  const spam = runSpamFilters(text, settings.spamFilters);
  if (spam) {
    return {
      hide: spam.hide,
      reasonCode: spam.reasonCode,
      reason: spam.reason,
      patternName: spam.patternName,
    };
  }

  // 5. Date pattern filter.
  if (settings.dateFilterEnabled) {
    const dt = matchesDate(text);
    if (dt.matched) {
      return {
        hide: true,
        reasonCode: "date",
        reason: "date pattern",
        patternName: dt.patternName,
      };
    }
  }

  // 6. Custom patterns.
  if (settings.customPatternsEnabled && settings.customPatterns.length > 0) {
    for (const { name, pattern } of settings.customPatterns) {
      if (pattern.test(text)) {
        return {
          hide: true,
          reasonCode: "custom-pattern",
          reason: "custom pattern",
          patternName: name,
        };
      }
    }
  }

  // 7. Word-count filter.
  if (settings.wordCountMode !== "off") {
    const wc = matchesWordCount(text, {
      mode: settings.wordCountMode,
      threshold: settings.wordCountValue,
      stripEmoji: settings.stripEmoji,
    });
    if (wc.matched) {
      return {
        hide: true,
        reasonCode: "word-count",
        reason: `word count (${wc.wordCount} words, mode: ${settings.wordCountMode} ${settings.wordCountValue})`,
        patternName: "word-count",
      };
    }
  }

  return { hide: false, reasonCode: "", reason: "", patternName: "" };
}
