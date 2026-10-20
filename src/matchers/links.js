/**
 * @fileoverview Link detection with a domain allow-list.
 * This module has NO browser API dependencies — it is importable in Node.js.
 */

/**
 * TLDs that make a bare token look like a domain.
 * @type {string[]}
 */
const TLD_LIST = [
  "com", "net", "org", "io", "co", "in", "link", "xyz", "me", "tv", "gg",
  "site", "online", "shop", "store", "app", "dev", "blog", "news", "fun",
  "space", "club", "icu", "buzz", "ly", "tk", "ml", "ga", "cf", "gq", "work",
  "live", "life", "world", "today", "top", "vip", "fyi", "ltd", "sh", "pro",
  "info", "biz", "us", "uk", "ru", "cn", "jp", "de", "fr", "es", "pt", "br",
];

/**
 * Matches an explicit URL (scheme or www prefix).
 * @type {RegExp}
 */
const EXPLICIT_URL = /\b(?:https?:\/\/|www\.)[^\s<>"']+/gi;

/**
 * Matches a bare domain such as "example.com" or "bit.ly/abc".
 * @type {RegExp}
 */
const BARE_DOMAIN = new RegExp(
  `\\b[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*\\.(?:${TLD_LIST.join(
    "|"
  )})\\b(?:/[^\\s]*)?`,
  "gi"
);

/**
 * Normalises a URL-ish token down to its hostname.
 * @param {string} token
 * @returns {string}
 */
function toHostname(token) {
  let host = token.trim();
  host = host.replace(/^https?:\/\//i, "");
  host = host.replace(/^www\./i, "");
  host = host.split(/[/?#]/)[0];
  host = host.split("@").pop();
  host = host.split(":")[0];
  return host.toLowerCase();
}

/**
 * Extracts every link-looking token from the text.
 * @param {string} text - Raw comment text.
 * @returns {Array<{url: string, hostname: string}>}
 */
export function extractLinks(text) {
  if (!text) return [];
  const found = new Map();
  for (const re of [EXPLICIT_URL, BARE_DOMAIN]) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
      const url = m[0];
      const hostname = toHostname(url);
      if (!hostname) continue;
      if (!found.has(hostname)) found.set(hostname, { url, hostname });
    }
  }
  return Array.from(found.values());
}

/**
 * Normalises a comma-separated allow-list into hostnames.
 * @param {string|string[]} raw
 * @returns {string[]}
 */
function parseAllowedDomains(raw) {
  const list = Array.isArray(raw) ? raw : String(raw || "").split(",");
  return list
    .map((d) =>
      String(d)
        .trim()
        .toLowerCase()
        .replace(/^https?:\/\//i, "")
        .replace(/^www\./i, "")
    )
    .map((d) => d.split("/")[0].split(":")[0])
    .filter(Boolean);
}

/**
 * Returns true when a hostname is covered by the allow-list.
 * @param {string} hostname
 * @param {string[]} allowed
 * @returns {boolean}
 */
function isAllowed(hostname, allowed) {
  return allowed.some((d) => hostname === d || hostname.endsWith("." + d));
}

/**
 * Returns whether the comment contains a link that is not allow-listed.
 * @param {string} text - Raw comment text.
 * @param {string|string[]} allowedDomains - Comma-separated allow-list.
 * @returns {{ matched: boolean, hostname: string|null }}
 */
export function matchesLinks(text, allowedDomains) {
  const allowed = parseAllowedDomains(allowedDomains);
  for (const { hostname } of extractLinks(text)) {
    if (!isAllowed(hostname, allowed)) {
      return { matched: true, hostname };
    }
  }
  return { matched: false, hostname: null };
}
