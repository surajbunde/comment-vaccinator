/**
 * @fileoverview Scoped MutationObserver for YouTube comment threads.
 * Provides start/stop lifecycle so the observer can be paused during
 * bulk DOM mutations (e.g. when applyFiltersToAll() runs).
 */

import { log } from "../storage/logger.js";

/** @type {MutationObserver | null} */
let observer = null;

/** @type {Element | null} */
let observedRoot = null;

const COMMENTS_SECTION_SELECTORS = [
  "#comments",
  "ytm-engagement-panel-section-list-renderer.engagement-panel-comments-section",
];

/**
 * Finds the tightest stable ancestor element that contains all comment threads.
 * Falls back to document.body if the specific selector is unavailable.
 * @returns {Element}
 */
function getCommentRoot() {
  for (const sel of COMMENTS_SECTION_SELECTORS) {
    const el = document.querySelector(sel);
    if (el) return el;
  }
  log(
    "warn",
    "observer",
    "Comment section selectors not found — falling back to document.body. YouTube DOM may have changed."
  );
  return document.body;
}

/**
 * Starts observing the comment section.
 * If already observing, does nothing.
 * @param {function(Element[]): void} callback - Called with newly added element nodes.
 */
export function startObserver(callback) {
  if (observer) return; // already running

  observedRoot = getCommentRoot();
  observer = new MutationObserver((mutations) => {
    // Filter to only childList mutations that add nodes — ignore attribute changes.
    const addedNodes = mutations
      .filter((m) => m.type === "childList" && m.addedNodes.length > 0)
      .flatMap((m) => Array.from(m.addedNodes))
      .filter((n) => n.nodeType === Node.ELEMENT_NODE);

    if (addedNodes.length > 0) {
      callback(addedNodes);
    }
  });

  observer.observe(observedRoot, {
    childList: true,
    subtree: true,
    // Explicitly NOT observing attributes or characterData
    // to avoid triggering on YouTube's own style/state updates.
    attributes: false,
    characterData: false,
  });

  log(
    "info",
    "observer",
    `Started on ${observedRoot.tagName}#${observedRoot.id || "(no id)"}`
  );
}

/**
 * Pauses the observer without destroying it.
 * Call before bulk DOM mutations, resume after.
 */
export function pauseObserver() {
  if (observer) observer.disconnect();
}

/**
 * Resumes a paused observer. No-op if not yet started.
 */
export function resumeObserver() {
  if (observer && observedRoot) {
    observer.observe(observedRoot, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false,
    });
  }
}

/**
 * Stops and destroys the observer.
 */
export function stopObserver() {
  if (observer) {
    observer.disconnect();
    observer = null;
    observedRoot = null;
    log("info", "observer", "Stopped.");
  }
}
