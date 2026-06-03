const DEFAULTS = {
  dateFilterEnabled: true,
  wordCountEnabled: false,
  wordCountMode: 'max',
  wordCountValue: 12,
  keywordEnabled: false,
  keywordList: '',
  emojiFilterEnabled: false,
  emojiOnlyEnabled: false
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
});
