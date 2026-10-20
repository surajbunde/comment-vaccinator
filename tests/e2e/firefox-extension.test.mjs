/**
 * @fileoverview Firefox end-to-end test for Comment Vaccinator.
 *
 * Drives a real Firefox through the Marionette protocol (which ships with
 * Firefox, so nothing has to be installed) against the built extension:
 *
 *   1. the popup renders the Spam Filters section
 *   2. every spam filter defaults to OFF
 *   3. toggling a filter persists to cv_spamFilters and updates the preview
 *   4. the MV2 content script filters comments on a local page
 *   5. the "hidden by filter" breakdown comes back with the right reason codes
 *   6. Export writes a config that contains the settings
 *   7. Import applies the imported settings
 *
 * Run with: npm run test:e2e:firefox
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import net from "node:net";
import { spawn } from "node:child_process";
import {
  READ_RESULTS_BODY,
  check,
  countMismatches,
  findBrowser,
  prepareExtension,
  printResults,
  section,
  startFakeYouTube,
  summary,
} from "./lib/harness.mjs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ------------------------------------------------------------------ */
/* marionette client                                                   */
/* ------------------------------------------------------------------ */

function marionette(port) {
  let buffer = Buffer.alloc(0);
  let nextId = 1;
  let socket = null;
  let dead = false;
  const pending = new Map();
  const ready = [];

  const onData = (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
    for (;;) {
      const colon = buffer.indexOf(0x3a); // ':'
      if (colon === -1) return;
      const length = parseInt(buffer.slice(0, colon).toString(), 10);
      if (isNaN(length) || buffer.length < colon + 1 + length) return;

      const message = JSON.parse(buffer.slice(colon + 1, colon + 1 + length).toString());
      buffer = buffer.slice(colon + 1 + length);

      if (!Array.isArray(message)) {
        ready.forEach((resolve) => resolve(message));
        continue;
      }
      const [, id, error, result] = message;
      if (error) {
        pending.get(id)?.reject(
          new Error(`${error.error || error}: ${error.message || (result && result.message) || ""}`)
        );
      } else {
        pending.get(id)?.resolve(result);
      }
      pending.delete(id);
    }
  };

  const connect = () =>
    new Promise((resolve, reject) => {
      dead = false;
      socket = net.connect(port, "127.0.0.1");
      socket.on("data", onData);
      socket.on("error", (err) => {
        dead = true;
        reject(err);
      });
      socket.once("connect", resolve);
    });

  const command = (name, params = {}) => {
    const id = nextId++;
    const payload = Buffer.from(JSON.stringify([0, id, name, params]), "utf8");
    socket.write(Buffer.concat([Buffer.from(`${payload.length}:`, "utf8"), payload]));
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      setTimeout(() => {
        if (pending.has(id)) {
          pending.delete(id);
          reject(new Error(`timeout: ${name}`));
        }
      }, 45000);
    });
  };

  return {
    command,
    ready: new Promise((resolve) => ready.push(resolve)),
    connect,
    close: () => socket.end(),
    get dead() {
      return dead;
    },
  };
}

/* ------------------------------------------------------------------ */
/* setup                                                               */
/* ------------------------------------------------------------------ */

const browserPath = findBrowser("firefox");
if (!browserPath) {
  console.error(
    "Firefox not found. Install Firefox or set FIREFOX_PATH to the binary."
  );
  process.exit(2);
}
console.log("firefox:", browserPath);

const extensionDir = prepareExtension("firefox");
const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), "cv-firefox-profile-"));
const fake = await startFakeYouTube();
console.log("fake youtube:", fake.url);

const MARIONETTE_PORT = 2828 + (process.pid % 200);
fs.writeFileSync(
  path.join(profileDir, "user.js"),
  [
    'user_pref("browser.shell.checkDefaultBrowser", false);',
    'user_pref("browser.startup.page", 0);',
    'user_pref("browser.aboutwelcome.enabled", false);',
    'user_pref("browser.startup.homepage_override.mstone", "ignore");',
    'user_pref("datareporting.policy.dataSubmissionEnabled", false);',
    'user_pref("datareporting.policy.dataSubmissionPolicyBypassNotification", true);',
    'user_pref("toolkit.telemetry.enabled", false);',
    'user_pref("browser.sessionstore.resume_from_crash", false);',
    'user_pref("browser.tabs.warnOnClose", false);',
    'user_pref("xpinstall.signatures.required", false);',
    'user_pref("extensions.autoDisableScopes", 0);',
    'user_pref("extensions.enabledScopes", 15);',
    `user_pref("marionette.port", ${MARIONETTE_PORT});`,
  ].join("\n")
);

const firefox = spawn(
  browserPath,
  [
    "-remote-allow-system-access",
    "--marionette",
    "--profile",
    profileDir,
    "--no-remote",
    "--headless",
    "about:blank",
  ],
  { stdio: "ignore" }
);

function cleanup() {
  try { firefox.kill(); } catch (_) {}
  try { fake.close(); } catch (_) {}
  try { fs.rmSync(profileDir, { recursive: true, force: true }); } catch (_) {}
}
process.on("exit", cleanup);
process.on("SIGINT", () => {
  cleanup();
  process.exit(130);
});

const mar = marionette(MARIONETTE_PORT);
for (let i = 0; i < 40; i++) {
  try { await mar.connect(); break; } catch (_) { await sleep(500); }
}
if (mar.dead) {
  console.error(`Marionette did not open on port ${MARIONETTE_PORT}.`);
  process.exit(2);
}
await mar.ready;
await mar.command("WebDriver:NewSession", { capabilities: { alwaysMatch: {} } });

const installed = await mar.command("Addon:Install", { path: extensionDir, temporary: true });
check("extension installs as a temporary add-on", installed.value === "comment-vaccinator@surajbunde", installed.value);

await mar.command("Marionette:SetContext", { value: "chrome" });
const uuids = await mar.command("WebDriver:ExecuteScript", {
  script: `return Services.prefs.getStringPref("extensions.webextensions.uuids");`,
  args: [],
});
const extensionId = JSON.parse(uuids.value)["comment-vaccinator@surajbunde"];
await mar.command("Marionette:SetContext", { value: "content" });
console.log("extension id:", extensionId);

const evaluate = async (script) => {
  const result = await mar.command("WebDriver:ExecuteScript", { script, args: [] });
  return result.value;
};

/* ------------------------------------------------------------------ */
/* 1. the popup                                                        */
/* ------------------------------------------------------------------ */

await mar.command("WebDriver:Navigate", { url: `moz-extension://${extensionId}/popup.html` });
await sleep(800);
const handles = await mar.command("WebDriver:GetWindowHandles", {});
const popupHandle = (Array.isArray(handles) ? handles : handles.value)[0];
for (let i = 0; i < 30; i++) {
  const ready = await evaluate(
    `return String(document.getElementById("spam-filters-section")?.dataset.enabled);`
  ).catch(() => "err");
  if (ready && ready !== "undefined" && ready !== "err") break;
  await sleep(400);
}

section("popup");
const initial = JSON.parse(
  await evaluate(`return JSON.stringify({
    section: !!document.getElementById("spam-filters-section"),
    toggles: ["linksEnabled","contactsEnabled","capsEnabled","punctuationEnabled","localesEnabled"]
               .map(id => id + "=" + document.getElementById(id).checked).join(","),
    breakdown: !!document.getElementById("reasonBreakdownRows"),
    capsDisabled: document.getElementById("capsMinLength").disabled
  });`)
);
check("popup renders the Spam Filters section", initial.section === true);
check(
  "all five spam filters default to OFF",
  initial.toggles ===
    "linksEnabled=false,contactsEnabled=false,capsEnabled=false,punctuationEnabled=false,localesEnabled=false",
  initial.toggles
);
check("hidden-by-filter breakdown exists", initial.breakdown === true);
check("dependent inputs start disabled", initial.capsDisabled === true);

/* ------------------------------------------------------------------ */
/* 2. drive the popup                                                  */
/* ------------------------------------------------------------------ */

await evaluate(`(() => {
  function on(id){ const el=document.getElementById(id); el.checked=true; el.dispatchEvent(new Event("change",{bubbles:true})); }
  ["linksEnabled","contactsEnabled","capsEnabled","punctuationEnabled","localesEnabled"].forEach(on);
  const d=document.getElementById("linksAllowedDomains"); d.value="youtube.com"; d.dispatchEvent(new Event("change",{bubbles:true}));
  return "ok";
})()`);
await sleep(1500);

const afterToggle = JSON.parse(
  await evaluate(`return new Promise(res => chrome.storage.local.get("cv_spamFilters", d => res(JSON.stringify({
    stored: JSON.parse(d.cv_spamFilters || "{}"),
    preview: document.getElementById("spamFiltersPreview").textContent,
    capsDisabled: document.getElementById("capsMinLength").disabled
  }))))`)
);
check(
  "toggling persists to cv_spamFilters",
  afterToggle.stored.linksEnabled === true &&
    afterToggle.stored.contactsEnabled === true &&
    afterToggle.stored.capsEnabled === true &&
    afterToggle.stored.punctuationEnabled === true &&
    afterToggle.stored.localesEnabled === true &&
    afterToggle.stored.linksAllowedDomains === "youtube.com",
  JSON.stringify(afterToggle.stored)
);
check(
  "section preview lists the active filters",
  afterToggle.preview === "links, contacts, caps, punctuation, locales",
  afterToggle.preview
);
check("dependent inputs enable with their filter", afterToggle.capsDisabled === false);

// the whitelist must be in place before the page loads
await evaluate(
  `return new Promise(res => chrome.storage.local.set({cv_whitelist:"analysis"}, () => res("ok")));`
);
await sleep(600);

/* ------------------------------------------------------------------ */
/* 3. the content script on a local page                               */
/* ------------------------------------------------------------------ */

const newTab = await mar.command("WebDriver:NewWindow", { type: "tab" });
await sleep(600);
const localHandle = (newTab && (newTab.handle || (newTab.value && newTab.value.handle))) || null;
if (localHandle) await mar.command("WebDriver:SwitchToWindow", { handle: localHandle });
await mar.command("WebDriver:Navigate", { url: fake.url });
await sleep(3000);

section("content script");
const pageState = JSON.parse(
  await evaluate(`return JSON.stringify({
    url: location.href,
    threads: document.querySelectorAll("ytd-comment-thread-renderer").length,
    processed: document.querySelectorAll("[data-cv-processed]").length
  });`)
);
console.log("  page:", JSON.stringify(pageState));
const rows = JSON.parse(await evaluate(`return ${READ_RESULTS_BODY};`));
printResults(rows);
const mismatches = countMismatches(rows);
check("every filter fires with the right reason code", mismatches === 0, `${mismatches} mismatch(es)`);



/* ------------------------------------------------------------------ */
/* 4. export / import                                                  */
/* ------------------------------------------------------------------ */

// back to the popup tab — chrome.* is only available in an extension page
await mar.command("WebDriver:SwitchToWindow", { handle: popupHandle });
await sleep(800);
const stats = JSON.parse(
  await evaluate(`return new Promise(res => chrome.tabs.query({}, tabs => {
    const t = tabs.find(x => (x.url||"").includes("localhost"));
    if (!t) return res(JSON.stringify({error:"no local tab"}));
    return chrome.tabs.sendMessage(t.id, {type:"GET_COUNTS"}, r => res(JSON.stringify(r)));
  }));`)
);
check(
  "stats include the byReason breakdown",
  !!stats.byReason && Object.keys(stats.byReason).length > 0,
  JSON.stringify(stats.byReason)
);

section("export / import");
const exported = JSON.parse(
  await evaluate(`return new Promise(res => {
    let captured = null;
    const create = URL.createObjectURL;
    const revoke = URL.revokeObjectURL;
    URL.createObjectURL = b => { captured = b; return "blob:stub"; };
    URL.revokeObjectURL = () => {};
    document.getElementById("export-btn").click();
    setTimeout(async () => {
      URL.createObjectURL = create;
      URL.revokeObjectURL = revoke;
      if (!captured) return res(JSON.stringify({error:"no blob"}));
      const text = await captured.text();
      let parsed = null;
      try { parsed = JSON.parse(text); } catch (e) {}
      res(JSON.stringify({
        size: captured.size,
        hasSettings: !!(parsed && parsed.settings),
        count: parsed && parsed.settings ? Object.keys(parsed.settings).length : 0,
        spamFilters: parsed && parsed.settings ? parsed.settings.cv_spamFilters : null
      }));
    }, 800);
  });`)
);
check(
  "export writes a config that contains the settings",
  exported.hasSettings === true && exported.count > 0,
  JSON.stringify(exported)
);
check(
  "export includes the spam filter settings",
  typeof exported.spamFilters === "string" && exported.spamFilters.includes("linksEnabled")
);

await evaluate(`(() => {
  window.confirm = () => true;
  const file = new File([JSON.stringify({_meta:{schema:1}, settings:{cv_blacklist:"imported-value"}})], "c.json", {type:"application/json"});
  const dt = new DataTransfer();
  dt.items.add(file);
  const input = document.getElementById("import-file");
  input.files = dt.files;
  input.dispatchEvent(new Event("change", {bubbles:true}));
  return "triggered";
})()`).catch(() => {});
await sleep(3000);

const imported = await evaluate(
  `return new Promise(res => chrome.storage.local.get(["cv_blacklist"], d => res(d.cv_blacklist)));`
);
check("import applies the imported settings", imported === "imported-value", imported);

/* ------------------------------------------------------------------ */
/* 5. screenshot                                                       */
/* ------------------------------------------------------------------ */

const shot = await mar.command("WebDriver:TakeScreenshot", { full: true, hash: false });
const outDir = path.join(process.cwd(), "build", "screenshots");
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "popup-e2e-firefox.png");
fs.writeFileSync(outFile, Buffer.from(shot.value, "base64"));
console.log("\nscreenshot:", path.relative(process.cwd(), outFile));

mar.close();
cleanup();
process.exit(summary());
