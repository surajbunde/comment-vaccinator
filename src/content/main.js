/**
 * @fileoverview Thin entry point for the content script.
 * Wires together settings cache, filter pipeline, and observer.
 * This file is bundled by esbuild into content.js for the manifest.
 */

import { initSettingsCache, getSettings, onSettingsChange, refreshSettings } from "../storage/settingsCache.js";
import { runPipeline } from "../filters/pipeline.js";
import { log, setDebugMode } from "../storage/logger.js";
import {
  startObserver,
  stopObserver,
  pauseObserver,
  resumeObserver,
} from "../observer/commentObserver.js";

// --- Selectors (with fallbacks for YouTube DOM changes) ---

const THREAD_SELECTORS = [
  "ytd-comment-thread-renderer",
  "ytm-comment-thread-renderer",
];

const TEXT_SELECTORS = [
  "#content-text",
  "yt-formatted-string#content-text",
  ".comment-text",
  '[slot="content"]',
  ".comment-content",
  ".YtmCommentRendererText",
];

// --- DOM helpers ---

/**
 * Finds all comment thread elements on the page.
 * @returns {Element[]}
 */
function findCommentThreads() {
  for (const sel of THREAD_SELECTORS) {
    const found = document.querySelectorAll(sel);
    if (found.length > 0) return Array.from(found);
  }
  return [];
}

/**
 * Extracts comment text from a thread element.
 * @param {Element} threadElement
 * @returns {string|null}
 */
function getCommentText(threadElement) {
  for (const sel of TEXT_SELECTORS) {
    const el = threadElement.querySelector(sel);
    if (el && el.textContent) return el.textContent.trim();
  }
  log("warn", "content", "Could not find comment text — selectors may need updating.", {
    html: threadElement.outerHTML?.slice(0, 200),
  });
  return null;
}

function hideThread(el, reason) {
  el.style.display = "none";
  el.dataset.cvHidden = "1";
  el.dataset.cvReason = reason;
}

function showThread(el) {
  el.style.display = "";
  el.dataset.cvHidden = "0";
  el.dataset.cvReason = "";
}

/**
 * Processes a single comment thread through the filter pipeline.
 * @param {Element} threadElement
 */
function processThread(threadElement) {
  if (threadElement.dataset.cvProcessed === "1") return;

  try {
    const text = getCommentText(threadElement);
    if (text === null) return; // selector failure — already logged

    const settings = getSettings();
    const videoId = new URLSearchParams(location.search).get("v");

    // Per-video override — always show if filtering is paused for this video.
    if (videoId && settings.perVideoDisabled.includes(videoId)) {
      showThread(threadElement);
      threadElement.dataset.cvProcessed = "1";
      return;
    }

    const result = runPipeline(text, settings);
    if (result.hide) {
      hideThread(threadElement, result.reason);
    } else {
      showThread(threadElement);
    }

    threadElement.dataset.cvProcessed = "1";
  } catch (err) {
    log("error", "content", "processThread threw unexpectedly", err);
  }
}

// --- Core filtering ---

async function applyFiltersToAll() {
  pauseObserver();
  try {
    // Clear processed flags so all comments are re-evaluated with current settings.
    document.querySelectorAll("[data-cv-processed]").forEach((el) => {
      delete el.dataset.cvProcessed;
    });

    const threads = findCommentThreads();
    if (threads.length === 0) {
      log("warn", "content", "applyFiltersToAll: 0 threads found. Selector may need updating.");
    }
    for (const thread of threads) {
      processThread(thread);
    }
  } finally {
    resumeObserver();
    updateBadge();
  }
}

// --- Badge ---

function updateBadge() {
  const all = document.querySelectorAll("[data-cv-processed='1']");
  const hidden = Array.from(all).filter((el) => el.dataset.cvHidden === "1").length;
  chrome.runtime.sendMessage({ type: "CV_UPDATE_BADGE", hiddenCount: hidden });
}

// --- Stats for popup ---

function getStats() {
  const all = document.querySelectorAll("[data-cv-processed='1']");
  const hidden = Array.from(all).filter((el) => el.dataset.cvHidden === "1").length;
  return { total: all.length, hidden, visible: all.length - hidden };
}

// --- Video ID publisher ---

function publishCurrentVideoId() {
  const videoId = new URLSearchParams(location.search).get("v") || "";
  chrome.storage.local.set({ cv_currentVideoId: videoId });
}

// --- Observer callback ---

function onNewNodes(newNodes) {
  for (const node of newNodes) {
    const threads =
      node.matches?.("ytd-comment-thread-renderer, ytm-comment-thread-renderer")
        ? [node]
        : Array.from(
            node.querySelectorAll?.("ytd-comment-thread-renderer, ytm-comment-thread-renderer") || []
          );
    for (const thread of threads) {
      processThread(thread);
    }
  }
}

// --- Message listener (popup comms) ---

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "GET_COUNTS") {
    applyFiltersToAll();
    sendResponse(getStats());
    return true;
  }
  if (msg.type === "REFILTER_NOW") {
    // Force fresh read from storage to avoid race condition with onChanged.
    refreshSettings().then(() => applyFiltersToAll());
    return false;
  }
  if (msg.type === "CV_GET_STATS") {
    sendResponse(getStats());
    return true;
  }
});

// --- SPA navigation handler ---

document.addEventListener("yt-navigate-finish", () => {
  stopObserver();
  publishCurrentVideoId();
  // Allow DOM to settle before re-observing.
  setTimeout(() => {
    applyFiltersToAll();
    startObserver(onNewNodes);
  }, 800);
});

// Also handle popstate for fallback SPA detection.
window.addEventListener("popstate", () => {
  setTimeout(() => {
    publishCurrentVideoId();
    applyFiltersToAll();
  }, 500);
});

// --- Init ---

async function init() {
  if (!chrome.runtime || !chrome.runtime.id) return;

  try {
    const settings = await initSettingsCache();
    setDebugMode(settings.debugMode);
    publishCurrentVideoId();

    // Subscribe to settings changes.
    onSettingsChange((newSettings) => {
      setDebugMode(newSettings.debugMode);
      applyFiltersToAll();
    });

    // Initial filter pass.
    applyFiltersToAll();

    // Start observing for new comments.
    startObserver(onNewNodes);
  } catch (err) {
    log("error", "content", "init failed", err);
  }
}

init();
