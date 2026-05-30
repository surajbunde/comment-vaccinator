// --- Regex Patterns for Dates (Aggressive Coverage) ---
const DATE_PATTERNS = [
  /\b(?:today|tonight|yesterday|tomorrow|this\s+(?:day|week|month|year)|right\s+now)\b/i,
  /\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
  /\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?(?:,\s*\d{2,4})?\b/i,
  /\b\d{1,2}(?:st|nd|rd|th)?\s+(?:of\s+)?(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)(?:\s+\d{2,4})?\b/i,
  /(?:^|[^a-z0-9])\d{1,2}(?:st|nd|rd|th)?\s*(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)(?:\s+\d{2,4})?\b/i,
  /\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{4}\b/i,
  /\b\d{4}\s+(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/i,
  /\b\d{1,2}[\/.-]\d{1,2}(?:[\/.-](?:\d{2}|\d{4}))\b/,
  /\b(?:19|20)\d{2}[\/.-]\d{1,2}[\/.-]\d{1,2}\b/,
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
    keyword: 0
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
    emojiFilterEnabled: true // NEW DEFAULT
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
        'keywordEnabled', 'keywordList', 'emojiFilterEnabled' // NEW LOAD
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
        settings.emojiFilterEnabled = data.emojiFilterEnabled !== undefined ? data.emojiFilterEnabled : true; // NEW ASSIGNMENT
        
        settings.keywordList = data.keywordList ? data.keywordList.toLowerCase().split(',').map(k => k.trim()).filter(k => k.length > 0) : [];

        // Run the filter
        filterAndCountComments();
    });
    } catch (err) {
      // Ignore invalidated context errors from stale script instances.
    }
}

function filterAndCountComments() {
  currentCounts.total = 0;
  currentCounts.hidden = 0;
  currentCounts.visible = 0;
  currentCounts.breakdown.date = 0;
  currentCounts.breakdown.keyword = 0;

  const commentBlocks = document.querySelectorAll('ytd-comment-thread-renderer'); 
  
  commentBlocks.forEach(block => {
    const commentTextElement = block.querySelector('#content-text'); 

    if (commentTextElement && commentTextElement.textContent) {
      currentCounts.total++;
      const commentText = commentTextElement.textContent.trim();
      
      let shouldHide = false;
      let hideReason = null;
      
      // 1. DATE Filter
      const isDateMatch = settings.dateFilterEnabled && checkCommentIsDate(commentText);
      const isKeywordMatch = checkCommentIsKeyword(commentText);

      if (isDateMatch) {
        // Date-filter toggle should always hide matched date comments.
        shouldHide = true;
        hideReason = 'date';
      }
      
      // 2. KEYWORD Filter
      if (isKeywordMatch) {
        shouldHide = true;
        // Keyword takes precedence in the legend when both match.
        hideReason = 'keyword';
      }
      
      if (shouldHide) {
        block.style.display = 'none'; 
        currentCounts.hidden++;
        if (hideReason === 'date') {
          currentCounts.breakdown.date++;
        } else if (hideReason === 'keyword') {
          currentCounts.breakdown.keyword++;
        }
      } else {
        block.style.display = ''; 
        currentCounts.visible++;
      }
    }
  });
}


function startObservation() {
  let timeoutId = null;
  const commentSection = document.getElementById('comments');
  
  if (!commentSection) {
      setTimeout(startObservation, 500);
      return;
  }
  
  const targetNode = commentSection.querySelector('#contents');
  if (!targetNode) {
      setTimeout(startObservation, 500);
      return;
  }

  observer = new MutationObserver(() => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(loadSettingsAndFilter, 300); 
  });

  observer.observe(targetNode, { childList: true, subtree: true });

  loadSettingsAndFilter(); 
  setTimeout(loadSettingsAndFilter, 1000); 
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
