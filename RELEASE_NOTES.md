# Release Notes

Copy-paste ready notes for the Chrome Web Store and Firefox Add-ons dashboards.
Each release gets one section with a store-specific block.

---

## v1.4.0 — Spam Filters pack

**Release date:** 2026-10-20

### Chrome Web Store — "What's new"

```
New: Spam Filters pack — five extra filters, all off by default, so nothing changes until you turn them on.

• Links — hide comments containing a URL, with an allow-list so you can keep trusted domains visible.
• Contact details — hide comments carrying an email, phone number, or Telegram/WhatsApp handle.
• All-caps — hide comments written entirely in capital letters (set the minimum letter count).
• Spam punctuation — hide comments with !!!, ???, repeated characters, doubled words, or spaced-out text.
• Extra date locales — now also detects date comments written in Spanish, French, German, Portuguese, and Russian.

Also new: the Comment Stats panel now shows a "hidden by filter" breakdown, so you can see exactly which filter is removing what.

The keyword whitelist still overrides every filter. Your existing settings and custom patterns are untouched.
```

### Firefox Add-ons — "Version notes"

```
Version 1.4.0 — Spam Filters pack

Five new filters, all disabled by default, so your existing setup behaves exactly as before until you switch them on:

• Links — hides comments containing a URL. An allowed-domains list lets you keep specific sites visible.
• Contact details — hides comments with an email address, phone number, or Telegram/WhatsApp handle.
• All-caps — hides comments written entirely in capital letters, with a configurable minimum letter count.
• Spam punctuation — hides comments with !!!, ???, repeated characters, doubled words, and spaced-out text.
• Extra date locales — date mentions are now also detected in Spanish, French, German, Portuguese, and Russian.

New in Comment Stats: a "hidden by filter" breakdown showing how many comments each filter removed, so you can fine-tune the settings that matter.

The keyword whitelist continues to override every other filter, and all existing settings and custom patterns carry over untouched.
```

### Store listing description updates

The long description in `STORE_DESCRIPTION.md` was updated with a new
"Spam Filters" section and the "hidden by filter" breakdown. Copy the
description text from that file when submitting the new version.

---

## v1.3.5 — Export / Import settings

**Release date:** 2026-06-21

### Chrome Web Store — "What's new"

```
New: Export and Import settings.

Save every filter setting, custom pattern, and toggle state to a JSON file, and restore or share it with one click. Imports are validated before anything is overwritten.

Also: "Reset to defaults" now restores only the 10 built-in presets and keeps your own custom patterns.
```

### Firefox Add-ons — "Version notes"

```
Version 1.3.5 — Export / Import settings

You can now export all of your filter settings, custom patterns, and toggle states to a JSON file, and import a config back with one click. Imported files are validated (including your regular expressions) before anything is overwritten, and you are asked to confirm first.

"Reset to defaults" now restores only the 10 built-in preset patterns and keeps the custom patterns you added.
```

---

## v1.3.4 — Firefox Android popup scaling

**Release date:** 2026-06-21

### Chrome Web Store — "What's new"

```
Fix: popup scaling on small screens so the settings panel renders correctly on mobile and narrow windows.
```

### Firefox Add-ons — "Version notes"

```
Version 1.3.4 — popup scaling fix

Adds a viewport meta tag so the extension popup scales correctly on Firefox for Android, where the popup opens as a full-screen overlay.
```

---

## v1.3.3 — Keyword whitelist

**Release date:** 2026-06-21

### Chrome Web Store — "What's new"

```
New: Keyword whitelist.

Protect comments that matter. Any comment containing a whitelisted keyword is always visible, even when it matches another filter. The whitelist overrides every other filter and is shown in green in the popup so it is easy to tell apart from the blacklist.
```

### Firefox Add-ons — "Version notes"

```
Version 1.3.3 — Keyword whitelist

Add a list of keywords that must always stay visible. A comment containing a whitelisted keyword is never hidden, even if it also contains a date, a blacklisted keyword, or matches a custom pattern. The whitelist takes priority over every other filter and is highlighted in green in the popup.
```

---

## v1.3.2 — Per-video pause

**Release date:** 2026-06-21

### Chrome Web Store — "What's new"

```
New: pause filtering on a single video.

Use the "Pause Filtering on This Video" switch in the popup to let every comment through on the video you are watching, while filtering stays on everywhere else. Up to 50 paused videos are remembered between sessions.
```

### Firefox Add-ons — "Version notes"

```
Version 1.3.2 — pause filtering per video

A new "Pause Filtering on This Video" switch in the popup lets every comment through on the current video while filtering continues everywhere else. The state survives page reloads and browser restarts, and the last 50 paused videos are remembered.
```

---

## v1.3.1 — Custom pattern editor

**Release date:** 2026-06-21

### Chrome Web Store — "What's new"

```
New: a custom pattern editor.

Ten ready-made spam patterns ship with the extension, and you can now add, edit, or delete your own regular expressions from the popup. Test any pattern against sample text before saving it. Custom patterns are stored locally and are included in exported settings.
```

### Firefox Add-ons — "Version notes"

```
Version 1.3.1 — custom pattern editor

Ten ready-made spam patterns ship with the extension, and you can now add, edit, or delete your own regular expressions directly in the popup. Every pattern can be tested against sample text before it is saved, and invalid expressions are reported inline instead of failing silently.
```
