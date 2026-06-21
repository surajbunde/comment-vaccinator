import { describe, it } from "node:test";
import assert from "node:assert/strict";

const EXPORT_KEYS = [
  "cv_dateFilterEnabled",
  "cv_wordCountMode",
  "cv_wordCountValue",
  "cv_stripEmoji",
  "cv_keywordEnabled",
  "cv_blacklist",
  "cv_whitelist",
  "cv_emojiOnlyEnabled",
  "cv_customPatternsEnabled",
  "cv_customPatterns",
];

const ALLOWED_KEYS = new Set(EXPORT_KEYS);

function validateImportPayload(payload) {
  if (!payload._meta || !payload.settings || payload._meta.schema !== 1) {
    return { valid: false, error: "Unrecognised config format." };
  }

  const safeSettings = {};
  for (const [key, value] of Object.entries(payload.settings)) {
    if (ALLOWED_KEYS.has(key)) {
      safeSettings[key] = value;
    }
  }

  if (Object.keys(safeSettings).length === 0) {
    return { valid: false, error: "No valid settings found." };
  }

  if (safeSettings.cv_customPatterns) {
    try {
      const patterns = JSON.parse(safeSettings.cv_customPatterns);
      for (const p of patterns) {
        new RegExp(p.patternSource, p.flags || "");
      }
    } catch (e) {
      return { valid: false, error: `Invalid custom patterns: ${e.message}` };
    }
  }

  return { valid: true, safeSettings };
}

describe("Export/Import Settings", () => {
  describe("validateImportPayload", () => {
    it("accepts valid payload with schema 1", () => {
      const payload = {
        _meta: { schema: 1, exportedAt: "2024-01-01T00:00:00.000Z" },
        settings: { cv_dateFilterEnabled: true },
      };
      const result = validateImportPayload(payload);
      assert.equal(result.valid, true);
      assert.deepEqual(result.safeSettings, { cv_dateFilterEnabled: true });
    });

    it("rejects payload with unknown schema", () => {
      const payload = {
        _meta: { schema: 99 },
        settings: { cv_dateFilterEnabled: true },
      };
      const result = validateImportPayload(payload);
      assert.equal(result.valid, false);
      assert.ok(result.error.includes("Unrecognised"));
    });

    it("rejects payload without _meta", () => {
      const payload = {
        settings: { cv_dateFilterEnabled: true },
      };
      const result = validateImportPayload(payload);
      assert.equal(result.valid, false);
    });

    it("rejects payload without settings", () => {
      const payload = {
        _meta: { schema: 1 },
      };
      const result = validateImportPayload(payload);
      assert.equal(result.valid, false);
    });

    it("filters out unknown keys", () => {
      const payload = {
        _meta: { schema: 1 },
        settings: {
          cv_dateFilterEnabled: true,
          maliciousKey: "should be removed",
          cv_blacklist: "spam",
        },
      };
      const result = validateImportPayload(payload);
      assert.equal(result.valid, true);
      assert.equal(result.safeSettings.maliciousKey, undefined);
      assert.equal(result.safeSettings.cv_dateFilterEnabled, true);
      assert.equal(result.safeSettings.cv_blacklist, "spam");
    });

    it("rejects empty settings after filtering", () => {
      const payload = {
        _meta: { schema: 1 },
        settings: { unknownKey: "value" },
      };
      const result = validateImportPayload(payload);
      assert.equal(result.valid, false);
      assert.ok(result.error.includes("No valid"));
    });

    it("validates custom patterns regex", () => {
      const payload = {
        _meta: { schema: 1 },
        settings: {
          cv_customPatterns: JSON.stringify([
            { name: "test", patternSource: "[invalid", flags: "i" },
          ]),
        },
      };
      const result = validateImportPayload(payload);
      assert.equal(result.valid, false);
      assert.ok(result.error.includes("Invalid custom patterns"));
    });

    it("accepts valid custom patterns", () => {
      const payload = {
        _meta: { schema: 1 },
        settings: {
          cv_customPatterns: JSON.stringify([
            { name: "test", patternSource: "\\bfirst\\b", flags: "i" },
          ]),
        },
      };
      const result = validateImportPayload(payload);
      assert.equal(result.valid, true);
    });

    it("excludes cv_perVideoDisabled from export keys", () => {
      assert.ok(!EXPORT_KEYS.includes("cv_perVideoDisabled"));
    });

    it("excludes cv_currentVideoId from export keys", () => {
      assert.ok(!EXPORT_KEYS.includes("cv_currentVideoId"));
    });
  });
});
