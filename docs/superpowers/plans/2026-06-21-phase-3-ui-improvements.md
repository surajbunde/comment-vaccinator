# Phase 3 UI Improvements — Hybrid Collapse & Label Cleanup

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make blacklist/whitelist sections collapsible with auto-open/close behavior and clean up filter labels by removing redundant "Enable" text.

**Architecture:** Convert blacklist/whitelist from `<div class="setting-group">` to `<details>` elements. Add JS to auto-open/close on toggle. Add collapsed-state preview showing first 2-3 keywords.

**Tech Stack:** HTML `<details>`/`<summary>`, inline CSS, vanilla JS (no new dependencies)

---

## Files to Modify

| File | Changes |
|------|---------|
| `popup.html` | Convert blacklist/whitelist sections to `<details>`, update labels, add CSS for collapsed states |
| `popup.js` | Add auto-open/close logic, preview text update function, initial collapsed state on load |

---

## Task 1: Update Filter Labels in popup.html

Remove "Enable" from all filter labels except "Hide Emoji-Only Comments".

**File:** `popup.html`

- [ ] **Step 1: Update Date Filter label (line 435)**

Change:
```html
<label for="dateFilterEnabled">Enable Date Filter:</label>
```
To:
```html
<label for="dateFilterEnabled">Date Filter:</label>
```

- [ ] **Step 2: Update Word Count Filter label (line 445)**

Change:
```html
<label for="wordCountEnabled">Enable Word Count Filter:</label>
```
To:
```html
<label for="wordCountEnabled">Word Count Filter:</label>
```

- [ ] **Step 3: Update Custom Patterns label (line 526)**

Change:
```html
<label for="customPatternsEnabled">Enable Custom Patterns:</label>
```
To:
```html
<label for="customPatternsEnabled">Custom Patterns:</label>
```

- [ ] **Step 4: Verify labels**

Confirm the following labels are unchanged:
- "Hide Emoji-Only Comments:" (line 475) — keep as-is
- "Pause Filtering on This Video:" (line 512) — keep as-is

- [ ] **Step 5: Commit**

```bash
git add popup.html
git commit -m "refactor(popup): remove redundant 'Enable' from filter labels"
```

---

## Task 2: Convert Blacklist Section to Collapsible `<details>`

**File:** `popup.html`

- [ ] **Step 1: Add CSS for collapsed state colors**

In the `<style>` section (after the `.counts-head` block around line 296), add:

```css
/* Collapsed state color indicators */
details.setting-group[data-enabled="true"][data-color="red"] {
  border-color: #e74c3c;
  background: linear-gradient(130deg, rgba(231,76,60,0.06), rgba(231,76,60,0.01));
}
details.setting-group[data-enabled="false"][data-color="red"] {
  border-color: var(--line);
  background: rgba(255,255,255,0.15);
}
details.setting-group[data-enabled="true"][data-color="green"] {
  border-color: #27ae60;
  background: linear-gradient(130deg, rgba(39,174,96,0.08), rgba(39,174,96,0.02));
}
details.setting-group[data-enabled="false"][data-color="green"] {
  border-color: var(--line);
  background: rgba(255,255,255,0.15);
}
details.setting-group summary {
  cursor: pointer;
  font-weight: 600;
  font-size: 13px;
  list-style: none;
}
details.setting-group summary::-webkit-details-marker {
  display: none;
}
details.setting-group .preview-text {
  font-size: 11px;
  color: var(--muted);
  font-weight: normal;
  margin-left: 8px;
}
```

- [ ] **Step 2: Convert Blacklist section (lines 483-493)**

Replace the entire blacklist `<div>`:
```html
<div class="setting-group" style="border-color:#e74c3c;background:linear-gradient(130deg, rgba(231,76,60,0.06), rgba(231,76,60,0.01));">
  <div class="flex-row">
      <label for="keywordEnabled">Enable Keyword Blacklist:</label>
      <label class="switch">
          <input type="checkbox" id="keywordEnabled">
          <span class="slider"></span>
      </label>
  </div>
  <label for="keywordList">Blacklist Keywords (comma-separated):</label>
  <textarea id="keywordList" placeholder="e.g., ad, sponsor, first, subscribe" style="border-left:3px solid #e74c3c;"></textarea>
</div>
```

With:
```html
<details id="blacklist-section" class="setting-group" data-color="red" data-enabled="false" open>
  <summary>
    Blacklist:
    <span class="preview-text" id="blacklistPreview"></span>
    <label class="switch" style="float:right;">
        <input type="checkbox" id="keywordEnabled">
        <span class="slider"></span>
    </label>
  </summary>
  <div id="blacklistBody">
    <label for="keywordList">Blacklist Keywords (comma-separated):</label>
    <textarea id="keywordList" placeholder="e.g., ad, sponsor, first, subscribe" style="border-left:3px solid #e74c3c;"></textarea>
  </div>
</details>
```

- [ ] **Step 3: Commit**

```bash
git add popup.html
git commit -m "feat(popup): convert blacklist section to collapsible details"
```

---

## Task 3: Convert Whitelist Section to Collapsible `<details>`

**File:** `popup.html`

- [ ] **Step 1: Convert Whitelist section (lines 495-508)**

Replace the entire whitelist `<div>`:
```html
<div class="setting-group" style="border-color:#27ae60;background:linear-gradient(130deg, rgba(39,174,96,0.08), rgba(39,174,96,0.02));">
  <div class="flex-row">
      <label for="whitelistEnabled" title="Whitelist overrides all other filters — matching comments always stay visible.">Enable Keyword Whitelist:</label>
      <label class="switch">
          <input type="checkbox" id="whitelistEnabled">
          <span class="slider"></span>
      </label>
  </div>
  <label for="whitelist">Whitelist Keywords (comma-separated):</label>
  <textarea id="whitelist" placeholder="e.g., breakdown, analysis, tutorial" style="border-left:3px solid #27ae60;"></textarea>
  <div style="font-size:11px;color:var(--muted);margin-top:4px;">
    Matching comments are never hidden, even if they match other filters.
  </div>
</div>
```

With:
```html
<details id="whitelist-section" class="setting-group" data-color="green" data-enabled="false" open>
  <summary>
    Whitelist:
    <span class="preview-text" id="whitelistPreview"></span>
    <label class="switch" style="float:right;" title="Whitelist overrides all other filters — matching comments always stay visible.">
        <input type="checkbox" id="whitelistEnabled">
        <span class="slider"></span>
    </label>
  </summary>
  <div id="whitelistBody">
    <label for="whitelist">Whitelist Keywords (comma-separated):</label>
    <textarea id="whitelist" placeholder="e.g., breakdown, analysis, tutorial" style="border-left:3px solid #27ae60;"></textarea>
    <div style="font-size:11px;color:var(--muted);margin-top:4px;">
      Matching comments are never hidden, even if they match other filters.
    </div>
  </div>
</details>
```

- [ ] **Step 2: Commit**

```bash
git add popup.html
git commit -m "feat(popup): convert whitelist section to collapsible details"
```

---

## Task 4: Add JS Logic for Auto-Open/Close and Preview

**File:** `popup.js`

- [ ] **Step 1: Add helper function for preview text (after `setStatsView` function, around line 245)**

```javascript
/**
 * Generates preview text from comma-separated keywords.
 * Shows first 2-3 keywords, truncated with "..." if more.
 * @param {string} value - Comma-separated keyword string
 * @returns {string} Preview text
 */
function getKeywordPreview(value) {
  if (!value || !value.trim()) return "";
  const keywords = value.split(",").map(k => k.trim()).filter(k => k);
  if (keywords.length === 0) return "";
  const preview = keywords.slice(0, 3).join(", ");
  return keywords.length > 3 ? preview + "..." : preview;
}

/**
 * Updates collapsed state colors and preview text for a details section.
 * @param {string} sectionId - The details element ID
 * @param {string} previewId - The preview span element ID
 * @param {boolean} enabled - Whether the toggle is on
 * @param {string} value - The textarea value
 */
function updateSectionState(sectionId, previewId, enabled, value) {
  const section = document.getElementById(sectionId);
  const preview = document.getElementById(previewId);
  if (!section || !preview) return;

  section.dataset.enabled = enabled;
  preview.textContent = enabled ? "" : getKeywordPreview(value);
}
```

- [ ] **Step 2: Add auto-open/close for Blacklist (in the `keywordEnabled` event listener, around line 135)**

Replace:
```javascript
keywordEnabled.addEventListener("change", saveSettings);
```

With:
```javascript
keywordEnabled.addEventListener("change", () => {
  const section = document.getElementById("blacklist-section");
  if (keywordEnabled.checked) {
    section.open = true;
  } else {
    section.open = false;
  }
  saveSettings();
});
```

- [ ] **Step 3: Add auto-open/close for Whitelist (in the `whitelistEnabled` event listener, around line 147)**

Replace:
```javascript
whitelistEnabled.addEventListener("change", () => {
  whitelist.disabled = !whitelistEnabled.checked;
  saveSettings();
});
```

With:
```javascript
whitelistEnabled.addEventListener("change", () => {
  whitelist.disabled = !whitelistEnabled.checked;
  const section = document.getElementById("whitelist-section");
  if (whitelistEnabled.checked) {
    section.open = true;
  } else {
    section.open = false;
  }
  updateSectionState("whitelist-section", "whitelistPreview", whitelistEnabled.checked, whitelist.value);
  saveSettings();
});
```

- [ ] **Step 4: Update preview on textarea change (in `keywordList` event listeners, around line 141)**

Replace:
```javascript
keywordList.addEventListener("change", saveSettings);
keywordList.addEventListener("blur", saveSettings);
```

With:
```javascript
keywordList.addEventListener("change", () => {
  updateSectionState("blacklist-section", "blacklistPreview", keywordEnabled.checked, keywordList.value);
  saveSettings();
});
keywordList.addEventListener("blur", () => {
  updateSectionState("blacklist-section", "blacklistPreview", keywordEnabled.checked, keywordList.value);
  saveSettings();
});
```

- [ ] **Step 5: Update preview on whitelist textarea change (in `whitelist` event listeners, around line 151)**

Replace:
```javascript
whitelist.addEventListener("change", saveSettings);
whitelist.addEventListener("blur", saveSettings);
```

With:
```javascript
whitelist.addEventListener("change", () => {
  updateSectionState("whitelist-section", "whitelistPreview", whitelistEnabled.checked, whitelist.value);
  saveSettings();
});
whitelist.addEventListener("blur", () => {
  updateSectionState("whitelist-section", "whitelistPreview", whitelistEnabled.checked, whitelist.value);
  saveSettings();
});
```

- [ ] **Step 6: Initialize collapsed state on load (after initial settings load, around line 74)**

Add after the initial `chrome.storage.local.get` callback:
```javascript
// Initialize collapsed state and preview for blacklist
const blacklistSection = document.getElementById("blacklist-section");
blacklistSection.dataset.enabled = keywordEnabled.checked;
blacklistSection.open = keywordEnabled.checked;
if (!keywordEnabled.checked) {
  document.getElementById("blacklistPreview").textContent = getKeywordPreview(keywordList.value);
}

// Initialize collapsed state and preview for whitelist
const whitelistSection = document.getElementById("whitelist-section");
whitelistSection.dataset.enabled = whitelistEnabled.checked;
whitelistSection.open = whitelistEnabled.checked;
if (!whitelistEnabled.checked) {
  document.getElementById("whitelistPreview").textContent = getKeywordPreview(whitelist.value);
}
```

- [ ] **Step 7: Commit**

```bash
git add popup.js
git commit -m "feat(popup): add hybrid collapse logic for blacklist/whitelist"
```

---

## Task 5: Final Verification

- [ ] **Step 1: Run tests**

```bash
npm test
```

Expected: All 128 tests pass (no logic changes, just UI).

- [ ] **Step 2: Manual testing checklist**

Test in browser (Chrome + Firefox):

| Test | Expected |
|------|----------|
| Open popup with blacklist disabled | Collapsed, grey border, shows preview text |
| Open popup with blacklist enabled | Expanded, red border, no preview |
| Toggle blacklist ON | Section opens, preview hidden |
| Toggle blacklist OFF | Section closes, preview shows keywords |
| Repeat for whitelist | Green border instead of red |
| Verify all labels | "Date Filter:", "Word Count Filter:", "Hide Emoji-Only Comments:", "Blacklist:", "Whitelist:", "Custom Patterns:" |
| Check popup width | No horizontal overflow |

- [ ] **Step 3: Build zips**

```bash
npm run build
```

Expected: Chrome + Firefox zips built successfully.

- [ ] **Step 4: Commit any fixes (if needed)**

```bash
git add popup.html popup.js
git commit -m "fix(popup): UI adjustments from manual testing"
```
