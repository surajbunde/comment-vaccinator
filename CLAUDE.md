# Comment Vaccinator – YouTube Comment Filter

## Overview
Browser extension that filters YouTube comments by date mentions, keyword blacklist, word count thresholds, and emoji-only content. Supports Chrome (MV3) and Firefox (MV2 + Firefox Android).

## Build
```bash
npm run build
```
Outputs to `build/`:
- `comment-vaccinator-chrome-v1.3.0.zip`
- `comment-vaccinator-firefox-v1.3.0.zip`
- `chrome-unpacked/` (for "Load unpacked" testing)

## Test
```bash
npm test
```
111+ tests covering all matchers, pipeline logic, and word count edge cases.

## Key Files

| File | Purpose |
|------|---------|
| `src/matchers/datePatterns.js` | 17 date pattern matchers + `matchesDate()` |
| `src/matchers/wordCount.js` | `stripEmoji()`, `countWords()`, `matchesWordCount()` |
| `src/matchers/keywords.js` | `parseKeywordList()`, `matchesBlacklist()`, `matchesWhitelist()` |
| `src/filters/pipeline.js` | `runPipeline()` — composes all matchers |
| `src/observer/commentObserver.js` | MutationObserver lifecycle |
| `src/storage/settingsCache.js` | `initSettingsCache()`, `refreshSettings()`, `getSettings()` |
| `src/storage/logger.js` | `[CommentVaccinator]` structured logger |
| `src/content/main.js` | Entry point — wires settings, pipeline, observer |
| `popup.js` | Popup UI — load/save settings, sends `REFILTER_NOW` |
| `popup.html` | Popup HTML + CSS |
| `background.js` | Default settings on install, badge handling |
| `manifest.json` | Chrome MV3 |
| `manifest-firefox.json` | Firefox MV2 (desktop + Android) |
| `build.cjs` | esbuild bundler + zip creator |
| `package.json` | esbuild devDependency, scripts |

## Architecture

- **Content script** (`src/content/main.js` → bundled to `content.js`): Injected on YouTube pages. Observes DOM, runs pipeline, filters comments. Communicates via `chrome.runtime.onMessage`.
- **Popup** (`popup.html` + `popup.js`): UI for settings. Saves to `chrome.storage.local`, sends `REFILTER_NOW` to content script on every change.
- **Background** (`background.js`): Initializes default settings on install. Handles badge updates.

## Browser Support

| Browser | Manifest | Key Differences |
|---------|----------|----------------|
| Chrome Desktop | MV3 (`manifest.json`) | `action`, `service_worker`, permissions: `["storage"]` |
| Firefox Desktop | MV2 (`manifest-firefox.json`) | `browser_action`, `background.scripts` |
| Firefox Android | MV2 (`manifest-firefox.json`) | Popup is full-screen overlay; MV3 not supported |

## Important Decisions

1. **MV2 for Firefox** — MV3 content scripts don't auto-inject on Firefox Android (Mozilla bug #1872890)
2. **Separate manifests** — Chrome MV3 uses `manifest.json`, Firefox MV2 uses `manifest-firefox.json`
3. **esbuild bundling** — ES modules in `src/` bundled to single `content.js` (Chrome MV3 doesn't support ES imports in content scripts)
4. **`build.cjs` not `build.js`** — CommonJS because `package.json` has `"type": "module"`

## Storage Keys (cv_ namespace)

| Key | Type | Default |
|-----|------|---------|
| `cv_dateFilterEnabled` | boolean | `true` |
| `cv_wordCountMode` | string | `"off"` |
| `cv_wordCountValue` | number | `5` |
| `cv_stripEmoji` | boolean | `false` |
| `cv_keywordEnabled` | boolean | `false` |
| `cv_blacklist` | string | `""` |
| `cv_whitelist` | string | `""` |
| `cv_emojiOnlyEnabled` | boolean | `false` |
| `cv_customPatterns` | JSON string | `"[]"` |
| `cv_perVideoDisabled` | JSON string | `"[]"` |
| `cv_currentVideoId` | string | `""` |
| `cv_debugMode` | boolean | `false` |

## Filter Pipeline Order

1. **Whitelist** — always first, always wins
2. **Emoji-only** — hides comments with only emoji characters
3. **Keyword blacklist** — hides matching keywords (only if `keywordEnabled` is true)
4. **Date pattern** — hides date mentions (only if `dateFilterEnabled` is true)
5. **Custom patterns** — user-defined regex (only if `dateFilterEnabled` is true)
6. **Word count** — min/max threshold (only if `wordCountMode !== "off"`)

## Commit & PR Conventions

**ALWAYS use meaningful, detailed commit messages.** Every commit must include:
- Clear subject line describing what changed
- Body with specific details: what files changed, why, what was fixed
- Reference to the phase/feature being worked on

**ALWAYS create PRs with detailed descriptions** including:
- Summary of changes
- Table of files changed with descriptions
- Bug fixes included
- Testing results
- Screenshots if UI changes

**Never commit with generic messages like "fix" or "update".**

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
| Word Count | `wordCountMode` + `wordCountValue` | Hides comments with too few/many words |
| Strip Emojis | `stripEmoji` | Modifier for word count — strips emojis before counting |
| Keyword Blacklist | `keywordEnabled` + `blacklist` | Hides comments matching comma-separated keywords |
| Emoji-Only | `emojiOnlyEnabled` | Hides comments containing ONLY emoji characters |
