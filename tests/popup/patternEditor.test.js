import { describe, it } from "node:test";
import assert from "node:assert/strict";

function validateRegex(source, flags) {
  try {
    new RegExp(source, flags);
    return { valid: true, error: null };
  } catch (e) {
    return { valid: false, error: e.message };
  }
}

describe("validateRegex", () => {
  it("accepts valid simple pattern", () => {
    const result = validateRegex("\\btest\\b", "i");
    assert.equal(result.valid, true);
    assert.equal(result.error, null);
  });

  it("accepts valid complex pattern", () => {
    const result = validateRegex("hace \\d+ horas", "i");
    assert.equal(result.valid, true);
  });

  it("accepts empty flags", () => {
    const result = validateRegex("test", "");
    assert.equal(result.valid, true);
  });

  it("rejects unclosed group", () => {
    const result = validateRegex("[invalid", "");
    assert.equal(result.valid, false);
    assert.equal(typeof result.error, "string");
    assert.ok(result.error.length > 0);
  });

  it("rejects invalid flags", () => {
    const result = validateRegex("test", "z");
    assert.equal(result.valid, false);
  });

  it("accepts multiple flags", () => {
    const result = validateRegex("test", "gi");
    assert.equal(result.valid, true);
  });

  it("rejects unmatched parenthesis", () => {
    const result = validateRegex("(abc", "");
    assert.equal(result.valid, false);
  });

  it("accepts escaped characters", () => {
    const result = validateRegex("\\d+\\.\\d+", "");
    assert.equal(result.valid, true);
  });

  it("accepts Unicode escape", () => {
    const result = validateRegex("\\u0041+", "");
    assert.equal(result.valid, true);
  });
});

describe("custom pattern matching via regex", () => {
  it("matches Spanish time pattern", () => {
    const regex = /hace \d+ horas/i;
    assert.equal(regex.test("hace 3 horas"), true);
    assert.equal(regex.test("hace 12 horas"), true);
    assert.equal(regex.test("great video"), false);
  });

  it("matches case-insensitive pattern", () => {
    const regex = /spam/i;
    assert.equal(regex.test("SPAM comment"), true);
    assert.equal(regex.test("Spam here"), true);
    assert.equal(regex.test("great content"), false);
  });

  it("matches word boundary pattern", () => {
    const regex = /\bad\b/i;
    assert.equal(regex.test("this is an ad"), true);
    assert.equal(regex.test("advert"), false);
    assert.equal(regex.test("add more"), false);
  });
});
