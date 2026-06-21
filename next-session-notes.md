# Next Session: Phase 4 — Extension Icon Badge

## Status
- Phase 1 (Regex Pattern Editor) — Done, merged to master
- Phase 2 (Per-Video Toggle) — Done, PR ready at v1.3.2-phase-2-per-video-toggle
- Phase 3 (Keyword Whitelist) — Done, merged to master
- Phase 3 UI Improvements — Done, PR ready at v1.3.3-phase-3-keyword-whitelist

## Next Phase: Extension Icon Badge

### Overview
Show hidden comment count on the extension icon badge.

### Key Decisions
- Badge should show count of hidden comments on current tab
- Badge should reset when navigating to a new video
- Firefox uses `chrome.browserAction`, Chrome uses `chrome.action`
- Badge should be cleared when extension is disabled

### Files to Modify
- `background.js` — Badge update logic
- `src/content/main.js` — Report hidden count to background
- `manifest.json` — May need `activeTab` permission
- `manifest-firefox.json` — Same

## Current Version
- Branch: v1.3.3-phase-3-keyword-whitelist
- Manifests: v1.3.3
- Tests: 128 passing
- Zips: Chrome + Firefox v1.3.3 built
