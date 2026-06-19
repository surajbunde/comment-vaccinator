# Next Session: Phase 3 UI Improvements

## Status
- Phase 1 (Regex Pattern Editor) — Done, merged to master
- Phase 2 (Per-Video Toggle) — Done, PR ready at v1.3.2-phase-2-per-video-toggle
- Phase 3 (Keyword Whitelist) — Done, PR ready at v1.3.3-phase-3-keyword-whitelist

## Next Tasks (Phase 3 UI Improvements)

### Collapsing Sections for Blacklist & Whitelist
1. Make blacklist and whitelist sections collapsible (`<details>` elements)
2. Remove "Enable Keyword" text from labels — toggles already serve this purpose
3. Collapsed state should show visual indicator of enabled/disabled:
   - **Blacklist collapsed**: red-tinted if enabled, grey if disabled
   - **Whitelist collapsed**: green-tinted if enabled, grey if disabled
4. Show minimal preview data in collapsed state (recent keywords first):
   - Example: "ad, sponsor, first..." or "breakdown, analysis..."
   - Show first 2-3 keywords, truncate with "..." if more

### Implementation Notes
- Use `<details>` + `<summary>` for collapsible behavior (no JS needed)
- Add CSS for color states based on toggle state
- Preview text should update dynamically when keywords change
- Keep existing green/red border styling for expanded state

## Files to Modify
- `popup.html` — Convert blacklist/whitelist sections to `<details>` elements
- `popup.js` — Add preview text update logic
- `popup.css` (inline styles) — Add collapsed state color classes

## Current Version
- Branch: v1.3.3-phase-3-keyword-whitelist
- Manifests: v1.3.3
- Tests: 128 passing
- Zips: Chrome + Firefox v1.3.3 built
