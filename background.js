/**
 * @fileoverview Background script for Comment Vaccinator.
 * Initializes default settings on install and handles badge updates.
 */

const DEFAULTS = {
  cv_dateFilterEnabled: true,
  cv_wordCountMode: "off",
  cv_wordCountValue: 5,
  cv_stripEmoji: false,
  cv_blacklist: "",
  cv_whitelist: "",
  cv_customPatterns: "[]",
  cv_perVideoDisabled: "[]",
  cv_currentVideoId: "",
  cv_debugMode: false,
};

chrome.runtime.onInstalled.addListener((details) => {
  chrome.storage.local.get(Object.keys(DEFAULTS), (data) => {
    const toSet = {};
    for (const [key, val] of Object.entries(DEFAULTS)) {
      if (data[key] === undefined) {
        toSet[key] = val;
      }
    }
    if (Object.keys(toSet).length > 0) {
      chrome.storage.local.set(toSet);
    }
  });

  // Set initial badge style
  const api = chrome.action || chrome.browserAction;
  if (api) {
    api.setBadgeBackgroundColor({ color: "#E8503A" });
    api.setBadgeText({ text: "" });
  }
});

// Listen for badge update requests from the content script.
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === "CV_UPDATE_BADGE") {
    const api = chrome.action || chrome.browserAction;
    if (api) {
      const count = msg.hiddenCount;
      const text = count > 0 ? (count > 99 ? "99+" : String(count)) : "";
      const tabId = sender.tab?.id;
      if (tabId) {
        api.setBadgeText({ text, tabId });
      }
    }
  }
});
