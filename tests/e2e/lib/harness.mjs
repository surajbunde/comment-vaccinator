/**
 * @fileoverview Shared helpers for the browser end-to-end tests.
 *
 * The E2E tests drive a real Chrome (DevTools Protocol) and a real Firefox
 * (Marionette) against the built extension. They are dependency-free: Node's
 * built-in WebSocket and net modules are enough for both protocols.
 *
 * Everything runs offline. A local HTTP server stands in for
 * www.youtube.com, and the extension under test is a copy of the real build
 * whose manifest additionally matches http://localhost/* so the content script
 * injects there. The shipped manifest is never modified.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  ".."
);
export const BUILD_DIR = path.join(REPO_ROOT, "build");

/* ------------------------------------------------------------------ */
/* assertions                                                          */
/* ------------------------------------------------------------------ */

let failures = 0;
let checks = 0;

export function check(name, condition, detail) {
  checks++;
  if (!condition) failures++;
  const label = condition ? "PASS" : "FAIL";
  console.log(`  ${label}  ${name}${detail !== undefined ? "  -> " + detail : ""}`);
}

export function section(title) {
  console.log(`\n${title}`);
}

export function summary() {
  console.log(
    `\n${failures === 0 ? "ALL CHECKS PASSED" : failures + " of " + checks + " CHECK(S) FAILED"}`
  );
  return failures === 0 ? 0 : 1;
}

/* ------------------------------------------------------------------ */
/* build helpers                                                       */
/* ------------------------------------------------------------------ */

/**
 * Makes sure build/<target>-unpacked exists, building it if needed.
 * @param {"chrome"|"firefox"} target
 * @returns {string} Path to the unpacked extension.
 */
export function ensureBuilt(target) {
  const dir = path.join(BUILD_DIR, `${target}-unpacked`);
  if (fs.existsSync(path.join(dir, "manifest.json"))) return dir;

  console.log(`  building (${target}-unpacked missing)...`);
  execFileSync(process.execPath, [path.join(REPO_ROOT, "build.cjs")], {
    cwd: REPO_ROOT,
    stdio: "pipe",
  });
  if (!fs.existsSync(path.join(dir, "manifest.json"))) {
    throw new Error(`build did not produce ${dir}`);
  }
  return dir;
}

/**
 * Copies a built extension to a temp folder and extends the content-script
 * match list with http://localhost/* so the tests can serve a fake page
 * locally. The shipped manifest stays untouched.
 *
 * @param {"chrome"|"firefox"} target
 * @returns {string} Path to the patched extension directory.
 */
export function prepareExtension(target) {
  const source = ensureBuilt(target);
  const dest = fs.mkdtempSync(path.join(os.tmpdir(), `cv-${target}-ext-`));

  for (const entry of fs.readdirSync(source)) {
    const from = path.join(source, entry);
    if (fs.statSync(from).isDirectory()) continue;
    fs.copyFileSync(from, path.join(dest, entry));
  }

  const manifestPath = path.join(dest, "manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

  const LOCAL_MATCH = "http://localhost/*";
  for (const cs of manifest.content_scripts || []) {
    cs.matches = [...new Set([...(cs.matches || []), LOCAL_MATCH])];
  }
  // The popup messages the local tab, so it needs access to it as well.
  // MV3 keeps host patterns in host_permissions, MV2 in permissions.
  const hostKey = manifest.manifest_version === 3 ? "host_permissions" : "permissions";
  if (manifest[hostKey]) {
    manifest[hostKey] = [...new Set([...manifest[hostKey], LOCAL_MATCH])];
  }
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  return dest;
}

/* ------------------------------------------------------------------ */
/* browser discovery                                                   */
/* ------------------------------------------------------------------ */

const CHROME_CANDIDATES = {
  win32: [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
  ],
  darwin: [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
  ],
  linux: [
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/microsoft-edge",
    "/usr/bin/brave-browser",
  ],
};

const FIREFOX_CANDIDATES = {
  win32: [
    "C:\\Program Files\\Mozilla Firefox\\firefox.exe",
    "C:\\Program Files (x86)\\Mozilla Firefox\\firefox.exe",
  ],
  darwin: ["/Applications/Firefox.app/Contents/MacOS/firefox"],
  linux: ["/usr/bin/firefox", "/usr/bin/firefox-esr", "/snap/bin/firefox"],
};

/**
 * Finds a browser binary.
 * @param {"chrome"|"firefox"} kind
 * @returns {string|null} Path to the binary, or null when none was found.
 */
export function findBrowser(kind) {
  const envVar = kind === "chrome" ? "CHROME_PATH" : "FIREFOX_PATH";
  if (process.env[envVar]) return process.env[envVar];

  const candidates = kind === "chrome" ? CHROME_CANDIDATES : FIREFOX_CANDIDATES;
  const list = candidates[process.platform] || [];
  for (const candidate of list) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* fake youtube                                                        */
/* ------------------------------------------------------------------ */

/**
 * Comment fixtures. Each one exercises a specific filter, plus three that
 * must stay visible.
 * @type {Array<{id: string, text: string, expect: string|null}>}
 */
export const COMMENTS = [
  { id: "c1", text: "Anyone here in 2026?", expect: "date" },
  { id: "c2", text: "Check https://spam.example.com now", expect: "links" },
  { id: "c3", text: "mail me at promo@example.com", expect: "contacts" },
  { id: "d4", text: "WHY IS NOBODY TALKING ABOUT THIS", expect: "caps" },
  { id: "e5", text: "WOW!!!", expect: "punctuation" },
  { id: "f6", text: "hace 3 días", expect: "locale-date" },
  { id: "g7", text: "This is a genuinely good video, thanks for sharing", expect: null },
  { id: "h8", text: "my analysis at https://example.com", expect: null },
  { id: "i9", text: "see https://youtube.com/watch for more", expect: null },
];

/**
 * Builds the fake YouTube comment page.
 * @returns {string} HTML document.
 */
export function fakeYouTubePage() {
  const rows = COMMENTS.map(
    (c) => `
    <ytd-comment-thread-renderer id="${c.id}">
      <ytd-comment-renderer>
        <div id="author-text">@tester</div>
        <yt-formatted-string id="content-text">${c.text}</yt-formatted-string>
      </ytd-comment-renderer>
    </ytd-comment-thread-renderer>`
  ).join("");

  return `<!doctype html>
<html>
  <head><meta charset="utf-8"><title>Comment Vaccinator E2E</title></head>
  <body>
    <ytd-comments id="comments">${rows}
    </ytd-comments>
  </body>
</html>`;
}

/**
 * Starts a local HTTP server that serves the fake YouTube page.
 * @returns {Promise<{url: string, port: number, close: () => void}>}
 */
export function startFakeYouTube() {
  const html = fakeYouTubePage();
  const server = http.createServer((req, res) => {
    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    });
    res.end(html);
  });

  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve({
        url: `http://localhost:${port}/watch?v=e2e`,
        port,
        close: () => server.close(),
      });
    });
  });
}

/* ------------------------------------------------------------------ */
/* shared assertions used by both browser suites                       */
/* ------------------------------------------------------------------ */

/**
 * Expression that reads the filtering result out of the page.
 *
 * CDP's Runtime.evaluate wants a bare expression, while Marionette's
 * ExecuteScript wants a function body, so each suite prefixes it with
 * "return " when needed.
 * @type {string}
 */
export const READ_RESULTS_BODY = `JSON.stringify(
  Array.from(document.querySelectorAll("ytd-comment-thread-renderer")).map(el => ({
    id: el.id,
    text: el.querySelector("#content-text")?.textContent,
    hidden: el.dataset.cvHidden,
    code: el.dataset.cvReasonCode || ""
  }))
)`;

/**
 * Compares the observed filtering result against the expectations.
 * @param {Array<{id: string, text: string, hidden: string, code: string}>} rows
 * @returns {number} Number of mismatches.
 */
export function countMismatches(rows) {
  let mismatches = 0;
  for (const row of rows) {
    const want = COMMENTS.find((c) => c.id === row.id);
    if (!want) continue;
    const got = row.hidden === "1" ? row.code : null;
    if (want.expect !== got) {
      mismatches++;
      console.log(
        `     MISMATCH ${row.id}: expected ${want.expect ?? "visible"}, got ${got ?? "visible"}`
      );
    }
  }
  return mismatches;
}

/**
 * Prints the filtering result in a readable table.
 * @param {Array<{id: string, text: string, hidden: string, code: string}>} rows
 */
export function printResults(rows) {
  for (const row of rows) {
    const state = row.hidden === "1" ? "HIDDEN " : "VISIBLE";
    console.log(
      `    ${state}  [${(row.code || "-").padEnd(12)}] ${row.text ?? row.id}`
    );
  }
}
