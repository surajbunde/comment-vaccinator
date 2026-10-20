import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { matchesSpamPunctuation } from "../../src/matchers/punctuation.js";

describe("matchesSpamPunctuation", () => {
  it("matches repeated exclamation marks", () => {
    const r = matchesSpamPunctuation("WOW!!!");
    assert.equal(r.matched, true);
    assert.equal(r.kind, "repeated-punctuation");
  });

  it("matches repeated question marks", () => {
    assert.equal(matchesSpamPunctuation("really???").matched, true);
  });

  it("matches four or more dots", () => {
    assert.equal(matchesSpamPunctuation("wait....").matched, true);
  });

  it("allows a normal ellipsis", () => {
    assert.equal(matchesSpamPunctuation("hmm... interesting").matched, false);
  });

  it("matches a repeated character", () => {
    assert.equal(matchesSpamPunctuation("sooooo good").matched, true);
  });

  it("matches a doubled word", () => {
    assert.equal(matchesSpamPunctuation("spam spam").matched, true);
  });

  it("does not match a legitimate doubled word", () => {
    assert.equal(matchesSpamPunctuation("that that was odd").matched, false);
  });

  it("matches spaced-out letters", () => {
    assert.equal(matchesSpamPunctuation("s u b s c r i b e").matched, true);
  });

  it("does not match a normal sentence", () => {
    assert.equal(matchesSpamPunctuation("This is a perfectly normal comment.").matched, false);
  });

  it("does not match an empty comment", () => {
    assert.equal(matchesSpamPunctuation("").matched, false);
  });

  it("does not match a single exclamation mark", () => {
    assert.equal(matchesSpamPunctuation("nice video!").matched, false);
  });
});
