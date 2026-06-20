# Next Session: Phase 3 UI Improvements

## Status
- Phase 1 (Regex Pattern Editor) — Done, merged to master
- Phase 2 (Per-Video Toggle) — Done, PR ready at v1.3.2-phase-2-per-video-toggle
- Phase 3 (Keyword Whitelist) — Done, PR ready at v1.3.3-phase-3-keyword-whitelist

## Finalized Decisions

### 1. Hybrid Collapse for Blacklist & Whitelist
- Use `<details>` + `<summary>` elements (like Custom Patterns section)
- **Auto-open when enabled, auto-close when disabled** (via JS on toggle change)
- Collapsed state shows preview: first 2-3 keywords with "..." truncation
  - Example: "ad, sponsor, first..."
  - Example: "breakdown, analysis..."
- Collapsed color states:
  - Blacklist: `#e74c3c` tinted if enabled, grey if disabled
  - Whitelist: `#27ae60` tinted if enabled, grey if disabled
- Expanded state keeps existing red/green border styling

### 2. Remove "Enable" from Filter Labels
- Remove "Enable" from all filter labels
- Keep "Hide Emoji-Only Comments:" as-is (describes behavior, not feature name)

| Current Label | New Label |
|---------------|-----------|
| Enable Date Filter: | Date Filter: |
| Enable Word Count Filter: | Word Count Filter: |
| Hide Emoji-Only Comments: | Hide Emoji-Only Comments: (unchanged) |
| Enable Keyword Blacklist: | Blacklist: |
| Enable Keyword Whitelist: | Whitelist: |
| Enable Custom Patterns: | Custom Patterns: |

## Files to Modify
- `popup.html` — Convert blacklist/whitelist to `<details>`, update labels
- `popup.js` — Add auto-open/close on toggle, preview text update logic
- `popup.html` (inline styles) — Add collapsed state color classes

## Current Version
- Branch: v1.3.3-phase-3-keyword-whitelist
- Manifests: v1.3.3
- Tests: 128 passing
- Zips: Chrome + Firefox v1.3.3 built
