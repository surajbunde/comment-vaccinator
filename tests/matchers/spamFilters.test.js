import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runSpamFilters, DEFAULT_SPAM_SETTINGS } from "../../src/matchers/spamFilters.js";

const ALL_ON = {
  linksEnabled: true,
  linksAllowedDomains: "",
  contactsEnabled: true,
  capsEnabled: true,
  capsMinLength: 15,
  punctuationEnabled: true,
  localesEnabled: true,
};

describe("DEFAULT_SPAM_SETTINGS", () => {
  it("has every filter disabled by default", () => {
    assert.equal(DEFAULT_SPAM_SETTINGS.linksEnabled, false);
    assert.equal(DEFAULT_SPAM_SETTINGS.contactsEnabled, false);
    assert.equal(DEFAULT_SPAM_SETTINGS.capsEnabled, false);
    assert.equal(DEFAULT_SPAM_SETTINGS.punctuationEnabled, false);
    assert.equal(DEFAULT_SPAM_SETTINGS.localesEnabled, false);
    assert.equal(DEFAULT_SPAM_SETTINGS.capsMinLength, 15);
  });
});

describe("runSpamFilters", () => {
  it("returns null when every filter is disabled", () => {
    assert.equal(runSpamFilters("https://spam.com", DEFAULT_SPAM_SETTINGS), null);
  });

  it("matches links when enabled", () => {
    const r = runSpamFilters("https://spam.com", { ...DEFAULT_SPAM_SETTINGS, linksEnabled: true });
    assert.equal(r.hide, true);
    assert.equal(r.reasonCode, "links");
    assert.equal(r.patternName, "links");
  });

  it("matches contacts when enabled", () => {
    const r = runSpamFilters("mail me at a@b.com", {
      ...DEFAULT_SPAM_SETTINGS,
      contactsEnabled: true,
    });
    assert.equal(r.reasonCode, "contacts");
  });

  it("matches caps when enabled", () => {
    const r = runSpamFilters("WHY IS NOBODY TALKING ABOUT THIS", {
      ...DEFAULT_SPAM_SETTINGS,
      capsEnabled: true,
    });
    assert.equal(r.reasonCode, "caps");
  });

  it("matches punctuation when enabled", () => {
    const r = runSpamFilters("WOW!!!", {
      ...DEFAULT_SPAM_SETTINGS,
      punctuationEnabled: true,
    });
    assert.equal(r.reasonCode, "punctuation");
  });

  it("matches locale dates when enabled", () => {
    const r = runSpamFilters("hace 3 días", {
      ...DEFAULT_SPAM_SETTINGS,
      localesEnabled: true,
    });
    assert.equal(r.reasonCode, "locale-date");
  });

  it("returns null for a clean comment with everything enabled", () => {
    assert.equal(runSpamFilters("This is a perfectly normal comment.", ALL_ON), null);
  });

  it("returns null for an empty comment", () => {
    assert.equal(runSpamFilters("", ALL_ON), null);
  });

  it("falls back to the defaults when settings are missing", () => {
    assert.equal(runSpamFilters("https://spam.com", {}), null);
  });

  it("reports contacts before links when both would match", () => {
    const r = runSpamFilters("https://spam.com mail a@b.com", ALL_ON);
    assert.equal(r.reasonCode, "contacts");
  });

  it("reports an email address as a contact, not as a link", () => {
    const r = runSpamFilters("mail me at promo@example.com", ALL_ON);
    assert.equal(r.reasonCode, "contacts");
  });

  it("still reports a plain link as a link", () => {
    const r = runSpamFilters("check https://spam.example.com now", ALL_ON);
    assert.equal(r.reasonCode, "links");
  });
});
