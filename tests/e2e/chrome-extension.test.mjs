/**
 * @fileoverview Chrome end-to-end test for Comment Vaccinator.
 *
 * Drives a real Chrome through the DevTools Protocol (no test framework
 * needed) against the built extension:
 *
 *   1. the popup renders the Spam Filters section
 *   2. every spam filter defaults to OFF
 *   3. toggling a filter persists to cv_spamFilters and updates the preview
 *   4. the MV3 content script filters comments on a local page
 *   5. the "hidden by filter" breakdown comes back with the right reason codes
 *   6. Export writes a config that contains the settings
 *   7. Import applies the imported settings
 *
 * Run with: npm run test:e2e:chrome
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
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
/* minimal DevTools Protocol client                                   */
/* ------------------------------------------------------------------ */

function cdpClient(url) {
  const ws = new WebSocket(url);
  let nextId = 1;
  const pending = new Map();
  const listeners = [];

  ws.addEventListener("message", (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(`${msg.error.message} (${msg.error.code})`));
      else resolve(msg.result);
    } else if (msg.method) {
      for (const listener of listeners) listener(msg);
    }
  });

  const ready = new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", () => reject(new Error("CDP socket error")), { once: true });
  });

  function send(method, params = {}, sessionId) {
    const id = nextId++;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify(payload));
      setTimeout(() => {
        if (pending.has(id)) {
          pending.delete(id);
          reject(new Error(`CDP timeout: ${method}`));
        }
      }, 30000);
    });
  }

  return { ready, send, on: (fn) => listeners.push(fn), close: () => ws.close() };
}

/* ------------------------------------------------------------------ */
/* launch                                                              */
/* ------------------------------------------------------------------ */

const browserPath = findBrowser("chrome");
if (!browserPath) {
  console.error(
    "Chrome not found. Install Chrome/Edge/Brave or set CHROME_PATH to the binary."
  );
  process.exit(2);
}
console.log("chrome:", browserPath);

const extensionDir = prepareExtension("chrome");
const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "cv-chrome-profile-"));
const fake = await startFakeYouTube();
console.log("fake youtube:", fake.url);

const chrome = spawn(
  browserPath,
  [
    "--headless=new",
    `--user-data-dir=${userDataDir}`,
    "--remote-debugging-port=0",
    // Chrome 137+ ignores --load-extension unless unsafe extension debugging
    // is enabled; the extension is installed over CDP instead (see below).
    "--enable-unsafe-extension-debugging",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-background-networking",
    "--disable-component-update",
    "--window-size=380,900",
    "about:blank",
  ],
  { stdio: "ignore" }
);

function cleanup() {
  try { chrome.kill(); } catch (_) {}
  try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (_) {}
  try { fake.close(); } catch (_) {}
}
process.on("exit", cleanup);
process.on("SIGINT", () => { cleanup(); process.exit(130); });

// Chrome writes the debugging port into DevToolsActivePort
let wsUrl = null;
for (let i = 0; i < 60; i++) {
  const portFile = path.join(userDataDir, "DevToolsActivePort");
  if (fs.existsSync(portFile)) {
    const [port] = fs.readFileSync(portFile, "utf8").split("\n");
    try {
      const res = await fetch(`http://127.0.0.1:${port.trim()}/json/version`);
      const info = await res.json();
      if (info.webSocketDebuggerUrl) {
        wsUrl = info.webSocketDebuggerUrl;
        break;
      }
    } catch (_) {}
  }
  await sleep(300);
}
if (!wsUrl) {
  console.error("Could not reach the DevTools endpoint.");
  process.exit(2);
}

const cdp = cdpClient(wsUrl);
await cdp.ready;

// Install the unpacked extension. Chrome 137+ ignores --load-extension, so
// the Extensions domain is used instead (needs --enable-unsafe-extension-debugging).
const install = await cdp.send("Extensions.loadUnpacked", { path: extensionDir });
if (install.error) {
  console.error("could not load the extension:", install.error.message);
  process.exit(2);
}
// The id returned by loadUnpacked is the extension's chrome-extension:// id.
const extensionId = install.id;
console.log("extension id:", extensionId);

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

async function openPage(url) {
  const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
  await cdp.send("Page.enable", {}, sessionId);
  await cdp.send("Runtime.enable", {}, sessionId);

  const loaded = new Promise((resolve) => {
    cdp.on((msg) => {
      if (msg.method === "Page.loadEventFired" && msg.sessionId === sessionId) resolve();
    });
  });
  await cdp.send("Page.navigate", { url }, sessionId);
  await Promise.race([loaded, sleep(15000)]);
  return sessionId;
}

async function evaluate(sessionId, expression) {
  const result = await cdp.send(
    "Runtime.evaluate",
    { expression, awaitPromise: true, returnByValue: true },
    sessionId
  );
  if (result.exceptionDetails) {
    const details = result.exceptionDetails;
    throw new Error(
      details.exception?.description || details.text || "evaluate failed"
    );
  }
  return result.result?.value;
}

/** Polls an expression until it returns a truthy value. */
async function waitFor(sessionId, expression, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const value = await evaluate(sessionId, expression).catch(() => null);
    if (value) return value;
    await sleep(250);
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* 1. the popup                                                        */
/* ------------------------------------------------------------------ */

const popupSession = await openPage(`chrome-extension://${extensionId}/popup.html`);
const popupReady = await waitFor(popupSession, `!!document.getElementById("spam-filters-section")`);
if (!popupReady) {
  const where = await evaluate(
    popupSession,
    `JSON.stringify({url: location.href, title: document.title, body: document.body ? document.body.innerHTML.slice(0,200) : "none"})`
  );
  console.error("popup did not load:", where);
  process.exit(2);
}

section("popup");
const initial = JSON.parse(
  await evaluate(
    popupSession,
    `JSON.stringify({
      section: !!document.getElementById("spam-filters-section"),
      toggles: ["linksEnabled","contactsEnabled","capsEnabled","punctuationEnabled","localesEnabled"]
                 .map(id => id + "=" + document.getElementById(id).checked).join(","),
      breakdown: !!document.getElementById("reasonBreakdownRows"),
      capsDisabled: document.getElementById("capsMinLength").disabled
    })`
  )
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

await evaluate(
  popupSession,
  `(() => {
     function on(id){const el=document.getElementById(id);el.checked=true;el.dispatchEvent(new Event("change",{bubbles:true}));}
     ["linksEnabled","contactsEnabled","capsEnabled","punctuationEnabled","localesEnabled"].forEach(on);
     const d=document.getElementById("linksAllowedDomains");d.value="youtube.com";d.dispatchEvent(new Event("change",{bubbles:true}));
     return "ok";
   })()`
);
await sleep(800);

const afterToggle = JSON.parse(
  await evaluate(
    popupSession,
    `new Promise(res => chrome.storage.local.get("cv_spamFilters", d => res(JSON.stringify({
      stored: JSON.parse(d.cv_spamFilters || "{}"),
      preview: document.getElementById("spamFiltersPreview").textContent,
      capsDisabled: document.getElementById("capsMinLength").disabled
    }))))`
  )
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

/* ------------------------------------------------------------------ */
/* 3. the content script on a local page                               */
/* ------------------------------------------------------------------ */

// whitelist + settings must be in place before the page loads
await evaluate(
  popupSession,
  `new Promise(res => chrome.storage.local.set({cv_whitelist:"analysis"}, () => res("ok")))`
);

const pageSession = await openPage(fake.url);
await waitFor(pageSession, `document.querySelectorAll("ytd-comment-thread-renderer").length > 0`);
await sleep(1500);

section("content script");
const rows = JSON.parse(await evaluate(pageSession, READ_RESULTS_BODY));
printResults(rows);
const mismatches = countMismatches(rows);
check("every filter fires with the right reason code", mismatches === 0, `${mismatches} mismatch(es)`);

const stats = JSON.parse(
  await evaluate(
    popupSession,
    `new Promise(res => chrome.tabs.query({}, tabs => {
       const t = tabs.find(x => (x.url||"").includes("localhost"));
       if (!t) return res(JSON.stringify({error:"no local tab"}));
       return chrome.tabs.sendMessage(t.id, {type:"GET_COUNTS"}, r => res(JSON.stringify(r)));
     }))`
  )
);
check(
  "stats include the byReason breakdown",
  !!stats.byReason && Object.keys(stats.byReason).length > 0,
  JSON.stringify(stats.byReason)
);

/* ------------------------------------------------------------------ */
/* 4. export / import                                                  */
/* ------------------------------------------------------------------ */

section("export / import");
const exported = JSON.parse(
  await evaluate(
    popupSession,
    `new Promise(res => {
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
     })`
  )
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

await evaluate(
  popupSession,
  `(() => {
     window.confirm = () => true;
     const file = new File([JSON.stringify({_meta:{schema:1}, settings:{cv_blacklist:"imported-value"}})], "c.json", {type:"application/json"});
     const dt = new DataTransfer();
     dt.items.add(file);
     const input = document.getElementById("import-file");
     input.files = dt.files;
     input.dispatchEvent(new Event("change", {bubbles:true}));
     return "triggered";
   })()`
).catch(() => {});
await sleep(2500);

const imported = await evaluate(
  popupSession,
  `new Promise(res => chrome.storage.local.get(["cv_blacklist"], d => res(d.cv_blacklist)))`
);
check("import applies the imported settings", imported === "imported-value", imported);

/* ------------------------------------------------------------------ */
/* 5. screenshot                                                       */
/* ------------------------------------------------------------------ */

const shot = await cdp.send(
  "Page.captureScreenshot",
  { format: "png", captureBeyondViewport: true },
  popupSession
);
const outDir = path.join(process.cwd(), "build", "screenshots");
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "popup-e2e-chrome.png");
fs.writeFileSync(outFile, Buffer.from(shot.data, "base64"));
console.log("\nscreenshot:", path.relative(process.cwd(), outFile));

cdp.close();
cleanup();
process.exit(summary());
