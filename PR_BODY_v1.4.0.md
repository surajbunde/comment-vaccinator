## Summary

v1.4.0 adds the **Spam Filters pack** — five new comment filters for the usual promo and spam patterns, plus a **"hidden by filter" breakdown** in the popup stats so users can see exactly which filter removed what.

Every new filter ships **off by default**, so existing users see zero behaviour change on upgrade and opt in to only the filters they want. The keyword whitelist still overrides every filter, including all five new ones.

| Filter | What it hides | Options |
|---|---|---|
| **Links** | Comments containing a URL (`https://…`, `www.…`, or a bare domain) | Allowed-domains allow-list |
| **Contact details** | Comments with an email, a phone number, or a Telegram/WhatsApp handle | — |
| **All-caps** | Comments written entirely in capital letters | Minimum letter count (default 15) |
| **Spam punctuation** | `!!!`, `???`, `....`, repeated characters, doubled words, spaced-out text | — |
| **Extra date locales** | Date mentions in Spanish, French, German, Portuguese, Russian | — |

## Carry-over from the published build

This branch also **cherry-picks PR #8** (`chore-support-button`, which was closed without merging). That PR contains the UI and functional tweaks that are live in the Chrome Web Store build today but were missing from `master` — the "💖 Support 💖" donation box and its Razorpay hyperlink.

Without this, publishing v1.4.0 would have **removed the donation box from the live extension**. The built `popup.html` is now `+75 / -0` lines versus the currently published one, so nothing that is live today regresses.

## Bug Fixes

### Export / Import Settings were broken in Firefox

Firefox's `chrome.*` namespace is callback-only in an extension page — `chrome.storage.local.get(keys)` returns `undefined` instead of a Promise, so `await` on it resolved to `undefined`.

In the published Firefox 1.3.5 build this meant:
- **Export** wrote a file containing only `_meta` and **no settings at all**
- **Import** silently wrote **nothing**, then reloaded the popup as if it had worked

Fixed by adding `storageGet()` / `storageSet()` helpers to `popup.js` that use the callback form, which both Chrome and Firefox support.

The content script is unaffected — promise-style `chrome.storage.*` does work in a Firefox content script — so `src/storage/settingsCache.js` is unchanged, with a comment added so the difference is not "cleaned up" later.

Verified against the built packages in both browsers:

| | Before | After |
|---|---|---|
| Firefox 158 (MV2) export | `{_meta}` only | 8 settings, 551 bytes |
| Firefox 158 (MV2) import | wrote nothing | writes the imported value |
| Chrome (MV3) export | 8 settings | 8 settings, 1567 bytes |
| Chrome (MV3) import | writes the value | writes the value |

## Files Changed

| File | Description |
|------|-------------|
| `src/matchers/links.js` | **New** — URL detection + domain allow-list |
| `src/matchers/contacts.js` | **New** — email / phone / Telegram / WhatsApp detection |
| `src/matchers/caps.js` | **New** — all-caps shouting detection |
| `src/matchers/punctuation.js` | **New** — spam punctuation and repetition detection |
| `src/matchers/dateLocales.js` | **New** — ES/FR/DE/PT/RU date patterns |
| `src/matchers/spamFilters.js` | **New** — composes the five matchers, all off by default |
| `src/filters/pipeline.js` | Spam-pack step; every `FilterResult` gains a stable `reasonCode` |
| `src/storage/settingsCache.js` | New `cv_spamFilters` key, parsed defensively |
| `src/content/main.js` | Stamps `data-cv-reason-code`; `getStats()` returns a `byReason` map |
| `background.js` | `cv_spamFilters` default |
| `popup.html` | New "Spam Filters" section + "Hidden by filter" breakdown markup |
| `popup.js` | Load/save the pack, section preview, breakdown rendering, export/import key |
| `tests/matchers/*.test.js` | **New** — 6 test files for the new matchers |
| `tests/filters/pipeline.test.js` | New ordering, reason-code and regression tests |
| `manifest.json` / `manifest-firefox.json` / `package.json` | Version bump to 1.4.0 |
| `README.md` / `CLAUDE.md` / `STORE_DESCRIPTION.md` | Docs for the new filters, pipeline order and storage key |
| `RELEASE_NOTES.md` | **New** — copy-paste ready Chrome "What's new" + Firefox "Version notes" |
| `docs/superpowers/` | **New** — v1.4.0 design spec and implementation plan |

## Design Notes

- **One popup section, five independent toggles.** The pack lives in a single collapsible "Spam Filters" section rather than five more top-level sections, so the popup stays navigable. Each filter is still independently controllable.
- **One storage key.** `cv_spamFilters` holds a JSON blob instead of ten flat keys, matching the existing `cv_customPatterns` / `cv_perVideoDisabled` precedent. Malformed values fall back to defaults field by field.
- **Stable reason codes.** Every pipeline result now carries a `reasonCode` (`whitelist`, `emoji-only`, `keyword`, `contacts`, `links`, `caps`, `punctuation`, `locale-date`, `date`, `custom-pattern`, `word-count`). This is what powers the new breakdown — without it, five new filters would be indistinguishable from the user's point of view.
- **Contacts run before links** inside the pack, so a comment carrying an email address is reported as *Contact details* rather than as the domain it happens to contain.
- **No new permissions.** All five filters are pure text matchers running in the existing content script.

## False-Positive Guards

Deliberate care taken so the new filters don't hide real comments:

- Phone matching ignores bare digit runs, so `20240101123456` and `12/04/24` stay visible.
- All-caps detection is word-ratio based, so `NASA released new footage` is not treated as shouting.
- `...` is allowed; only `....` and more triggers the punctuation filter.
- A stop-list of legitimate doubled words (`that that`, `had had`, …) is excluded.
- Month names in the locale patterns must sit next to a number, so the German name `Mai` is not treated as a date.

## Testing

- **217 tests passing** (138 before, 79 new) — written test-first, each new test watched fail before the implementation
- `npm test`, `npm run validate` and `npm run build` all pass; Chrome + Firefox v1.4.0 zips built
- **Browser-verified in real Firefox 158 (MV2)** via Marionette, using the actual built package as a temporary add-on:
  - Extension installs, popup renders, all five filters default to OFF, toggling persists to `cv_spamFilters`, section preview and dependent inputs behave
  - The MV2 content script injects on real `www.youtube.com` and **all five filters fire with the correct reason codes** (`date`, `links`, `contacts`, `caps`, `punctuation`, `locale-date`)
  - The keyword whitelist overrides the spam pack, and the domain allow-list keeps allowed links visible
  - `byReason` breakdown returned to the popup correctly
  - Export/Import round-trip verified (the fix above)
- **Browser-verified in Chrome** with Playwright against the real built extension:
  - Popup renders, toggles persist, all filters behave, `byReason` breakdown correct
  - Export/Import round-trip verified (the fix above)
- No console or page errors in either browser

## Screenshots

`build/screenshots/popup-v1.4.0-dark.png` — the v1.4.0 popup in dark mode with a live YouTube tab: the new **Spam Filters** section, the **hidden by filter** breakdown, and the existing donation box intact.

## Store Notes

`RELEASE_NOTES.md` contains ready-to-paste **Chrome Web Store "What's new"** and **Firefox Add-ons "Version notes"** text for v1.4.0, plus backfilled notes for 1.3.1–1.3.5. `STORE_DESCRIPTION.md` is updated with a new "🧹 Spam Filters" section for the long description.

## Follow-up

v1.5.0 is scoped in `next-session-notes.md`: duplicate/repeated comments, block-by-author, and comment age. All three need author and timestamp extraction from the YouTube comment DOM, so the selectors need verifying first.
