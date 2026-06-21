# Comment Vaccinator – YouTube Comment Filter

## Overview
Browser extension that filters YouTube comments by date mentions, keyword blacklist/whitelist, word count thresholds, emoji-only content, and custom regex patterns. Per-video toggle, export/import settings, badge. Supports Chrome (MV3) and Firefox (MV2 + Firefox Android).

## Build
```bash
npm run build
```
Outputs to `build/`:
- `comment-vaccinator-chrome-v1.3.5.zip`
- `comment-vaccinator-firefox-v1.3.5.zip`
- `chrome-unpacked/` (for "Load unpacked" testing)

Build runs `validate.cjs` automatically — blocks on manifest errors.

## Validate
```bash
npm run validate
```
Pre-build manifest validation checks:
- Chrome MV3: manifest_version, permissions, action, service_worker
- Firefox MV2: manifest_version, browser_action, background.scripts, data_collection_permissions, strict_min_version >= 142
- Cross-check: version numbers match between manifests

## Test
```bash
npm test
```
138 tests covering all matchers, pipeline logic, word count edge cases, custom pattern validation, and export/import settings.

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
| `validate.cjs` | Pre-build manifest validation (Chrome MV3 + Firefox MV2) |
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
| `cv_customPatternsEnabled` | boolean | `false` |
| `cv_presetsInitialized` | boolean | `false` |
| `cv_perVideoDisabled` | JSON string | `"[]"` |
| `cv_currentVideoId` | string | `""` |
| `cv_debugMode` | boolean | `false` |

## Filter Pipeline Order

1. **Whitelist** — always first, always wins
2. **Emoji-only** — hides comments with only emoji characters
3. **Keyword blacklist** — hides matching keywords (only if `keywordEnabled` is true)
4. **Date pattern** — hides date mentions (only if `dateFilterEnabled` is true)
5. **Custom patterns** — user-defined regex (only if `customPatternsEnabled` is true, independent of date filter)
6. **Word count** — min/max threshold (only if `wordCountMode !== "off"`)

Note: Per-video disabled check happens before the pipeline in `processThread()`.

## Branch Naming Convention

Format: `{version}-{type}-{brief-description}`

Types:
- `phase` — implementation plan phases (e.g. `v1.3.1-phase-1-regex-pattern-editor`)
- `feature` — new features outside the plan
- `bugfix` — bug fixes
- `hotfix` — urgent production fixes
- `refactor` — code restructuring without behavior changes
- `chore` — tooling, deps, config updates

Examples:
```
v1.3.1-phase-1-regex-pattern-editor
v1.3.1-phase-2-per-video-toggle
v1.4.0-feature-keyword-export
v1.4.1-bugfix-firefox-badge
v1.4.2-chore-update-esbuild
```

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

## Known Issues

(No open issues)

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
| Keyword Whitelist | `whitelistEnabled` + `whitelist` | Overrides all other filters — matching comments always stay visible |
| Emoji-Only | `emojiOnlyEnabled` | Hides comments containing ONLY emoji characters |
| Custom Patterns | `customPatternsEnabled` + `customPatterns` | User-defined regex patterns (10 presets + custom) |
