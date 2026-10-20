/**
 * @fileoverview Detects contact details (email, phone, Telegram/WhatsApp).
 * This module has NO browser API dependencies — it is importable in Node.js.
 */

/**
 * Email address.
 * @type {RegExp}
 */
const EMAIL = /\b[a-z0-9._%+-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}\b/i;

/**
 * Phone number with an explicit international prefix.
 * @type {RegExp}
 */
const PHONE_INTL = /\+\d[\d\s().-]{6,17}\d/;

/**
 * Phone number written with a leading zero (national form).
 * @type {RegExp}
 */
const PHONE_LEADING_ZERO = /\b0\d[\d\s.-]{7,15}\d/;

/**
 * Candidate digit run — validated further before it counts as a phone number.
 * @type {RegExp}
 */
const DIGIT_CANDIDATE = /\b\d[\d\s.-]*\d\b/g;

/**
 * Telegram / WhatsApp link.
 * @type {RegExp}
 */
const MESSENGER_LINK = /\b(?:t|telegram|wa|whatsapp|chat)\.(?:me|co)\/\S+/i;

/**
 * Telegram / WhatsApp mention followed by a handle or a number.
 * @type {RegExp}
 */
const MESSENGER =
  /\b(?:telegram|tg|whatsapp|wa)\b\s*(?:id|number|no\.?|on|me|:)?\s*(?:@+[a-z0-9_]{4,}|[+\d][\d\s.-]{5,})/i;

/**
 * Counts the digits in a string.
 * @param {string} s
 * @returns {number}
 */
function digitCount(s) {
  return (s.match(/\d/g) || []).length;
}

/**
 * Returns true when the candidate looks like a list of years rather than a phone number.
 * @param {string} candidate
 * @returns {boolean}
 */
function isYearList(candidate) {
  return /^(?:\d{4}[\s.-])+\d{4}$/.test(candidate.trim());
}

/**
 * Decides whether a digit run looks like a phone number.
 * Bare digit runs (no separators) never qualify, so order numbers and dates stay visible.
 * @param {string} candidate
 * @returns {boolean}
 */
function looksLikePhone(candidate) {
  const digits = digitCount(candidate);
  if (digits < 9 || digits > 15) return false;
  if (!/[\s.-]/.test(candidate)) return false;
  if (isYearList(candidate)) return false;

  const groups = candidate.trim().split(/[\s.-]+/).filter(Boolean);
  if (groups.length < 2 || groups.length > 4) return false;
  return groups.every((g) => g.length <= 5);
}

/**
 * Returns whether the comment contains contact details.
 * @param {string} text - Raw comment text.
 * @returns {{ matched: boolean, kind: string|null, value: string|null }}
 */
export function matchesContacts(text) {
  if (!text) return { matched: false, kind: null, value: null };

  const email = text.match(EMAIL);
  if (email) return { matched: true, kind: "email", value: email[0] };

  const intl = text.match(PHONE_INTL);
  if (intl) return { matched: true, kind: "phone", value: intl[0].trim() };

  const leadingZero = text.match(PHONE_LEADING_ZERO);
  if (leadingZero) return { matched: true, kind: "phone", value: leadingZero[0].trim() };

  DIGIT_CANDIDATE.lastIndex = 0;
  let m;
  while ((m = DIGIT_CANDIDATE.exec(text)) !== null) {
    if (looksLikePhone(m[0])) {
      return { matched: true, kind: "phone", value: m[0].trim() };
    }
  }

  const messengerLink = text.match(MESSENGER_LINK);
  if (messengerLink) {
    return { matched: true, kind: "messenger", value: messengerLink[0].trim() };
  }

  const messenger = text.match(MESSENGER);
  if (messenger) return { matched: true, kind: "messenger", value: messenger[0].trim() };

  return { matched: false, kind: null, value: null };
}
