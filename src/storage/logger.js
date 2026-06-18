/**
 * @fileoverview Structured logger for Comment Vaccinator.
 * Logs are namespaced, level-filtered, and include a timestamp.
 * No logs are emitted in production unless the debug flag is set.
 */

const PREFIX = "[CommentVaccinator]";

/** Set to true via storage key cv_debugMode for verbose logging. */
let _debugEnabled = false;

/**
 * @param {boolean} enabled
 */
export function setDebugMode(enabled) {
  _debugEnabled = Boolean(enabled);
}

/**
 * @param {'info'|'warn'|'error'} level
 * @param {string} module - Short module name, e.g. 'observer', 'pipeline'.
 * @param {string} message
 * @param {any} [data]
 */
export function log(level, module, message, data) {
  if (level === "error") {
    console.error(`${PREFIX}[${module}] ${message}`, data ?? "");
    return;
  }
  if (!_debugEnabled) return;

  const ts = new Date().toISOString().slice(11, 23);
  const fn = level === "warn" ? console.warn : console.info;
  fn(`${PREFIX}[${module}][${ts}] ${message}`, data ?? "");
}
