import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { matchesCaps, DEFAULT_MIN_LETTERS } from "../../src/matchers/caps.js";

describe("matchesCaps", () => {
  it("matches a shouting comment", () => {
    assert.equal(
      matchesCaps("WHY IS NOBODY TALKING ABOUT THIS VIDEO", { minLength: 15 }).matched,
      true
    );
  });

  it("matches a short caps burst with enough letters", () => {
    assert.equal(matchesCaps("I LOVE THIS VIDEO SO MUCH", { minLength: 15 }).matched, true);
  });

  it("does not match a normal sentence", () => {
    assert.equal(
      matchesCaps("why is nobody talking about this video", { minLength: 15 }).matched,
      false
    );
  });

  it("does not match a mixed-case sentence with one acronym", () => {
    assert.equal(
      matchesCaps("NASA released new footage and it looks great", { minLength: 15 }).matched,
      false
    );
  });

  it("does not match caps text below the minimum length", () => {
    assert.equal(matchesCaps("LOL NICE", { minLength: 15 }).matched, false);
  });

  it("respects a raised minimum length", () => {
    assert.equal(matchesCaps("WHY IS NOBODY TALKING", { minLength: 30 }).matched, false);
  });

  it("uses the default minimum length when no option is given", () => {
    assert.equal(DEFAULT_MIN_LETTERS, 15);
    assert.equal(matchesCaps("LOL NICE").matched, false);
    assert.equal(matchesCaps("WHY IS NOBODY TALKING ABOUT THIS").matched, true);
  });

  it("does not match an empty comment", () => {
    assert.equal(matchesCaps("", { minLength: 15 }).matched, false);
  });

  it("does not match a comment with no letters", () => {
    assert.equal(matchesCaps("12345 67890 !!!", { minLength: 15 }).matched, false);
  });
});
