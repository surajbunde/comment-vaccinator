import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  stripEmoji,
  countWords,
  matchesWordCount,
} from "../../src/matchers/wordCount.js";

describe("stripEmoji", () => {
  it("removes emoji characters", () => {
    assert.equal(stripEmoji("Hello 😂 World"), "Hello  World");
  });

  it("removes time patterns like 1:25", () => {
    assert.equal(stripEmoji("1:25"), "");
  });

  it("removes time patterns like 10:30 AM", () => {
    assert.equal(stripEmoji("10:30 AM"), "");
  });

  it("removes time patterns like 2:15pm", () => {
    assert.equal(stripEmoji("2:15pm"), "");
  });

  it("removes emoji + time together", () => {
    assert.equal(stripEmoji("😂 1:25"), "");
  });

  it("removes emoji + time + preserves real text", () => {
    assert.equal(stripEmoji("nice song 😂 1:25"), "nice song");
  });

  it("removes punctuation", () => {
    assert.equal(stripEmoji("hello, world!"), "hello world");
  });

  it("handles empty string", () => {
    assert.equal(stripEmoji(""), "");
  });

  it("preserves plain text", () => {
    assert.equal(stripEmoji("hello world"), "hello world");
  });

  it("preserves text with colons in non-time context", () => {
    assert.equal(stripEmoji("ratio: 100 likes"), "ratio 100 likes");
  });
});

describe("countWords", () => {
  it("counts words in normal text", () => {
    assert.equal(countWords("hello world"), 2);
  });

  it("counts single word", () => {
    assert.equal(countWords("hello"), 1);
  });

  it("handles extra whitespace", () => {
    assert.equal(countWords("  hello   world  "), 2);
  });

  it("returns 0 for empty string", () => {
    assert.equal(countWords(""), 0);
  });

  it("handles multiple spaces", () => {
    assert.equal(countWords("one two three"), 3);
  });
});

describe("matchesWordCount", () => {
  it("returns false when mode is off", () => {
    const result = matchesWordCount("hi", { mode: "off", threshold: 5, stripEmoji: false });
    assert.equal(result.matched, false);
  });

  it("max mode: hides short comments", () => {
    const result = matchesWordCount("hi", { mode: "max", threshold: 5, stripEmoji: false });
    assert.equal(result.matched, true);
    assert.equal(result.wordCount, 1);
  });

  it("max mode: keeps long comments", () => {
    const result = matchesWordCount("this is a long comment with many words", {
      mode: "max",
      threshold: 5,
      stripEmoji: false,
    });
    assert.equal(result.matched, false);
    assert.equal(result.wordCount, 8);
  });

  it("min mode: hides long comments", () => {
    const result = matchesWordCount("this is a long comment with many words", {
      mode: "min",
      threshold: 5,
      stripEmoji: false,
    });
    assert.equal(result.matched, true);
  });

  it("min mode: keeps short comments", () => {
    const result = matchesWordCount("hi world", {
      mode: "min",
      threshold: 5,
      stripEmoji: false,
    });
    assert.equal(result.matched, false);
    assert.equal(result.wordCount, 2);
  });

  it("stripEmoji: emoji-heavy comment has low word count", () => {
    const result = matchesWordCount("😂 😂 😂 😂 😂", {
      mode: "max",
      threshold: 3,
      stripEmoji: true,
    });
    assert.equal(result.matched, true);
    assert.equal(result.wordCount, 0);
  });

  it("stripEmoji: real text survives stripping", () => {
    const result = matchesWordCount("hello world how are you today", {
      mode: "max",
      threshold: 3,
      stripEmoji: true,
    });
    assert.equal(result.matched, false);
  });
});
