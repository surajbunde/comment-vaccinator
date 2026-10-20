import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

/**
 * The popup is a plain script, so it is loaded into a sandbox instead of
 * being imported. Only the top-level helpers are exercised; the
 * DOMContentLoaded callback never runs because the stub document ignores it.
 */
function loadPopup(chromeMock) {
  const source = fs.readFileSync(new URL("../../popup.js", import.meta.url), "utf8");
  const sandbox = {
    chrome: chromeMock,
    document: { addEventListener() {} },
    window: { addEventListener() {} },
    console,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox);
  return sandbox;
}

/** Firefox's chrome.* namespace is callback-only and returns undefined. */
function firefoxChrome() {
  const calls = { get: [], set: [] };
  return {
    calls,
    storage: {
      local: {
        get(keys, callback) {
          calls.get.push(keys);
          if (typeof callback !== "function") return undefined; // Firefox behaviour
          callback({ cv_dateFilterEnabled: false });
        },
        set(items, callback) {
          calls.set.push(items);
          if (typeof callback === "function") callback();
          return undefined; // Firefox behaviour
        },
      },
    },
  };
}

/** Chrome's chrome.* namespace supports promises and callbacks. */
function chromeChrome() {
  const calls = { get: [], set: [] };
  return {
    calls,
    storage: {
      local: {
        get(keys, callback) {
          calls.get.push(keys);
          const value = { cv_dateFilterEnabled: true };
          if (typeof callback === "function") {
            callback(value);
            return undefined;
          }
          return Promise.resolve(value);
        },
        set(items, callback) {
          calls.set.push(items);
          if (typeof callback === "function") {
            callback();
            return undefined;
          }
          return Promise.resolve();
        },
      },
    },
  };
}

describe("cross-browser storage helpers", () => {
  it("exposes storageGet and storageSet", () => {
    const popup = loadPopup(firefoxChrome());
    assert.equal(typeof popup.storageGet, "function");
    assert.equal(typeof popup.storageSet, "function");
  });

  it("storageGet resolves in Firefox, where chrome.storage returns undefined", async () => {
    const mock = firefoxChrome();
    const popup = loadPopup(mock);
    const value = await popup.storageGet(["cv_dateFilterEnabled"]);
    assert.deepEqual(value, { cv_dateFilterEnabled: false });
    assert.deepEqual(mock.calls.get, [["cv_dateFilterEnabled"]]);
  });

  it("storageGet resolves in Chrome too", async () => {
    const mock = chromeChrome();
    const popup = loadPopup(mock);
    const value = await popup.storageGet(["cv_dateFilterEnabled"]);
    assert.deepEqual(value, { cv_dateFilterEnabled: true });
  });

  it("storageSet writes in Firefox", async () => {
    const mock = firefoxChrome();
    const popup = loadPopup(mock);
    await popup.storageSet({ cv_blacklist: "spam" });
    assert.deepEqual(mock.calls.set, [{ cv_blacklist: "spam" }]);
  });

  it("storageSet writes in Chrome too", async () => {
    const mock = chromeChrome();
    const popup = loadPopup(mock);
    await popup.storageSet({ cv_blacklist: "spam" });
    assert.deepEqual(mock.calls.set, [{ cv_blacklist: "spam" }]);
  });

  it("resolves even when the browser returns undefined synchronously", async () => {
    const popup = loadPopup(firefoxChrome());
    const value = await popup.storageGet(["anything"]);
    assert.ok(value, "storageGet must never resolve to undefined");
  });
});
