# Comment Vaccinator – YouTube Comment Filter

## Overview
Browser extension that filters YouTube comments by date mentions, keyword blacklist, word count thresholds, and emoji-only content. Supports Chrome (MV3) and Firefox (MV2 + Firefox Android).

## Build
```bash
node build.js
```
Outputs to `build/`:
- `comment-vaccinator-chrome-v1.2.0.zip`
- `comment-vaccinator-firefox-v1.2.0.zip`

## Test
```bash
node test-date-filter.js
```
34+ regex tests for date detection. Must pass before release.

## Key Files

| File | Purpose |
|------|---------|
| `filterComments.js` | Content script — DOM observation, comment filtering, all filter logic |
| `popup.html` | Popup UI HTML + CSS |
| `popup.js` | Popup logic — load/save settings, communicate with content script |
| `background.js` | Default settings initialization on install |
| `manifest.json` | Chrome MV3 manifest |
| `manifest-firefox.json` | Firefox MV2 manifest (used for desktop + Android) |
| `build.js` | Build script — zips extension with correct manifest per target |

## Architecture

- **Content script** (`filterComments.js`): Injected on YouTube pages. Observes DOM for comment section, finds comment threads, filters based on settings. Communicates via `chrome.runtime.onMessage`.
- **Popup** (`popup.html` + `popup.js`): UI for settings. Saves to `chrome.storage.local`, sends `REFILTER_NOW` to content script on every change.
- **Background** (`background.js`): Initializes default settings on install.

## Browser Support

| Browser | Manifest | Key Differences |
|---------|----------|----------------|
| Chrome Desktop | MV3 (`manifest.json`) | `action`, `service_worker`, `host_permissions` |
| Firefox Desktop | MV2 (`manifest-firefox.json`) | `browser_action`, `background.scripts` |
| Firefox Android | MV2 (`manifest-firefox.json`) | Popup is full-screen overlay; MV3 not supported (service workers, host_permissions UX broken) |

## Important Decisions

1. **MV2 for Firefox** — MV3 content scripts don't auto-inject on Firefox Android (Mozilla bug #1872890)
2. **Separate manifests** — Chrome MV3 uses `manifest.json`, Firefox MV2 uses `manifest-firefox.json`; `build.js` swaps them
3. **No build tooling** — Simple `node build.js` script, no webpack/rollup

## Firefox Android Testing

```bash
# ADB to MuMuPlayer emulator
adb connect 127.0.0.1:7555
# Or use MuMu's built-in ADB:
"D:\Program Files\Netease\MuMuPlayer\nx_main\adb.exe" connect 127.0.0.1:7555

# Install and run extension on Firefox Nightly
npx web-ext run -s /tmp/webext-test -t firefox-android \
  --adb-device 127.0.0.1:7555 \
  --firefox-apk org.mozilla.fenix \
  --adb-bin "D:\Program Files\Netease\MuMuPlayer\nx_main\adb.exe" \
  --adb-remove-old-artifacts --no-reload
```

Requires "Remote Debugging via USB" enabled in Firefox Nightly Settings → Developer Tools.

## m.youtube.com DOM Structure

Mobile YouTube uses:
- `ytm-engagement-panel-section-list-renderer.engagement-panel-comments-section` (comments container, no `#comments`)
- `ytm-comment-thread-renderer` (comment thread)
- `p.YtmCommentRendererText` (comment text)

No `#contents` or `#items` — uses `<lazy-list>` custom elements.

## Popup on Firefox Android

Popup opens as a full-screen overlay. CSS uses `@media (max-width: 480px)` breakpoint for mobile layout. Toggle switches should have touch-friendly targets.

## Filter Breakdown

| Filter | Setting Key | Description |
|--------|-------------|-------------|
| Date | `dateFilterEnabled` | Hides comments mentioning dates, days, years |
| Word Count | `wordCountEnabled` | Hides comments with too few/many words |
| Strip Emojis | `emojiFilterEnabled` | Modifier for word count — strips emojis before counting |
| Keyword Blacklist | `keywordEnabled` | Hides comments matching comma-separated keywords |
| Emoji-Only | `emojiOnlyEnabled` | Hides comments containing ONLY emoji characters |
