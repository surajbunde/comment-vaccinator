import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { matchesContacts } from "../../src/matchers/contacts.js";

describe("matchesContacts", () => {
  it("matches an email address", () => {
    const r = matchesContacts("write to me at spam@example.com");
    assert.equal(r.matched, true);
    assert.equal(r.kind, "email");
  });

  it("matches an international phone number", () => {
    const r = matchesContacts("call +91 98765 43210 now");
    assert.equal(r.matched, true);
    assert.equal(r.kind, "phone");
  });

  it("matches a grouped national phone number", () => {
    assert.equal(matchesContacts("987 654 3210").matched, true);
  });

  it("matches a telegram handle", () => {
    assert.equal(matchesContacts("telegram: @spamuser").matched, true);
  });

  it("matches a whatsapp link", () => {
    assert.equal(matchesContacts("wa.me/919876543210").matched, true);
  });

  it("does not match a date", () => {
    assert.equal(matchesContacts("posted on 12/04/24").matched, false);
  });

  it("does not match a bare year or small number", () => {
    assert.equal(matchesContacts("made in 2024").matched, false);
    assert.equal(matchesContacts("top 10 songs").matched, false);
  });

  it("does not match a long digit run without separators", () => {
    assert.equal(matchesContacts("order 20240101123456").matched, false);
  });

  it("does not match an empty comment", () => {
    assert.equal(matchesContacts("").matched, false);
  });
});
