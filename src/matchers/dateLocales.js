/**
 * @fileoverview Date patterns for extra locales (ES, FR, DE, PT, RU).
 * Kept separate from datePatterns.js so the new locales are opt-in and do not
 * change the behaviour of the existing date filter.
 * This module has NO browser API dependencies — it is importable in Node.js.
 */

/**
 * Ordered list of locale-specific date regexes.
 * @type {Array<{name: string, pattern: RegExp}>}
 */
export const LOCALE_DATE_PATTERNS = [
  // --- Spanish ---
  {
    name: "es-relative",
    pattern:
      /\bhace\s+(?:un[ao]?\s+|unos?\s+|1\s+|\d{1,4}\s+)(?:segundo|minuto|hora|d[ií]a|semana|mes|a[ñn]o)s?\b|\b\d{1,4}\s+d[ií]as?\s+(?:atr[aá]s|antes)\b|\bhace\s+rato\b|\b(?:ayer|hoy|ma[ñn]ana)\b/iu,
  },
  {
    name: "es-month",
    pattern:
      /\b(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\b[\s,]*\d{1,4}\b|\b\d{1,2}\s+de\s+(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\b/iu,
  },
  // --- French ---
  {
    name: "fr-relative",
    pattern:
      /\bil\s+y\s+a\s+(?:un\s+|une\s+|quelques\s+|\d{1,4}\s+)(?:seconde|minute|heure|jour|semaine|moment|mois|an)s?\b|\b(?:hier|aujourd['’]hui|demain)\b/iu,
  },
  {
    name: "fr-month",
    pattern:
      /\b(?:janvier|f[ée]vrier|mars|avril|mai|juin|juillet|ao[uû]t|septembre|octobre|novembre|d[ée]cembre)\b[\s,]*\d{1,4}\b|\b\d{1,2}\s+(?:janvier|f[ée]vrier|mars|avril|mai|juin|juillet|ao[uû]t|septembre|octobre|novembre|d[ée]cembre)\b/iu,
  },
  // --- German ---
  {
    name: "de-relative",
    pattern:
      /\bvor\s+(?:einem\s+|einer\s+|einigen\s+|\d{1,4}\s+)(?:sekunde(?:n)?|minute(?:n)?|stunde(?:n)?|tag(?:e|en)?|woche(?:n)?|monat(?:e|en)?|jahr(?:e|en)?)\b|\bletzte[nmrs]?\s+(?:tag|woche|monat|jahr)(?:e|en|s)?\b|\b(?:gestern|heute|morgen)\b/iu,
  },
  {
    name: "de-month",
    pattern:
      /\b(?:januar|februar|m[aä]rz|april|mai|juni|juli|august|september|oktober|november|dezember)\b[\s,]*\d{1,4}\b|\b\d{1,2}\.\s*(?:januar|februar|m[aä]rz|april|mai|juni|juli|august|september|oktober|november|dezember)\b/iu,
  },
  // --- Portuguese ---
  {
    name: "pt-relative",
    pattern:
      /\bh[áa]\s+(?:um\s+|uma\s+|alguns\s+|\d{1,4}\s+)(?:segundo|minuto|hora|dia|semana|m[eê]s|ano)s?\b|\b(?:ontem|hoje|amanh[ãa])\b/iu,
  },
  {
    name: "pt-month",
    pattern:
      /\b(?:janeiro|fevereiro|mar[çc]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\b[\s,]*\d{1,4}\b|\b\d{1,2}\s+de\s+(?:janeiro|fevereiro|mar[çc]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\b/iu,
  },
  // --- Russian ---
  // NOTE: \b is ASCII-only in JavaScript regex, so Cyrillic boundaries use
  // explicit Unicode lookarounds instead.
  {
    name: "ru-relative",
    pattern:
      /(?<![\p{L}\p{N}_])\d{1,4}\s+(?:секунд[ауы]?|минут[ауы]?|час(?:а|ов)?|д(?:ень|ня|ней)|недел(?:я|и|ю|ь)|месяц(?:а|ев)?|год(?:а|ов)?)\s+назад(?![\p{L}\p{N}_])|(?<![\p{L}\p{N}_])(?:сегодня|вчера|завтра)(?![\p{L}\p{N}_])/iu,
  },
  {
    name: "ru-month",
    pattern:
      /(?<![\p{L}\p{N}_])(?:январ[ья]|феврал[ья]|март[а]?|апрел[ья]|ма[йя]|июн[ья]|июл[ья]|август[а]?|сентябр[ья]|октябр[ья]|ноябр[ья]|декабр[ья])(?![\p{L}\p{N}_])[\s,]*\d{1,4}/iu,
  },
];

/**
 * Returns true if the text matches any locale-specific date pattern.
 * @param {string} text - Raw comment text.
 * @returns {{ matched: boolean, patternName: string | null }}
 */
export function matchesLocaleDate(text) {
  if (!text) return { matched: false, patternName: null };
  const normalized = text.replace(/\s+/g, " ").trim();
  for (const { name, pattern } of LOCALE_DATE_PATTERNS) {
    if (pattern.test(normalized)) {
      return { matched: true, patternName: name };
    }
  }
  return { matched: false, patternName: null };
}
