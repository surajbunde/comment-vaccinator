/**
 * Local smoke test for date-detection false positives/negatives.
 * Run: node test-date-filter.js
 */
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

function checkCommentIsDate(text) {
  const normalized = text.replace(/\s+/g, " ").trim();
  return DATE_PATTERNS.some((re) => re.test(normalized));
}

function shouldHideComment(text, settings) {
  let shouldHide = false;

  if (settings.dateFilterEnabled && checkCommentIsDate(text)) {
    shouldHide = true;
  }

  if (settings.keywordEnabled) {
    const keywords = settings.keywordList.toLowerCase().split(",").map((k) => k.trim()).filter(Boolean);
    const lower = text.toLowerCase();
    if (keywords.some((k) => lower.includes(k))) {
      shouldHide = true;
    }
  }

  return shouldHide;
}

const positiveSamples = [
  "Anyone here in 2026?",
  "Watching this today!",
  "I am here on Jan 12, 2025",
  "Back again 12/04/24",
  "11th of September was wild",
  "Monday gang where are you",
  "Ajj k din 2/04/2026 ko kon kon sun rha hai",
  "Aaj 6 April hai Monday hai",
  "Ajj 10 April 2026 ko jo Bhi Hanuman chalisa Sunega",
  "30 march 2026 ko jo b sun rha h",
  "Aaj 26 march ko jo bhi dekh rahe h",
  "आज10April 2026 को कौन देख रहा हैं",
  "30 march ko 2026 kon sun raha hai",
  "Aj 20 March 2026 ko kon kon sun raha hain",
  "Day 6 of listening... 10th April 2026",
  "\"11 February 2026 ko yahan kaun-kaun\"",
  "8 march ko kon kon sun rahe hai",
  "7 jun 2024 main bahut bhagyashali hu"
  ,
  "15 जनवरी 25 को कौन सुन रहा है",
  "१० अप्रैल २०२६ को कौन देख रहा है",
  "15 एप्रिल 2026 ला कोण ऐकत आहे"
];

const negativeSamples = [
  "I have 2 cats and 4 dogs",
  "Top 10 reasons this song is great",
  "Version 2.0 is much better",
  "This beat hits 24/7",
  "The 90s were a great era",
  "Anyone here for the guitar solo?",
  "Joy shree ram Joy hanuman chalisa",
  "जय श्री राम जय श्री हनुमान जी की",
  "जनवरी में ठंड ज्यादा होती है",
  "मार्च पास्ट का गाना अच्छा है"
];

function evaluate(samples, expected) {
  let pass = 0;
  samples.forEach((sample) => {
    const got = checkCommentIsDate(sample);
    const ok = got === expected;
    if (ok) pass++;
    const status = ok ? "PASS" : "FAIL";
    console.log(`[${status}] ${JSON.stringify(sample)} => ${got}`);
  });
  return { pass, total: samples.length };
}

console.log("Positive samples (should be true):");
const pos = evaluate(positiveSamples, true);
console.log("\nNegative samples (should be false):");
const neg = evaluate(negativeSamples, false);

const totalPass = pos.pass + neg.pass;
const totalCount = pos.total + neg.total;
console.log(`\nSummary: ${totalPass}/${totalCount} checks passed`);

const behaviorChecks = [
  {
    name: "Date OFF should not hide date comment",
    got: shouldHideComment("Anyone here in 2025?", {
      dateFilterEnabled: false,
      wordCountEnabled: false,
      wordCountMode: "max",
      wordCountValue: 12,
      keywordEnabled: false,
      keywordList: ""
    }),
    expected: false
  },
  {
    name: "Date ON should hide date comment regardless of word-count",
    got: shouldHideComment("Anyone here in 2025?", {
      dateFilterEnabled: true,
      wordCountEnabled: true,
      wordCountMode: "max",
      wordCountValue: 1,
      keywordEnabled: false,
      keywordList: ""
    }),
    expected: true
  },
  {
    name: "Keyword should hide even when date filter is OFF",
    got: shouldHideComment("Please subscribe for more", {
      dateFilterEnabled: false,
      wordCountEnabled: false,
      wordCountMode: "max",
      wordCountValue: 12,
      keywordEnabled: true,
      keywordList: "subscribe,ad"
    }),
    expected: true
  }
];

let behaviorPass = 0;
console.log("\nBehavior checks:");
behaviorChecks.forEach((check) => {
  const ok = check.got === check.expected;
  if (ok) behaviorPass++;
  console.log(`[${ok ? "PASS" : "FAIL"}] ${check.name} => ${check.got}`);
});

const overallPass = totalPass + behaviorPass;
const overallTotal = totalCount + behaviorChecks.length;
console.log(`\nOverall: ${overallPass}/${overallTotal} checks passed`);
process.exit(overallPass === overallTotal ? 0 : 1);
