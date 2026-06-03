// --- Regex Patterns for Dates (Aggressive Coverage) ---
const DATE_PATTERNS = [
  /\b(?:today|tonight|yesterday|tomorrow|this\s+(?:day|week|month|year)|right\s+now)\b/i,
  /\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
  /\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?(?:,\s*\d{2,4})?\b/i,
  /\b\d{1,2}(?:st|nd|rd|th)?\s+(?:of\s+)?(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)(?:\s+\d{2,4})?\b/i,
  /(?:^|[^a-z0-9])\d{1,2}(?:st|nd|rd|th)?\s*(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)(?:\s+\d{2,4})?\b/i,
  /\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{4}\b/i,
  /\b\d{4}\s+(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/i,
  /\b\d{1,2}\s*[\/.-]\s*\d{1,2}(?:\s*[\/.-]\s*(?:\d{2}|\d{4}))\b/,
  /\b(?:19|20)\d{2}\s*[\/.-]\s*\d{1,2}\s*[\/.-]\s*\d{1,2}\b/,
  /(?:^|[^\p{L}\p{N}_])(?:\d{1,2}|[०-९]{1,2})\s*(?:जनवरी|फ़रवरी|फरवरी|मार्च|अप्रैल|एप्रिल|मई|मे|जून|जुलै|जुलाई|अगस्त|ऑगस्ट|सितंबर|सितम्बर|सप्टेंबर|अक्टूबर|ऑक्टोबर|नवंबर|नवम्बर|नोव्हेंबर|दिसंबर|दिसम्बर|डिसेंबर)(?:\s*(?:\d{2,4}|[०-९]{2,4}))?/iu,
  /(?:^|[^\p{L}\p{N}_])(?:जनवरी|फ़रवरी|फरवरी|मार्च|अप्रैल|एप्रिल|मई|मे|जून|जुलै|जुलाई|अगस्त|ऑगस्ट|सितंबर|सितम्बर|सप्टेंबर|अक्टूबर|ऑक्टोबर|नवंबर|नवम्बर|नोव्हेंबर|दिसंबर|दिसम्बर|डिसेंबर)\s*(?:\d{1,2}|[०-९]{1,2})(?:\s*(?:\d{2,4}|[०-९]{2,4}))?/iu,
  /\banyone\s+today\b/i,
  /\banyone\s+watching(?:\s+(?:in|on)\s+(?:\d{2,4}|today|tonight|yesterday|tomorrow))?\b/i,
  /\banyone\s+here\s+(?:in|on)\s+(?:\d{2,4}|today|tonight|yesterday|tomorrow)\b/i,
  /\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)(?:uary|ruary|ch|il|e|y|ust|tember|ober|ember)?/i
];

let currentCounts = {
  total: 0,
  hidden: 0,
  visible: 0,
  breakdown: {
    date: 0,
    keyword: 0,
    wordcount: 0
  }
};
let observer = null;
let settings = { 
    dateFilterEnabled: true,
    wordCountEnabled: true, 
    wordCountMode: 'max',
    wordCountValue: 12,
    keywordEnabled: false,
    keywordList: [],
    emojiFilterEnabled: true,
    emojiOnlyEnabled: false
};

// --- CORE CHECK FUNCTIONS ---

function checkCommentIsDate(text) {
  // Normalize to avoid punctuation-only mismatches while keeping original content readable.
  const normalized = text.replace(/\s+/g, ' ').trim();
  return DATE_PATTERNS.some(re => re.test(normalized));
}

function checkCommentIsKeyword(text) {
  if (!settings.keywordEnabled || settings.keywordList.length === 0) {
      return false;
  }
  const lowerText = text.toLowerCase();
  return settings.keywordList.some(keyword => lowerText.includes(keyword));
}

// **MODIFIED:** Conditional application of the emoji filter
function checkCommentIsWordCountFiltered(text) {
  if (!settings.wordCountEnabled) {
      return false;
  }
  
  // Start with the raw text
  let cleanedText = text;

  // ONLY filter if the setting is enabled
  if (settings.emojiFilterEnabled) {
    const emojiRegex = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g;
    
    // Remove emojis and common punctuation before counting words
    cleanedText = cleanedText
      .replace(emojiRegex, '') 
      .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '') 
      .trim();
  } else {
    // If emoji filter is DISABLED, we just trim the text for counting
    cleanedText = cleanedText.trim();
  }


  // Count remaining words/tokens
  const words = cleanedText.split(/\s+/).filter(word => word.length > 0);
  const count = words.length;
  const threshold = settings.wordCountValue;
  
  if (settings.wordCountMode === 'max') {
      return count < threshold;
  } else if (settings.wordCountMode === 'min') {
      return count > threshold;
  }
  return false;
}

function checkCommentIsEmojiOnly(text) {
  if (!settings.emojiOnlyEnabled) return false;
  const emojiRegex = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff]|\ufe0e|\ufe0f|\u200d)/g;
  const stripped = text.replace(emojiRegex, '').replace(/\s+/g, '').trim();
  return stripped.length === 0;
}

// --- FILTERING LOGIC ---

function loadSettingsAndFilter() {
    // During extension reload/update, old content-script instances can throw
    // "Extension context invalidated" when touching chrome APIs.
    if (!chrome.runtime || !chrome.runtime.id) {
      return;
    }

    try {
    chrome.storage.local.get([
        'dateFilterEnabled',
        'wordCountEnabled', 'wordCountMode', 'wordCountValue',
        'keywordEnabled', 'keywordList', 'emojiFilterEnabled',
        'emojiOnlyEnabled'
    ], (data) => {
        if (chrome.runtime.lastError) {
          return;
        }
        // Update settings object
        settings.dateFilterEnabled = data.dateFilterEnabled !== undefined ? data.dateFilterEnabled : true;
        settings.wordCountEnabled = data.wordCountEnabled !== undefined ? data.wordCountEnabled : true;
        settings.wordCountMode = data.wordCountMode || 'max';
        settings.wordCountValue = data.wordCountValue || 12; 
        settings.keywordEnabled = data.keywordEnabled !== undefined ? data.keywordEnabled : false;
        settings.emojiFilterEnabled = data.emojiFilterEnabled !== undefined ? data.emojiFilterEnabled : true;
        settings.emojiOnlyEnabled = data.emojiOnlyEnabled !== undefined ? data.emojiOnlyEnabled : false;
        
        settings.keywordList = data.keywordList ? data.keywordList.toLowerCase().split(',').map(k => k.trim()).filter(k => k.length > 0) : [];

        // Run the filter
        filterAndCountComments();
    });
    } catch (err) {
      // Ignore invalidated context errors from stale script instances.
    }
}

const COMMENTS_SECTION_SELECTORS = [
  '#comments',
  'ytm-engagement-panel-section-list-renderer.engagement-panel-comments-section'
];

const THREAD_SELECTORS = [
  'ytd-comment-thread-renderer',
  'ytm-comment-thread-renderer'
];

const TEXT_SELECTORS = [
  '#content-text',
  '.comment-text',
  '[slot="content"]',
  '.comment-content',
  '.YtmCommentRendererText'
];

function findCommentBlocks() {
  for (const sel of THREAD_SELECTORS) {
    const found = document.querySelectorAll(sel);
    if (found.length > 0) return found;
  }
  for (const sel of COMMENTS_SECTION_SELECTORS) {
    const section = document.querySelector(sel);
    if (section) {
      const items = section.querySelectorAll(TEXT_SELECTORS.join(','));
      if (items.length > 0) {
        const seen = new Set();
        return Array.from(items).map(el => {
          let parent = el.closest('ytd-comment-renderer, ytm-comment-renderer, [id]');
          if (!parent || seen.has(parent)) return null;
          seen.add(parent);
          return parent;
        }).filter(Boolean);
      }
    }
  }
  return [];
}

function getCommentText(block) {
  for (const sel of TEXT_SELECTORS) {
    const el = block.querySelector(sel);
    if (el && el.textContent) return el.textContent.trim();
  }
  return '';
}

function filterAndCountComments() {
  currentCounts.total = 0;
  currentCounts.hidden = 0;
  currentCounts.visible = 0;
  currentCounts.breakdown.date = 0;
  currentCounts.breakdown.keyword = 0;
  currentCounts.breakdown.wordcount = 0;
  currentCounts.breakdown.emojionly = 0;

  const commentBlocks = findCommentBlocks();
  
  commentBlocks.forEach(block => {
    const commentText = getCommentText(block);
    if (!commentText) return;

    currentCounts.total++;
    
    let shouldHide = false;
    let hideReason = null;
    
    const isDateMatch = settings.dateFilterEnabled && checkCommentIsDate(commentText);
    const isKeywordMatch = checkCommentIsKeyword(commentText);
    const isWordCountMatch = checkCommentIsWordCountFiltered(commentText);
    const isEmojiOnly = checkCommentIsEmojiOnly(commentText);

    if (isDateMatch) {
      shouldHide = true;
      hideReason = 'date';
    }
    
    if (isKeywordMatch) {
      shouldHide = true;
      hideReason = 'keyword';
    }
    
    if (isWordCountMatch) {
      shouldHide = true;
      hideReason = 'wordcount';
    }
    
    if (isEmojiOnly) {
      shouldHide = true;
      hideReason = 'emojionly';
    }
    
    if (shouldHide) {
      block.style.display = 'none';
      currentCounts.hidden++;
      if (hideReason === 'date') {
        currentCounts.breakdown.date++;
      } else if (hideReason === 'keyword') {
        currentCounts.breakdown.keyword++;
      } else if (hideReason === 'wordcount') {
        currentCounts.breakdown.wordcount++;
      } else if (hideReason === 'emojionly') {
        currentCounts.breakdown.emojionly++;
      }
    } else {
      block.style.display = '';
      currentCounts.visible++;
    }
  });
}


function findCommentsSection() {
  for (const sel of COMMENTS_SECTION_SELECTORS) {
    const el = document.querySelector(sel);
    if (el) return el;
  }
  return null;
}

function startObservation() {
  let timeoutId = null;
  let retries = 0;
  const maxRetries = 30;

  function tryObserve() {
    const commentSection = findCommentsSection();
    if (!commentSection) {
      if (retries++ < maxRetries) setTimeout(tryObserve, 500);
      return;
    }

    let targetNode = commentSection.querySelector('#contents, #items');
    if (!targetNode) targetNode = commentSection;

    observer = new MutationObserver(() => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(loadSettingsAndFilter, 300);
    });

    observer.observe(targetNode, { childList: true, subtree: true });
    loadSettingsAndFilter();
    setTimeout(loadSettingsAndFilter, 1000);
    setTimeout(loadSettingsAndFilter, 3000);
  }

  tryObserve();
}

startObservation();

// --- POPUP AND RELOAD LISTENERS ---

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_COUNTS' || request.type === 'REFILTER_NOW') {
    loadSettingsAndFilter(); 
    if (request.type === 'GET_COUNTS') {
        sendResponse(currentCounts);
        return true; 
    }
  }
});
