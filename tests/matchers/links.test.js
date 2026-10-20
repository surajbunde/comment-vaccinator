import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { extractLinks, matchesLinks } from "../../src/matchers/links.js";

describe("extractLinks", () => {
  it("finds https urls", () => {
    assert.deepEqual(extractLinks("visit https://example.com now"), [
      { url: "https://example.com", hostname: "example.com" },
    ]);
  });

  it("finds www urls", () => {
    assert.equal(extractLinks("go to www.example.com").length, 1);
  });

  it("finds bare domains", () => {
    assert.equal(extractLinks("check example.com").length, 1);
  });

  it("finds shortener links", () => {
    assert.equal(extractLinks("bit.ly/abc123").length, 1);
  });

  it("ignores plain words and numbers", () => {
    assert.deepEqual(extractLinks("top 10 songs"), []);
    assert.deepEqual(extractLinks("no link here"), []);
    assert.deepEqual(extractLinks("version 2.0.1"), []);
  });

  it("returns an empty list for an empty comment", () => {
    assert.deepEqual(extractLinks(""), []);
  });
});

describe("matchesLinks", () => {
  it("matches a comment containing a link", () => {
    const r = matchesLinks("join us https://spam.com", []);
    assert.equal(r.matched, true);
    assert.equal(r.hostname, "spam.com");
  });

  it("does not match a comment without a link", () => {
    assert.equal(matchesLinks("no links here", []).matched, false);
  });

  it("allows a domain on the allow-list", () => {
    const r = matchesLinks("see https://www.youtube.com/watch", ["youtube.com"]);
    assert.equal(r.matched, false);
  });

  it("allows subdomains of an allow-listed domain", () => {
    assert.equal(matchesLinks("https://m.youtube.com/x", ["youtube.com"]).matched, false);
  });

  it("still matches a different domain", () => {
    assert.equal(matchesLinks("https://spam.com", ["youtube.com"]).matched, true);
  });

  it("treats an empty allow-list as allowing nothing", () => {
    assert.equal(matchesLinks("https://spam.com", "").matched, true);
  });
});
