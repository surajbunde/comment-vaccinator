# Comment Vaccinator – YouTube Comment Filter

Hide repetitive YouTube comments that contain date-like phrases, while preserving normal discussion using word-count and keyword controls.

## Download

<div align="center">
  <a href="https://chromewebstore.google.com/detail/comment-vaccinator/ogadpocgkohdanekbkdjnmnjbdgohijf"><img src="https://img.shields.io/badge/Available%20on%20Chrome%20Web%20Store-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white&logoWidth=28" alt="Chrome Web Store"></a>
  <a href="https://addons.mozilla.org/en-US/firefox/addon/comment-vaccinator/"><img src="https://img.shields.io/badge/Get%20for%20Firefox-FF7139?style=for-the-badge&logo=firefoxbrowser&logoColor=white&logoWidth=28" alt="Firefox Add-ons"></a>
  <br><br>
  <a href="https://chromewebstore.google.com/detail/comment-vaccinator/ogadpocgkohdanekbkdjnmnjbdgohijf"><img src="https://img.shields.io/badge/Works%20on%20Brave-FB542B?style=for-the-badge&logo=brave&logoColor=white&logoWidth=28" alt="Brave"></a>
  <a href="https://chromewebstore.google.com/detail/comment-vaccinator/ogadpocgkohdanekbkdjnmnjbdgohijf"><img src="https://img.shields.io/badge/Works%20on%20Edge-0078D7?style=for-the-badge&logo=microsoftedge&logoColor=white&logoWidth=28" alt="Edge"></a>
  <a href="https://chromewebstore.google.com/detail/comment-vaccinator/ogadpocgkohdanekbkdjnmnjbdgohijf"><img src="https://img.shields.io/badge/Works%20on%20Opera-FF1B2D?style=for-the-badge&logo=opera&logoColor=white&logoWidth=28" alt="Opera"></a>
</div>

## Features

- Date-pattern filtering for English and Hindi (Devanagari) date formats.
- Date filter master toggle (enable/disable date pipeline anytime).
- Optional word-count filter:
  - `max`: hide if comment has fewer words than threshold.
  - `min`: hide if comment has more words than threshold.
- Optional strict emoji cleanup before word counting.
- Emoji-only filter: hides comments containing ONLY emoji characters.
- Keyword blacklist (comma-separated): red border, red-tinted background.
- Keyword whitelist: green border, green-tinted background. Overrides all other filters — matching comments always stay visible.
- Spam Filters pack (all off by default, individually toggleable):
  - **Links**: hides comments containing a URL, with an allowed-domains allow-list.
  - **Contact details**: hides comments with an email, phone number, or Telegram/WhatsApp handle.
  - **All-caps**: hides comments written entirely in capital letters (minimum letter count configurable).
  - **Spam punctuation**: hides `!!!`, `???`, `....`, repeated characters, doubled words, spaced-out text.
  - **Extra date locales**: hides date mentions in Spanish, French, German, Portuguese, and Russian.
- Custom regex patterns: 10 preset spam patterns + add/edit/delete your own (with `i` flag).
- Custom patterns toggle: disabled by default — presets ship inactive until you enable them.
- Reset to defaults: resets the 10 OOTB presets to original values, keeps your custom patterns.
- Per-video toggle: pause all filtering for the current video.
- Export/Import settings: one-click export to JSON file, import from JSON to restore or share configurations.
- Live re-filtering when YouTube loads more comments.
- Popup stats: total, hidden, visible comments (list + chart view) plus a "hidden by filter" breakdown.

## Tech Stack

- Chrome Manifest V3 + Firefox Manifest V2 (desktop + Android)
- ES modules in `src/` bundled via esbuild to single `content.js`
- Popup UI (`popup.html`, `popup.js`)
- Local storage for settings (`chrome.storage.local`, `cv_` namespace)
- `node:test` test harness (209 tests)

## Project Structure

- `manifest.json` - Chrome MV3 manifest
- `manifest-firefox.json` - Firefox MV2 manifest (desktop + Android)
- `src/matchers/datePatterns.js` - 17 date pattern matchers
- `src/matchers/dateLocales.js` - ES/FR/DE/PT/RU date patterns (opt-in)
- `src/matchers/links.js` - link detection with domain allow-list
- `src/matchers/contacts.js` - email / phone / messenger detection
- `src/matchers/caps.js` - all-caps shouting detection
- `src/matchers/punctuation.js` - spam punctuation and repetition detection
- `src/matchers/spamFilters.js` - composes the five spam-signal matchers
- `src/matchers/wordCount.js` - emoji stripping, word counting
- `src/matchers/keywords.js` - blacklist/whitelist keyword matching
- `src/filters/pipeline.js` - composes all matchers
- `src/observer/commentObserver.js` - MutationObserver lifecycle
- `src/storage/settingsCache.js` - settings cache with `cv_` namespace
- `src/content/main.js` - content script entry point
- `popup.html` - extension popup UI
- `popup.js` - popup settings, custom pattern editor
- `background.js` - default settings on install, badge
- `build.cjs` - esbuild bundler + zip creator
- `icon-32.png`, `icon-48.png`, `icon-128.png` - extension icons

## Local Development and Testing

### 1. Install & Build

```bash
npm install
npm run build
```

Outputs to `build/`:
- `comment-vaccinator-chrome-v1.4.0.zip`
- `comment-vaccinator-firefox-v1.4.0.zip`
- `chrome-unpacked/` (for "Load unpacked" testing)

### 2. Run Tests

```bash
npm test
```

209 tests covering all matchers, pipeline logic, word count edge cases, custom pattern validation, export/import settings, and the spam filter pack.

### 3. Validate Manifests

```bash
npm run validate
```

Checks both manifests for Chrome MV3 and Firefox MV2 compatibility. Runs automatically before every build — blocks build on errors.

### 4. Load Unpacked in Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select `build/chrome-unpacked/`
5. Open any YouTube video with comments
6. Open extension popup and test settings

### 4. Load Unpacked in Edge

1. Open `edge://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select `build/chrome-unpacked/`
5. Test on YouTube as above

### 5. Temporary Add-on in Firefox

1. Open `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on**
3. Select `manifest.json` from project root
4. Open YouTube and validate behavior

## Manual Test Checklist

Use at least 3-5 videos with active comments and validate:

1. `today`, `yesterday`, `Jan 12 2024`, `12/01/24` comments are hidden when expected.
2. Non-date comments with numbers (example: "Top 10 songs") stay visible.
3. Date Filter OFF: date-like comments reappear immediately.
4. Word-count `max` and `min` modes behave correctly when Date Filter is ON.
5. Keyword blacklist hides matching comments even when Date Filter is OFF.
6. Emoji-only filter hides comments with only emoji characters.
7. Keyword whitelist overrides all other filters — matching comments always visible.
8. Custom patterns: enable toggle, verify preset patterns hide matching comments.
9. Custom patterns: add/edit/delete patterns, verify changes take effect immediately.
10. Custom patterns: "Reset to defaults" restores 10 presets, keeps custom patterns.
11. Per-video toggle: pause filtering on current video, verify all comments reappear.
12. Per-video toggle: navigate to different video, verify toggle state updates correctly.
13. Per-video toggle: toggle persists after closing and reopening popup.
14. Toggling popup controls triggers live re-filtering.
15. Page navigation within YouTube still preserves behavior.
16. Spam Filters: enable each filter individually — links, contact details, all-caps, spam punctuation, extra date locales.
17. Spam Filters: every filter is off by default after an upgrade — no comment changes behaviour until opted in.
18. Spam Filters: an allow-listed domain in the links filter keeps its comments visible.
19. Spam Filters: a whitelisted keyword still protects a comment that would match a spam filter.
20. Stats: the "hidden by filter" breakdown lists the active filter counts.

## Release Readiness Checklist

1. Validate manifest JSON syntax (no comments, no trailing commas).
2. Verify required permissions only (`storage`).
3. Run `npm test` — all 209 tests passing.
4. Run `npm run build` — zips + unpacked folder created.
5. Perform manual test checklist on Chrome + Firefox + Edge.
6. Prepare screenshots + description for store listings.
7. Increment `version` in both manifests before each store submission.

## Browser Publishing Notes

- Chrome Web Store: package and submit zip; review required.
- Edge Add-ons: mostly same package as Chrome.
- Firefox AMO: submit signed build; gecko ID required for stable updates.

## Known Limitations

- YouTube DOM can change; selectors may need updates.
- Date detection is heuristic and language/locale biased (English + Hindi/Devanagari supported).
- Some short non-date comments may still be filtered depending on threshold settings.

## Firefox Gotchas

| Issue | Details | Solution |
|-------|---------|----------|
| **MV3 not supported on Android** | Firefox Android doesn't auto-inject MV3 content scripts (Mozilla bug #1872890) | Use MV2 (`manifest-firefox.json`) for Firefox builds |
| **Badge API differs** | Firefox MV2 uses `chrome.browserAction`, Chrome MV3 uses `chrome.action` | `background.js` uses `chrome.action \|\| chrome.browserAction` |
| **`data_collection_permissions` required** | Firefox addons now require this field in gecko settings | Must use `"required": ["none"]` array format (not boolean) |
| **`strict_min_version` 142+** | `data_collection_permissions` requires Firefox 142+ | Set `strict_min_version: "142.0"` in `manifest-firefox.json` |
| **Popup is full-screen on mobile** | Firefox Android shows popup as full-screen overlay | CSS uses `@media (max-width: 480px)` breakpoint |
| **ZIP file locks** | Windows locks Firefox ZIP files when open in Explorer/Firefox | Close the file before rebuilding |

### Browser-Specific Manifest Differences

| Key | Chrome MV3 (`manifest.json`) | Firefox MV2 (`manifest-firefox.json`) |
|-----|------------------------------|----------------------------------------|
| Action | `action` | `browser_action` |
| Background | `service_worker` | `background.scripts` |
| Permissions | `["storage"]` | `["storage", "https://www.youtube.com/*", "https://m.youtube.com/*"]` |
| Badge | `chrome.action` | `chrome.browserAction` |

## Contributing / Customization

Common tweaks:

- Edit `DATE_PATTERNS` in `src/matchers/datePatterns.js` to tune date sensitivity.
- Adjust default threshold in `cv_wordCountValue` storage key.
- Add custom regex patterns via the popup UI (Advanced: Custom Patterns section).
- Edit `PRESET_PATTERNS` in `popup.js` to change default presets.

## Support

If you find Comment Vaccinator useful, consider supporting development:

[💖 Support 💖](https://rzp.io/rzp/zyRfKQ0a)

UPI: `surajbunde@ybl`

## License

CC BY-NC-SA 4.0 — Free to use, modify, and share for non-commercial purposes.
