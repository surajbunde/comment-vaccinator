import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runPipeline } from "../../src/filters/pipeline.js";

const baseSettings = {
  dateFilterEnabled: true,
  wordCountMode: "off",
  wordCountValue: 5,
  stripEmoji: false,
  keywordEnabled: false,
  blacklist: [],
  whitelist: [],
  emojiOnlyEnabled: false,
  customPatterns: [],
  perVideoDisabled: [],
};

describe("runPipeline", () => {
  it("shows comment when no filters are active", () => {
    const result = runPipeline("hello world", {
      ...baseSettings,
      dateFilterEnabled: false,
    });
    assert.equal(result.hide, false);
  });

  it("hides date comment when date filter is on", () => {
    const result = runPipeline("Anyone here in 2025?", {
      ...baseSettings,
      dateFilterEnabled: true,
    });
    assert.equal(result.hide, true);
    assert.equal(result.reason, "date pattern");
  });

  it("does not hide date comment when date filter is off", () => {
    const result = runPipeline("Anyone here in 2025?", {
      ...baseSettings,
      dateFilterEnabled: false,
    });
    assert.equal(result.hide, false);
  });

  it("whitelist overrides date pattern", () => {
    const result = runPipeline("breakdown of 2025 events", {
      ...baseSettings,
      dateFilterEnabled: true,
      whitelist: ["breakdown"],
    });
    assert.equal(result.hide, false);
  });

  it("whitelist overrides blacklist", () => {
    const result = runPipeline("breakdown analysis of the video", {
      ...baseSettings,
      blacklist: ["breakdown"],
      whitelist: ["breakdown"],
    });
    assert.equal(result.hide, false);
  });

  it("hides keyword match", () => {
    const result = runPipeline("Please subscribe for more", {
      ...baseSettings,
      dateFilterEnabled: false,
      keywordEnabled: true,
      blacklist: ["subscribe"],
    });
    assert.equal(result.hide, true);
    assert.equal(result.reason, "keyword blacklist");
  });

  it("does not hide keyword when keywordEnabled is false", () => {
    const result = runPipeline("Please subscribe for more", {
      ...baseSettings,
      dateFilterEnabled: false,
      keywordEnabled: false,
      blacklist: ["subscribe"],
    });
    assert.equal(result.hide, false);
  });

  it("does not hide keyword when blacklist is empty", () => {
    const result = runPipeline("Please subscribe for more", {
      ...baseSettings,
      dateFilterEnabled: false,
      keywordEnabled: true,
      blacklist: [],
    });
    assert.equal(result.hide, false);
  });

  it("hides short comment in max mode", () => {
    const result = runPipeline("hi", {
      ...baseSettings,
      dateFilterEnabled: false,
      wordCountMode: "max",
      wordCountValue: 5,
    });
    assert.equal(result.hide, true);
    assert.equal(result.reason.includes("word count"), true);
  });

  it("keeps long comment in max mode", () => {
    const result = runPipeline("this is a long comment with many words", {
      ...baseSettings,
      dateFilterEnabled: false,
      wordCountMode: "max",
      wordCountValue: 5,
    });
    assert.equal(result.hide, false);
  });

  it("hides long comment in min mode", () => {
    const result = runPipeline(
      "this is a very long comment with lots of words in it",
      {
        ...baseSettings,
        dateFilterEnabled: false,
        wordCountMode: "min",
        wordCountValue: 5,
      }
    );
    assert.equal(result.hide, true);
  });

  it("hides emoji-only comment", () => {
    const result = runPipeline("😂 😂 😂", {
      ...baseSettings,
      dateFilterEnabled: false,
      emojiOnlyEnabled: true,
    });
    assert.equal(result.hide, true);
    assert.equal(result.patternName, "emoji-only");
  });

  it("does not hide emoji-only comment when emojiOnlyEnabled is false", () => {
    const result = runPipeline("😂 😂 😂", {
      ...baseSettings,
      dateFilterEnabled: false,
      emojiOnlyEnabled: false,
    });
    assert.equal(result.hide, false);
  });

  it("keeps comment with text and emoji", () => {
    const result = runPipeline("Great video! 😂", {
      ...baseSettings,
      dateFilterEnabled: false,
      emojiOnlyEnabled: true,
    });
    assert.equal(result.hide, false);
  });

  it("hides custom pattern match", () => {
    const result = runPipeline("hace 3 horas", {
      ...baseSettings,
      dateFilterEnabled: true,
      customPatterns: [{ name: "spanish-time", pattern: /hace \d+ horas/ }],
    });
    assert.equal(result.hide, true);
    assert.equal(result.patternName, "spanish-time");
  });
});

describe("word count filter", () => {
  it("does not filter when wordCountMode is off", () => {
    const result = runPipeline("hi", {
      ...baseSettings,
      dateFilterEnabled: false,
      wordCountMode: "off",
      wordCountValue: 5,
    });
    assert.equal(result.hide, false);
  });

  it("hides 1-word comment in max mode with threshold 5", () => {
    const result = runPipeline("hello", {
      ...baseSettings,
      dateFilterEnabled: false,
      wordCountMode: "max",
      wordCountValue: 5,
    });
    assert.equal(result.hide, true);
    assert.equal(result.patternName, "word-count");
  });

  it("hides 3-word comment in max mode with threshold 5", () => {
    const result = runPipeline("one two three", {
      ...baseSettings,
      dateFilterEnabled: false,
      wordCountMode: "max",
      wordCountValue: 5,
    });
    assert.equal(result.hide, true);
  });

  it("keeps 5-word comment in max mode with threshold 5 (not less than)", () => {
    const result = runPipeline("one two three four five", {
      ...baseSettings,
      dateFilterEnabled: false,
      wordCountMode: "max",
      wordCountValue: 5,
    });
    assert.equal(result.hide, false);
  });

  it("keeps 6-word comment in max mode with threshold 5", () => {
    const result = runPipeline("one two three four five six", {
      ...baseSettings,
      dateFilterEnabled: false,
      wordCountMode: "max",
      wordCountValue: 5,
    });
    assert.equal(result.hide, false);
  });

  it("hides 6-word comment in min mode with threshold 5", () => {
    const result = runPipeline("one two three four five six", {
      ...baseSettings,
      dateFilterEnabled: false,
      wordCountMode: "min",
      wordCountValue: 5,
    });
    assert.equal(result.hide, true);
  });

  it("keeps 4-word comment in min mode with threshold 5 (not more than)", () => {
    const result = runPipeline("one two three four", {
      ...baseSettings,
      dateFilterEnabled: false,
      wordCountMode: "min",
      wordCountValue: 5,
    });
    assert.equal(result.hide, false);
  });

  it("keeps 5-word comment in min mode with threshold 5 (equal is not more than)", () => {
    const result = runPipeline("one two three four five", {
      ...baseSettings,
      dateFilterEnabled: false,
      wordCountMode: "min",
      wordCountValue: 5,
    });
    assert.equal(result.hide, false);
  });

  it("strips emojis before counting when stripEmoji is true", () => {
    // "😂 😂 😂 hello world" → after strip → "hello world" → 2 words
    const result = runPipeline("😂 😂 😂 hello world", {
      ...baseSettings,
      dateFilterEnabled: false,
      wordCountMode: "max",
      wordCountValue: 5,
      stripEmoji: true,
    });
    assert.equal(result.hide, true);
    assert.equal(result.patternName, "word-count");
  });

  it("does not strip emojis when stripEmoji is false", () => {
    // "😂 😂 😂 hello world" → 5 whitespace-separated tokens → 5 words
    const result = runPipeline("😂 😂 😂 hello world", {
      ...baseSettings,
      dateFilterEnabled: false,
      wordCountMode: "max",
      wordCountValue: 5,
      stripEmoji: false,
    });
    assert.equal(result.hide, false);
  });

  it("emoji-only comment has 0 words after stripping", () => {
    const result = runPipeline("😂 😂 😂", {
      ...baseSettings,
      dateFilterEnabled: false,
      wordCountMode: "max",
      wordCountValue: 3,
      stripEmoji: true,
    });
    assert.equal(result.hide, true);
  });

  it("respects custom threshold of 10 in max mode", () => {
    const short = "one two three four five";
    const long = "one two three four five six seven eight nine ten";
    assert.equal(
      runPipeline(short, { ...baseSettings, dateFilterEnabled: false, wordCountMode: "max", wordCountValue: 10 }).hide,
      true
    );
    assert.equal(
      runPipeline(long, { ...baseSettings, dateFilterEnabled: false, wordCountMode: "max", wordCountValue: 10 }).hide,
      false
    );
  });

  it("respects custom threshold of 3 in min mode", () => {
    const short = "hi";
    const long = "one two three four";
    assert.equal(
      runPipeline(short, { ...baseSettings, dateFilterEnabled: false, wordCountMode: "min", wordCountValue: 3 }).hide,
      false
    );
    assert.equal(
      runPipeline(long, { ...baseSettings, dateFilterEnabled: false, wordCountMode: "min", wordCountValue: 3 }).hide,
      true
    );
  });

  it("empty comment has 0 words — hidden in max mode", () => {
    const result = runPipeline("", {
      ...baseSettings,
      dateFilterEnabled: false,
      wordCountMode: "max",
      wordCountValue: 5,
    });
    assert.equal(result.hide, true);
  });

  it("comment with only punctuation has 0 words after strip", () => {
    const result = runPipeline("... !!! ???", {
      ...baseSettings,
      dateFilterEnabled: false,
      wordCountMode: "max",
      wordCountValue: 3,
      stripEmoji: true,
    });
    assert.equal(result.hide, true);
  });

  it("reason includes word count details", () => {
    const result = runPipeline("hi", {
      ...baseSettings,
      dateFilterEnabled: false,
      wordCountMode: "max",
      wordCountValue: 5,
    });
    assert.equal(result.hide, true);
    assert.match(result.reason, /word count/);
    assert.match(result.reason, /1 words/);
    assert.match(result.reason, /max/);
    assert.match(result.reason, /5/);
  });

  it("hides comment with only emoji + time when stripEmoji is on", () => {
    // "😂 1:25" → strip → "" → 0 words
    const result = runPipeline("😂 1:25", {
      ...baseSettings,
      dateFilterEnabled: false,
      wordCountMode: "max",
      wordCountValue: 3,
      stripEmoji: true,
    });
    assert.equal(result.hide, true);
  });

  it("hides comment with only time when stripEmoji is on", () => {
    // "1:25" → strip → "" → 0 words
    const result = runPipeline("1:25", {
      ...baseSettings,
      dateFilterEnabled: false,
      wordCountMode: "max",
      wordCountValue: 3,
      stripEmoji: true,
    });
    assert.equal(result.hide, true);
  });

  it("hides comment with only time AM when stripEmoji is on", () => {
    const result = runPipeline("10:30 AM", {
      ...baseSettings,
      dateFilterEnabled: false,
      wordCountMode: "max",
      wordCountValue: 3,
      stripEmoji: true,
    });
    assert.equal(result.hide, true);
  });

  it("hides comment with multiple emojis and time", () => {
    // "🔥🔥🔥 1:25" → strip → "" → 0 words
    const result = runPipeline("🔥🔥🔥 1:25", {
      ...baseSettings,
      dateFilterEnabled: false,
      wordCountMode: "max",
      wordCountValue: 3,
      stripEmoji: true,
    });
    assert.equal(result.hide, true);
  });

  it("preserves real words when stripping emoji + time", () => {
    // "nice song 😂 1:25" → strip → "nice song" → 2 words
    const result = runPipeline("nice song 😂 1:25", {
      ...baseSettings,
      dateFilterEnabled: false,
      wordCountMode: "max",
      wordCountValue: 3,
      stripEmoji: true,
    });
    assert.equal(result.hide, true);
  });

  it("keeps comment with enough real words despite emoji + time", () => {
    // "this is a nice song 😂 1:25" → strip → "this is a nice song" → 5 words
    const result = runPipeline("this is a nice song 😂 1:25", {
      ...baseSettings,
      dateFilterEnabled: false,
      wordCountMode: "max",
      wordCountValue: 3,
      stripEmoji: true,
    });
    assert.equal(result.hide, false);
  });
});
