import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { matchesLocaleDate, LOCALE_DATE_PATTERNS } from "../../src/matchers/dateLocales.js";

describe("matchesLocaleDate", () => {
  it("exposes a named pattern list", () => {
    assert.ok(Array.isArray(LOCALE_DATE_PATTERNS));
    assert.ok(LOCALE_DATE_PATTERNS.length >= 5);
    for (const entry of LOCALE_DATE_PATTERNS) {
      assert.equal(typeof entry.name, "string");
      assert.ok(entry.pattern instanceof RegExp);
    }
  });

  it("matches Spanish relative dates", () => {
    assert.equal(matchesLocaleDate("hace 3 días").matched, true);
    assert.equal(matchesLocaleDate("hace un mes").matched, true);
    assert.equal(matchesLocaleDate("hace rato").matched, true);
  });

  it("matches French relative dates", () => {
    assert.equal(matchesLocaleDate("il y a 2 ans").matched, true);
    assert.equal(matchesLocaleDate("il y a 3 semaines").matched, true);
    assert.equal(matchesLocaleDate("il y a un moment").matched, true);
  });

  it("matches German relative dates", () => {
    assert.equal(matchesLocaleDate("vor 3 Tagen").matched, true);
    assert.equal(matchesLocaleDate("vor einem Jahr").matched, true);
    assert.equal(matchesLocaleDate("letzte Woche").matched, true);
  });

  it("matches Portuguese relative dates", () => {
    assert.equal(matchesLocaleDate("há 2 dias").matched, true);
    assert.equal(matchesLocaleDate("há uma semana").matched, true);
  });

  it("matches Russian relative dates", () => {
    assert.equal(matchesLocaleDate("3 дня назад").matched, true);
    assert.equal(matchesLocaleDate("2 недели назад").matched, true);
  });

  it("matches a standalone relative word", () => {
    assert.equal(matchesLocaleDate("ayer en la plaza").matched, true);
    assert.equal(matchesLocaleDate("gestern Abend").matched, true);
  });

  it("matches a month name next to a number", () => {
    assert.equal(matchesLocaleDate("el 15 de enero de 2024").matched, true);
  });

  it("does not match a bare month word", () => {
    assert.equal(matchesLocaleDate("mein Name ist Mai").matched, false);
  });

  it("does not match an ordinary sentence", () => {
    assert.equal(matchesLocaleDate("this video is great").matched, false);
  });

  it("does not match an empty comment", () => {
    assert.equal(matchesLocaleDate("").matched, false);
  });
});
