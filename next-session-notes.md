# Next Session: Phase 6 — Contextual Filters (v1.5.0)

## Status
- Phase 1 (Regex Pattern Editor) — Done, merged to master
- Phase 2 (Per-Video Toggle) — Done, merged to master
- Phase 3 (Keyword Whitelist) — Done, merged to master
- Phase 3 UI Improvements — Done, merged to master
- Phase 5 (Export/Import Settings) — Done, merged to master
- **v1.4.0 (Spam Filters Pack) — Done, built, zips ready** (branch not yet created)

## v1.4.0 — What shipped

Five new opt-in filters, all **off by default**, in one "Spam Filters" popup section
backed by a single `cv_spamFilters` JSON key:

| Filter | Setting key |
|---|---|
| Links (with domain allow-list) | `spamFilters.linksEnabled` + `linksAllowedDomains` |
| Contact details (email/phone/TG) | `spamFilters.contactsEnabled` |
| All-caps shouting | `spamFilters.capsEnabled` + `capsMinLength` |
| Spam punctuation | `spamFilters.punctuationEnabled` |
| Extra date locales (ES/FR/DE/PT/RU) | `spamFilters.localesEnabled` |

Plus a **"hidden by filter" breakdown** in the popup stats (driven by the new
`reasonCode` on every `FilterResult`).

- Spec: `docs/superpowers/specs/2026-10-20-v1.4.0-spam-filters-design.md`
- Plan: `docs/superpowers/plans/2026-10-20-v1.4.0-spam-filters.md`
- Store notes: `RELEASE_NOTES.md`

## Next Phase: Contextual Filters (v1.5.0)

Three filters that need state or new DOM extraction. All three share one
dependency — **reading the author name and the timestamp out of a YouTube
comment** — so verify those selectors with Playwright first.

### 1. Duplicate / repeated comments
- Keep a per-page set of normalised comment texts (lowercase, strip emoji/URLs,
  collapse whitespace and punctuation).
- Hide a comment whose normalised text was already seen on the page.
- Decision needed: per-video session only, or persisted across videos?

### 2. Block comments by author
- New storage key `cv_blockedAuthors` (JSON array of channel names).
- Extract the author from `#author-text` (desktop) / the mobile equivalent.
- UI: comma-separated input in the popup. Optional: an injected "block" button
  on each comment (needs no extra permission) — a `chrome.contextMenus` entry
  would need the `contextMenus` permission and is probably not worth it.

### 3. Comment age (posted long ago)
- Read YouTube's own timestamp (`#published-time-text`) → "3 years ago".
- Parse into months, hide when older than a configurable threshold.
- Distinct from the existing date-mention filter, which reads comment *text*.

### Verification selectors to confirm first
- Desktop author: `#author-text`, `#header-text #author-text`
- Desktop timestamp: `#published-time-text`
- Mobile: `ytm-comment-thread-renderer` equivalents

## Known Issues / Notes
- JavaScript `\b` is ASCII-only — Cyrillic (and Devanagari) boundaries need
  explicit Unicode lookarounds `(?<![\p{L}\p{N}_])` / `(?![\p{L}\p{N}_])`.
  The Russian patterns in `src/matchers/dateLocales.js` already do this.
- `background.js`'s `onInstalled` handler writes defaults asynchronously. If
  you script settings changes right after the browser starts, wait for it to
  settle or your writes get clobbered by the defaults.

## Current Version
- Manifests: v1.4.0 (Chrome MV3 + Firefox MV2)
- Tests: 211 passing
- Zips: `build/comment-vaccinator-chrome-v1.4.0.zip`, `build/comment-vaccinator-firefox-v1.4.0.zip`
