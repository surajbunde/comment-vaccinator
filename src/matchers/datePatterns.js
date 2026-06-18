/**
 * @fileoverview Date pattern definitions and matcher.
 * This module has NO browser API dependencies — it is importable in Node.js.
 */

/**
 * Ordered list of regex patterns that identify date-like text.
 * Each entry is a named object so test output is readable.
 * @type {Array<{name: string, pattern: RegExp}>}
 */
export const DATE_PATTERNS = [
  // --- English relative dates ---
  {
    name: "relative-en",
    pattern: /\b(?:today|tonight|yesterday|tomorrow|this\s+(?:day|week|month|year)|right\s+now|just\s+now|an?\s+hour\s+ago|\d+\s+(?:second|minute|hour|day|week|month|year)s?\s+ago)\b/i,
  },
  // --- English days of week ---
  {
    name: "day-of-week",
    pattern: /\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
  },
  // --- English month + day formats ---
  {
    name: "month-day-en",
    pattern: /\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?(?:,\s*\d{2,4})?\b/i,
  },
  {
    name: "day-month-en",
    pattern: /\b\d{1,2}(?:st|nd|rd|th)?\s+(?:of\s+)?(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)(?:\s+\d{2,4})?\b/i,
  },
  {
    name: "day-month-en-compact",
    pattern: /(?:^|[^a-z0-9])\d{1,2}(?:st|nd|rd|th)?\s*(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)(?:\s+\d{2,4})?\b/i,
  },
  // --- English month + year ---
  {
    name: "month-year-en",
    pattern: /\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{4}\b/i,
  },
  {
    name: "year-month-en",
    pattern: /\b\d{4}\s+(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/i,
  },
  // --- Numeric date formats ---
  {
    name: "numeric-dmy",
    pattern: /\b\d{1,2}\s*[\/.-]\s*\d{1,2}(?:\s*[\/.-]\s*(?:\d{2}|\d{4}))\b/,
  },
  {
    name: "numeric-ymd",
    pattern: /\b(?:19|20)\d{2}\s*[\/.-]\s*\d{1,2}\s*[\/.-]\s*\d{1,2}\b/,
  },
  // --- Hindi / Devanagari dates ---
  {
    name: "devanagari-day-month",
    pattern: /(?:^|[^\p{L}\p{N}_])(?:\d{1,2}|[०-९]{1,2})\s*(?:जनवरी|फ़रवरी|फरवरी|मार्च|अप्रैल|एप्रिल|मई|मे|जून|जुलै|जुलाई|अगस्त|ऑगस्ट|सितंबर|सितम्बर|सप्टेंबर|अक्टूबर|ऑक्टोबर|नवंबर|नवम्बर|नोव्हेंबर|दिसंबर|दिसम्बर|डिसेंबर)(?:\s*(?:\d{2,4}|[०-९]{2,4}))?/iu,
  },
  {
    name: "devanagari-month-day",
    pattern: /(?:^|[^\p{L}\p{N}_])(?:जनवरी|फ़रवरी|फरवरी|मार्च|अप्रैल|एप्रिल|मई|मे|जून|जुलै|जुलाई|अगस्त|ऑगस्ट|सितंबर|सितम्बर|सप्टेंबर|अक्टूबर|ऑक्टोबर|नवंबर|नवम्बर|नोव्हेंबर|दिसंबर|दिसम्बर|डिसेंबर)\s*(?:\d{1,2}|[०-९]{1,2})(?:\s*(?:\d{2,4}|[०-९]{2,4}))?/iu,
  },
  // --- Contextual date phrases ---
  {
    name: "anyone-today",
    pattern: /\banyone\s+today\b/i,
  },
  {
    name: "anyone-watching",
    pattern: /\banyone\s+watching(?:\s+(?:in|on)\s+(?:\d{2,4}|today|tonight|yesterday|tomorrow))?\b/i,
  },
  {
    name: "anyone-here-date",
    pattern: /\banyone\s+here\s+(?:in|on)\s+(?:\d{2,4}|today|tonight|yesterday|tomorrow)\b/i,
  },
  // --- Short month abbreviations ---
  {
    name: "short-month-day",
    pattern: /\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)(?:uary|ruary|ch|il|e|y|ust|tember|ober|ember)?/i,
  },
];

/**
 * Returns true if the comment text matches any date pattern.
 * @param {string} text - Raw comment text.
 * @returns {{ matched: boolean, patternName: string | null }}
 */
export function matchesDate(text) {
  const normalized = text.replace(/\s+/g, " ").trim();
  for (const { name, pattern } of DATE_PATTERNS) {
    if (pattern.test(normalized)) {
      return { matched: true, patternName: name };
    }
  }
  return { matched: false, patternName: null };
}
