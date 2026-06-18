import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  parseKeywordList,
  matchesBlacklist,
  matchesWhitelist,
} from "../../src/matchers/keywords.js";

describe("parseKeywordList", () => {
  it("parses comma-separated keywords", () => {
    assert.deepEqual(parseKeywordList("ad, sponsor, first"), [
      "ad",
      "sponsor",
      "first",
    ]);
  });

  it("trims whitespace and lowercases", () => {
    assert.deepEqual(parseKeywordList("  Hello , WORLD  "), ["hello", "world"]);
  });

  it("filters empty entries", () => {
    assert.deepEqual(parseKeywordList("ad,, , sponsor"), ["ad", "sponsor"]);
  });

  it("returns empty array for empty string", () => {
    assert.deepEqual(parseKeywordList(""), []);
  });
});

describe("matchesBlacklist", () => {
  it("matches a keyword in text", () => {
    const result = matchesBlacklist("Please subscribe for more", ["subscribe", "ad"]);
    assert.equal(result.matched, true);
    assert.equal(result.keyword, "subscribe");
  });

  it("is case-insensitive", () => {
    const result = matchesBlacklist("SPAM message", ["spam"]);
    assert.equal(result.matched, true);
  });

  it("returns no match when keyword not found", () => {
    const result = matchesBlacklist("Great video!", ["ad", "spam"]);
    assert.equal(result.matched, false);
    assert.equal(result.keyword, null);
  });

  it("returns no match for empty blacklist", () => {
    const result = matchesBlacklist("anything", []);
    assert.equal(result.matched, false);
  });
});

describe("matchesWhitelist", () => {
  it("matches a whitelist keyword", () => {
    const result = matchesWhitelist(
      "I did a breakdown of this 3 years ago",
      ["breakdown"]
    );
    assert.equal(result.protected, true);
    assert.equal(result.keyword, "breakdown");
  });

  it("is case-insensitive", () => {
    const result = matchesWhitelist("ANALYSIS of the song", ["analysis"]);
    assert.equal(result.protected, true);
  });

  it("returns no match when keyword not found", () => {
    const result = matchesWhitelist("Great video!", ["breakdown", "analysis"]);
    assert.equal(result.protected, false);
    assert.equal(result.keyword, null);
  });

  it("returns no match for empty whitelist", () => {
    const result = matchesWhitelist("anything", []);
    assert.equal(result.protected, false);
  });

  it("whitelist overrides blacklist (via pipeline test)", () => {
    // This tests the concept - actual pipeline test is in pipeline.test.js
    const wl = matchesWhitelist("breakdown of the video 3 years ago", ["breakdown"]);
    const bl = matchesBlacklist("breakdown of the video 3 years ago", ["breakdown"]);
    assert.equal(wl.protected, true);
    assert.equal(bl.matched, true);
    // In pipeline, whitelist wins
  });
});
