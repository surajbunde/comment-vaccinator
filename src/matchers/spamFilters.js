/**
 * @fileoverview Composes the spam-signal matchers into a single decision.
 * This module has NO browser API dependencies — it is importable in Node.js.
 */

import { matchesLinks } from "./links.js";
import { matchesContacts } from "./contacts.js";
import { matchesCaps } from "./caps.js";
import { matchesSpamPunctuation } from "./punctuation.js";
import { matchesLocaleDate } from "./dateLocales.js";

/**
 * Default settings for the spam filter pack. Every filter is off by default.
 * @type {Object}
 */
export const DEFAULT_SPAM_SETTINGS = {
  linksEnabled: false,
  linksAllowedDomains: "",
  contactsEnabled: false,
  capsEnabled: false,
  capsMinLength: 15,
  punctuationEnabled: false,
  localesEnabled: false,
};

/**
 * Runs the enabled spam filters against the text.
 * Returns the first hit, or null when nothing matched (or everything is off).
 *
 * @param {string} text - Raw comment text.
 * @param {Object} settings - Spam filter settings.
 * @returns {{hide: boolean, reasonCode: string, reason: string, patternName: string}|null}
 */
export function runSpamFilters(text, settings = DEFAULT_SPAM_SETTINGS) {
  const s = { ...DEFAULT_SPAM_SETTINGS, ...settings };
  if (!text) return null;

  try {
    // Contacts run before links so an email address is reported as a contact
    // rather than as the domain it happens to contain.
    if (s.contactsEnabled) {
      const r = matchesContacts(text);
      if (r.matched) {
        return {
          hide: true,
          reasonCode: "contacts",
          reason: `contact details (${r.kind})`,
          patternName: r.kind,
        };
      }
    }

    if (s.linksEnabled) {
      const r = matchesLinks(text, s.linksAllowedDomains);
      if (r.matched) {
        return {
          hide: true,
          reasonCode: "links",
          reason: `link (${r.hostname})`,
          patternName: "links",
        };
      }
    }

    if (s.capsEnabled) {
      const r = matchesCaps(text, { minLength: s.capsMinLength });
      if (r.matched) {
        return {
          hide: true,
          reasonCode: "caps",
          reason: "all caps",
          patternName: "caps",
        };
      }
    }

    if (s.punctuationEnabled) {
      const r = matchesSpamPunctuation(text);
      if (r.matched) {
        return {
          hide: true,
          reasonCode: "punctuation",
          reason: `spam punctuation (${r.kind})`,
          patternName: r.kind,
        };
      }
    }

    if (s.localesEnabled) {
      const r = matchesLocaleDate(text);
      if (r.matched) {
        return {
          hide: true,
          reasonCode: "locale-date",
          reason: `locale date (${r.patternName})`,
          patternName: r.patternName,
        };
      }
    }
  } catch (_) {
    return null;
  }

  return null;
}
