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
- Keyword blacklist (comma-separated).
- Live re-filtering when YouTube loads more comments.
- Popup stats: total, hidden, visible comments.

## Tech Stack

- Manifest V3 extension
- Content script for filtering (`filterComments.js`)
- Popup UI (`popup.html`, `popup.js`)
- Local storage for settings (`chrome.storage.local`)

## Project Structure

- `manifest.json` - extension manifest (MV3 + Firefox gecko ID block)
- `filterComments.js` - comment matching + hide/show logic
- `popup.html` - extension UI
- `popup.js` - popup settings and messaging
- `test-date-filter.js` - local smoke test for date-pattern quality
- `icon-32.png`, `icon-48.png`, `icon-128.png` - extension icons

## Local Development and Testing

### 1. Quick Regex Smoke Test

Prerequisite: Node.js installed.

```bash
node test-date-filter.js
```

Expected: `Summary: 31/31 checks passed`

If failures appear, tune date regex in `filterComments.js`, then rerun.

### 2. Load Unpacked in Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the project folder
5. Open any YouTube video with comments
6. Open extension popup and test settings

### 3. Load Unpacked in Edge

1. Open `edge://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the project folder
5. Test on YouTube as above

### 4. Temporary Add-on in Firefox

1. Zip the extension files
2. Open `about:debugging#/runtime/this-firefox`
3. Click **Load Temporary Add-on**
4. Select `manifest.json`
5. Open YouTube and validate behavior

## Manual Test Checklist

Use at least 3-5 videos with active comments and validate:

1. `today`, `yesterday`, `Jan 12 2024`, `12/01/24` comments are hidden when expected.
2. Non-date comments with numbers (example: "Top 10 songs") stay visible.
3. Date Filter OFF: date-like comments reappear immediately.
4. Word-count `max` and `min` modes behave correctly when Date Filter is ON.
5. Keyword blacklist hides matching comments even when Date Filter is OFF.
6. Toggling popup controls triggers live re-filtering.
7. Page navigation within YouTube still preserves behavior.

## Release Readiness Checklist

1. Validate manifest JSON syntax (no comments, no trailing commas).
2. Verify required permissions only (`storage`, `tabs`).
3. Confirm no unused background scripts.
4. Run `node test-date-filter.js`.
5. Perform manual test checklist on Chrome + Firefox + Edge.
6. Prepare screenshots + description for store listings.
7. Increment `version` before each store submission.

## Browser Publishing Notes

- Chrome Web Store: package and submit zip; review required.
- Edge Add-ons: mostly same package as Chrome.
- Firefox AMO: submit signed build; gecko ID required for stable updates.

## Known Limitations

- YouTube DOM can change; selectors may need updates.
- Date detection is heuristic and language/locale biased (English + Hindi/Devanagari supported).
- Some short non-date comments may still be filtered depending on threshold settings.

## Contributing / Customization

Common tweaks:

- Edit `DATE_PATTERNS` in `filterComments.js` to tune sensitivity.
- Adjust default threshold in `settings.wordCountValue`.
- Expand keyword behavior (exact-match vs contains).

## License

CC BY-NC-SA 4.0 — Free to use, modify, and share for non-commercial purposes.
