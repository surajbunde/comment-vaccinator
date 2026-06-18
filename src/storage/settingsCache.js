/**
 * @fileoverview In-memory settings cache for the content script.
 *
 * Storage key reference (all under chrome.storage.local):
 *   cv_dateFilterEnabled   {boolean}  Master date filter toggle. Default: true.
 *   cv_wordCountMode       {string}   'off' | 'max' | 'min'. Default: 'off'.
 *   cv_wordCountValue      {number}   Word threshold. Default: 5.
 *   cv_stripEmoji          {boolean}  Strip emoji before word counting. Default: false.
 *   cv_blacklist           {string}   Comma-separated blacklist keywords. Default: ''.
 *   cv_whitelist           {string}   Comma-separated whitelist keywords. Default: ''.
 *   cv_customPatterns      {string}   JSON array of {name, patternSource, flags} objects. Default: '[]'.
 *   cv_customPatternsEnabled {boolean} Enable custom pattern filtering. Default: false.
 *   cv_perVideoDisabled    {string}   JSON array of video IDs where filtering is off. Default: '[]'.
 *   cv_currentVideoId      {string}   Current YouTube video ID. Default: ''.
 *   cv_debugMode           {boolean}  Enable verbose logging. Default: false.
 */

import { parseKeywordList } from "../matchers/keywords.js";

/**
 * @typedef {Object} Settings
 * @property {boolean}  dateFilterEnabled
 * @property {string}   wordCountMode
 * @property {number}   wordCountValue
 * @property {boolean}  stripEmoji
 * @property {boolean}  keywordEnabled
 * @property {string[]} blacklist         - Parsed, normalised array.
 * @property {string[]} whitelist         - Parsed, normalised array.
 * @property {boolean}  emojiOnlyEnabled
 * @property {boolean}  customPatternsEnabled
 * @property {Array<{name:string, pattern:RegExp}>} customPatterns
 * @property {string[]} perVideoDisabled  - Array of YouTube video IDs.
 * @property {string}   currentVideoId
 * @property {boolean}  debugMode
 */

const DEFAULTS = {
  cv_dateFilterEnabled: true,
  cv_wordCountMode: "off",
  cv_wordCountValue: 5,
  cv_stripEmoji: false,
  cv_keywordEnabled: false,
  cv_blacklist: "",
  cv_whitelist: "",
  cv_emojiOnlyEnabled: false,
  cv_customPatternsEnabled: false,
  cv_customPatterns: "[]",
  cv_perVideoDisabled: "[]",
  cv_currentVideoId: "",
  cv_debugMode: false,
};

/** @type {Settings} */
let _cache = buildFromRaw(DEFAULTS);

/** @type {Object<string, string>} */
let _rawSnapshot = { ...DEFAULTS };

/** @type {Array<function(Settings): void>} */
const _listeners = [];

/**
 * Deserialises raw storage values into a typed Settings object.
 * @param {Object} raw
 * @returns {Settings}
 */
function buildFromRaw(raw) {
  let customPatterns = [];
  try {
    customPatterns = JSON.parse(raw.cv_customPatterns || "[]").map(
      ({ name, patternSource, flags }) => ({
        name,
        pattern: new RegExp(patternSource, flags || ""),
      })
    );
  } catch (_) {
    customPatterns = [];
  }

  let perVideoDisabled = [];
  try {
    perVideoDisabled = JSON.parse(raw.cv_perVideoDisabled || "[]");
  } catch (_) {
    perVideoDisabled = [];
  }

  return {
    dateFilterEnabled: Boolean(raw.cv_dateFilterEnabled ?? true),
    wordCountMode: raw.cv_wordCountMode ?? "off",
    wordCountValue: Number(raw.cv_wordCountValue ?? 5),
    stripEmoji: Boolean(raw.cv_stripEmoji ?? false),
    keywordEnabled: Boolean(raw.cv_keywordEnabled ?? false),
    blacklist: parseKeywordList(raw.cv_blacklist ?? ""),
    whitelist: parseKeywordList(raw.cv_whitelist ?? ""),
    emojiOnlyEnabled: Boolean(raw.cv_emojiOnlyEnabled ?? false),
    customPatternsEnabled: Boolean(raw.cv_customPatternsEnabled ?? false),
    customPatterns,
    perVideoDisabled,
    currentVideoId: raw.cv_currentVideoId ?? "",
    debugMode: Boolean(raw.cv_debugMode ?? false),
  };
}

/**
 * Loads settings from storage into the cache.
 * Must be called once on content script startup before any filtering.
 * @returns {Promise<Settings>}
 */
export async function initSettingsCache() {
  const raw = await chrome.storage.local.get(Object.keys(DEFAULTS));
  _rawSnapshot = { ...DEFAULTS, ...raw };
  _cache = buildFromRaw(_rawSnapshot);

  // Listen for changes from popup or other contexts.
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    const updated = {};
    for (const [key, { newValue }] of Object.entries(changes)) {
      updated[key] = newValue;
      _rawSnapshot[key] = newValue;
    }
    _cache = buildFromRaw(_rawSnapshot);
    _listeners.forEach((fn) => fn(_cache));
  });

  return _cache;
}

/**
 * Force re-reads settings from storage and rebuilds the cache.
 * Call this when you need guaranteed fresh settings (e.g. after REFILTER_NOW message).
 * @returns {Promise<Settings>}
 */
export async function refreshSettings() {
  const raw = await chrome.storage.local.get(Object.keys(DEFAULTS));
  _rawSnapshot = { ...DEFAULTS, ...raw };
  _cache = buildFromRaw(_rawSnapshot);
  return _cache;
}

/**
 * Returns the current cached settings.
 * Synchronous — safe to call in hot paths.
 * @returns {Settings}
 */
export function getSettings() {
  return _cache;
}

/**
 * Subscribes to settings changes.
 * The callback fires every time any setting changes.
 * @param {function(Settings): void} fn
 * @returns {function(): void} Unsubscribe function.
 */
export function onSettingsChange(fn) {
  _listeners.push(fn);
  return () => {
    const idx = _listeners.indexOf(fn);
    if (idx !== -1) _listeners.splice(idx, 1);
  };
}

/**
 * Writes one or more settings to storage.
 * The cache updates automatically via onChanged.
 * @param {Partial<Record<keyof typeof DEFAULTS, any>>} partialRaw
 * @returns {Promise<void>}
 */
export async function saveSettings(partialRaw) {
  await chrome.storage.local.set(partialRaw);
}
