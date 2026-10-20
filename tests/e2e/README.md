# Browser end-to-end tests

These suites drive a **real browser** against the **built extension** and check
that the popup, the content script and the settings I/O all behave in a real
browser — not just in Node.

| Suite | Browser | Protocol | Command |
|---|---|---|---|
| `chrome-extension.test.mjs` | Chrome / Edge / Brave / Chromium | DevTools Protocol | `npm run test:e2e:chrome` |
| `firefox-extension.test.mjs` | Firefox | Marionette | `npm run test:e2e:firefox` |

Both are **dependency-free** — they use Node's built-in `WebSocket` and `net`
modules, so there is nothing to install beyond the browser itself.

```bash
npm run build          # builds build/chrome-unpacked and build/firefox-unpacked
npm run test:e2e       # runs both suites
```

The suites build the extension automatically if `build/*-unpacked` is missing.

## What they check

1. The popup renders the **Spam Filters** section.
2. Every spam filter defaults to **OFF**.
3. Toggling a filter persists to `cv_spamFilters` and updates the section preview.
4. The content script filters comments and reports the right **reason code**
   for each one (date, links, contacts, caps, punctuation, locale-date).
5. The **keyword whitelist** overrides the spam filters, and the **domain
   allow-list** keeps allowed links visible.
6. The "hidden by filter" breakdown comes back from the content script.
7. **Export** writes a config that contains the settings, and **Import**
   applies them.

## Requirements

- **Node 22 or newer** (the suites use the global `WebSocket`).
- Chrome and/or Firefox installed.
- Headless is used, so no window appears.

If a browser is installed somewhere unusual, point the suite at it:

```bash
CHROME_PATH=/path/to/chrome npm run test:e2e:chrome
FIREFOX_PATH=/path/to/firefox npm run test:e2e:firefox
```

## How the tests work

The suites never touch the real `www.youtube.com`. Instead:

- A **local HTTP server** serves a small page that mimics the YouTube comment
  markup (`ytd-comments#comments` → `ytd-comment-thread-renderer` →
  `#content-text`).
- The extension under test is a **copy** of the real build whose manifest
  additionally matches `http://localhost/*`. The shipped manifest is never
  modified.
- The content script therefore runs against a page it recognises, and the
  filtering result can be asserted exactly.

The comments are chosen so each one exercises a different filter, plus three
that must stay visible (a normal comment, a whitelisted comment and a comment
with an allowed domain).

## Notes per browser

- **Chrome 137+** ignores the `--load-extension` command line switch. The
  suite installs the extension over the DevTools Protocol instead
  (`Extensions.loadUnpacked`), which requires Chrome to be started with
  `--enable-unsafe-extension-debugging`. The suite does this for you.
- **Firefox** installs the extension as a temporary add-on over Marionette.
  Marionette is part of Firefox, so nothing extra is needed.

## Running in CI

The suites are self-contained, so a GitHub Actions job is short:

```yaml
- uses: actions/checkout@v4
- uses: actions/setup-node@v4
  with:
    node-version: 22
- run: npm ci
- run: npm run test:e2e
```

Chrome and Firefox are both pre-installed on the GitHub-hosted runners.

## Screenshots

Each suite writes a screenshot of the popup to
`build/screenshots/popup-e2e-<browser>.png` so a failure can be eyeballed.
