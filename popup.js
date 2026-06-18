/**
 * @fileoverview Popup logic for Comment Vaccinator.
 * Loads/saves settings, communicates with content script.
 * Uses cv_ prefixed storage keys.
 */

document.addEventListener("DOMContentLoaded", () => {
  const dateFilterEnabled = document.getElementById("dateFilterEnabled");
  const wordCountEnabled = document.getElementById("wordCountEnabled");
  const wordCountMode = document.getElementById("wordCountMode");
  const wordCountValue = document.getElementById("wordCountValue");
  const wordCountControls = document.getElementById("wordCountControls");
  const emojiFilterEnabled = document.getElementById("emojiFilterEnabled");
  const emojiOnlyEnabled = document.getElementById("emojiOnlyEnabled");
  const keywordEnabled = document.getElementById("keywordEnabled");
  const keywordList = document.getElementById("keywordList");
  const customPatternsEnabled = document.getElementById("customPatternsEnabled");
  const patternEditorBody = document.getElementById("patternEditorBody");
  const statsListBtn = document.getElementById("statsListBtn");
  const statsChartBtn = document.getElementById("statsChartBtn");
  const summaryList = document.getElementById("summaryList");
  const summaryChart = document.getElementById("summaryChart");
  const summaryDonut = document.getElementById("summaryDonut");
  const summaryDonutValue = document.getElementById("summaryDonutValue");
  const totalChart = document.getElementById("totalChart");
  const hiddenChart = document.getElementById("hiddenChart");
  const visibleChart = document.getElementById("visibleChart");

  // --- A. Load settings from storage ---
  chrome.storage.local.get(
    [
      "cv_dateFilterEnabled",
      "cv_wordCountMode",
      "cv_wordCountValue",
      "cv_stripEmoji",
      "cv_blacklist",
      "cv_keywordEnabled",
      "cv_emojiOnlyEnabled",
      "cv_customPatternsEnabled",
    ],
    (data) => {
      dateFilterEnabled.checked = data.cv_dateFilterEnabled !== undefined ? data.cv_dateFilterEnabled : true;

      wordCountEnabled.checked = data.cv_wordCountMode !== undefined && data.cv_wordCountMode !== "off";
      wordCountMode.value = data.cv_wordCountMode || "max";
      wordCountValue.value = data.cv_wordCountValue || 5;

      emojiFilterEnabled.checked = data.cv_stripEmoji !== undefined ? data.cv_stripEmoji : false;
      emojiOnlyEnabled.checked = data.cv_emojiOnlyEnabled !== undefined ? data.cv_emojiOnlyEnabled : false;

      keywordEnabled.checked = data.cv_keywordEnabled !== undefined ? data.cv_keywordEnabled : false;
      keywordList.value = data.cv_blacklist || "";

      customPatternsEnabled.checked = data.cv_customPatternsEnabled !== undefined ? data.cv_customPatternsEnabled : false;
      patternEditorBody.style.display = customPatternsEnabled.checked ? "block" : "none";

      // Initial UI state
      wordCountControls.style.display = wordCountEnabled.checked ? "block" : "none";
      emojiFilterEnabled.disabled = !wordCountEnabled.checked;
      keywordList.disabled = !keywordEnabled.checked;

      wordCountValue.min = 3;
      wordCountValue.max = 50;
    }
  );

  // --- B. Save settings on change ---
  function saveSettings() {
    const isWcEnabled = wordCountEnabled.checked;
    let wcCount = parseInt(wordCountValue.value);

    if (isNaN(wcCount) || wcCount < 3) {
      wcCount = 3;
    } else if (wcCount > 50) {
      wcCount = 50;
    }
    wordCountValue.value = wcCount;

    wordCountControls.style.display = isWcEnabled ? "block" : "none";
    emojiFilterEnabled.disabled = !isWcEnabled;
    keywordList.disabled = !keywordEnabled.checked;

    chrome.storage.local.set(
      {
        cv_dateFilterEnabled: dateFilterEnabled.checked,
        cv_wordCountMode: isWcEnabled ? wordCountMode.value : "off",
        cv_wordCountValue: wcCount,
        cv_stripEmoji: emojiFilterEnabled.checked,
        cv_emojiOnlyEnabled: emojiOnlyEnabled.checked,
        cv_keywordEnabled: keywordEnabled.checked,
        cv_blacklist: keywordList.value.trim(),
        cv_customPatternsEnabled: customPatternsEnabled.checked,
      },
      () => {
        // Notify content script to re-filter immediately.
        chrome.tabs.query({ url: "*://*.youtube.com/*" }, (tabs) => {
          tabs.forEach((tab) => {
            chrome.tabs.sendMessage(tab.id, { type: "REFILTER_NOW" }, () => {
              if (chrome.runtime.lastError) {}
            });
          });
        });
      }
    );
  }

  // Attach listeners to all controls
  dateFilterEnabled.addEventListener("change", saveSettings);
  wordCountEnabled.addEventListener("change", saveSettings);
  wordCountMode.addEventListener("change", saveSettings);
  wordCountValue.addEventListener("change", saveSettings);
  keywordEnabled.addEventListener("change", saveSettings);

  customPatternsEnabled.addEventListener("change", () => {
    patternEditorBody.style.display = customPatternsEnabled.checked ? "block" : "none";
    saveSettings();
  });
  keywordList.addEventListener("change", saveSettings);
  keywordList.addEventListener("blur", saveSettings);
  emojiFilterEnabled.addEventListener("change", saveSettings);
  emojiOnlyEnabled.addEventListener("change", saveSettings);

  // --- C. Get counts from Content Script (batched DOM reads) ---
  let _stats = { total: 0, hidden: 0, visible: 0 };

  function updateStatsDisplay(partial) {
    const prev = { ..._stats };
    _stats = { ..._stats, ...partial };

    // Only touch the DOM for fields that actually changed.
    if (_stats.total !== prev.total)
      document.getElementById("total").textContent = _stats.total;
    if (_stats.hidden !== prev.hidden)
      document.getElementById("hidden").textContent = _stats.hidden;
    if (_stats.visible !== prev.visible)
      document.getElementById("visible").textContent = _stats.visible;

    renderSummaryChart(_stats.total, _stats.hidden, _stats.visible);
  }

  function getCounts() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) return;

      chrome.tabs.sendMessage(tabs[0].id, { type: "GET_COUNTS" }, (response) => {
        if (chrome.runtime.lastError) {
          updateStatsDisplay({ total: 0, hidden: 0, visible: 0 });
          return;
        }

        if (response) {
          updateStatsDisplay(response);
        }
      });
    });
  }

  function renderSummaryChart(total, hidden, visible) {
    requestAnimationFrame(() => {
      totalChart.textContent = total;
      hiddenChart.textContent = hidden;
      visibleChart.textContent = visible;
      summaryDonutValue.textContent = total;

      if (total <= 0) {
        summaryDonut.style.background =
          "conic-gradient(#5bc0ff 0deg, #5bc0ff 360deg)";
        return;
      }

      const hiddenEnd = (hidden / total) * 360;
      summaryDonut.style.background = `conic-gradient(#bd77ff 0deg ${hiddenEnd}deg, #44d17f ${hiddenEnd}deg 360deg)`;
    });
  }

  function setStatsView(mode) {
    const viewMode = mode === "chart" ? "chart" : "list";
    summaryList.dataset.view = viewMode;
    summaryChart.dataset.view = viewMode;

    statsListBtn.classList.toggle("active", viewMode === "list");
    statsChartBtn.classList.toggle("active", viewMode === "chart");
  }

  statsListBtn.addEventListener("click", () => setStatsView("list"));
  statsChartBtn.addEventListener("click", () => setStatsView("chart"));
  setStatsView("list");

  let countsPollingTimer = null;

  // Initial count load when popup opens
  getCounts();

  // Keep counters fresh while popup is open.
  countsPollingTimer = setInterval(getCounts, 1200);

  window.addEventListener("beforeunload", () => {
    if (countsPollingTimer) {
      clearInterval(countsPollingTimer);
      countsPollingTimer = null;
    }
  });

  // --- D. Custom Pattern Editor ---
  const patternList = document.getElementById("pattern-list");
  const patternName = document.getElementById("pattern-name");
  const patternSource = document.getElementById("pattern-source");
  const patternTestInput = document.getElementById("pattern-test-input");
  const patternTestBtn = document.getElementById("pattern-test-btn");
  const patternTestResult = document.getElementById("pattern-test-result");
  const patternAddBtn = document.getElementById("pattern-add-btn");
  const patternError = document.getElementById("pattern-error");

  let customPatterns = [];
  let editingIndex = -1;

  const PRESET_PATTERNS = [
    { name: "first-comment", patternSource: "\\bfirst\\b", flags: "i" },
    { name: "sub4sub", patternSource: "\\bsub\\s*(?:4|for)\\s*sub\\b", flags: "i" },
    { name: "like-equals", patternSource: "\\blike\\s*=\\s*\\d+", flags: "i" },
    { name: "anyone-year", patternSource: "\\b(?:anyone|who)(?:\\s+\\w+){0,2}\\s+(?:in\\s+)?\\d{4}\\b", flags: "i" },
    { name: "pls-sub", patternSource: "\\bplz?\\b", flags: "i" },
    { name: "who-else", patternSource: "\\bwho\\s+else\\b", flags: "i" },
    { name: "im-early", patternSource: "\\b(?:i'm|i am)\\s+(?:early|here\\s+first)\\b", flags: "i" },
    { name: "dont-scroll", patternSource: "\\bdon'?t\\s+scroll\\b", flags: "i" },
    { name: "like-for-part", patternSource: "\\blike\\s+(?:for|to)\\s+(?:part|pt)\\s*\\d+\\b", flags: "i" },
    { name: "comment-for", patternSource: "\\bcomment\\s+\\w+\\s+for\\b", flags: "i" },
  ];

  function validateRegex(source, flags) {
    try {
      new RegExp(source, flags);
      return { valid: true, error: null };
    } catch (e) {
      return { valid: false, error: e.message };
    }
  }

  function setFormMode(mode) {
    if (mode === "edit") {
      patternAddBtn.textContent = "Save changes";
      patternAddBtn.style.background = "var(--accent-c)";
    } else {
      patternAddBtn.textContent = "Add pattern";
      patternAddBtn.style.background = "";
      editingIndex = -1;
    }
    patternError.textContent = "";
    patternTestResult.textContent = "";
  }

  function renderPatternList() {
    patternList.innerHTML = "";
    if (customPatterns.length === 0) {
      patternList.innerHTML = '<li style="font-size:11px;color:var(--muted);padding:4px 0;">No custom patterns yet.</li>';
      return;
    }
    customPatterns.forEach((p, i) => {
      const li = document.createElement("li");
      li.style.cssText = "display:flex;align-items:center;justify-content:space-between;padding:6px 8px;border:1px solid var(--line);border-radius:6px;margin-bottom:4px;font-size:12px;background:rgba(255,255,255,0.15);" + (editingIndex === i ? "border-color:var(--accent-c);" : "");

      const info = document.createElement("span");
      info.style.cssText = "flex:1;min-width:0;";
      const nameEl = document.createElement("strong");
      nameEl.style.color = "var(--text)";
      nameEl.textContent = p.name;
      const codeEl = document.createElement("code");
      codeEl.style.cssText = "font-size:10px;color:var(--muted);margin-left:4px;";
      codeEl.textContent = "/" + p.patternSource + "/" + p.flags;
      info.appendChild(nameEl);
      info.appendChild(codeEl);

      const btnWrap = document.createElement("span");
      btnWrap.style.cssText = "display:flex;gap:2px;margin-left:8px;";

      const editBtn = document.createElement("button");
      editBtn.textContent = "\u270e";
      editBtn.title = "Edit pattern";
      editBtn.style.cssText = "border:none;background:none;color:var(--accent-a);font-size:14px;cursor:pointer;padding:0 4px;";
      editBtn.addEventListener("click", () => {
        editingIndex = i;
        patternName.value = p.name;
        patternSource.value = p.patternSource;
        setFormMode("edit");
        renderPatternList();
        patternName.focus();
      });

      const delBtn = document.createElement("button");
      delBtn.textContent = "\u00d7";
      delBtn.title = "Delete pattern";
      delBtn.style.cssText = "border:none;background:none;color:#e74c3c;font-size:16px;cursor:pointer;padding:0 4px;";
      delBtn.addEventListener("click", () => {
        if (editingIndex === i) setFormMode("add");
        customPatterns.splice(i, 1);
        saveCustomPatterns();
        renderPatternList();
      });

      btnWrap.appendChild(editBtn);
      btnWrap.appendChild(delBtn);
      li.appendChild(info);
      li.appendChild(btnWrap);
      patternList.appendChild(li);
    });
  }

  function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function saveCustomPatterns() {
    const raw = customPatterns.map((p) => ({
      name: p.name,
      patternSource: p.patternSource,
      flags: p.flags,
    }));
    chrome.storage.local.set({ cv_customPatterns: JSON.stringify(raw) }, () => {
      chrome.tabs.query({ url: "*://*.youtube.com/*" }, (tabs) => {
        tabs.forEach((tab) => {
          chrome.tabs.sendMessage(tab.id, { type: "REFILTER_NOW" }, () => {
            if (chrome.runtime.lastError) {}
          });
        });
      });
    });
  }

  patternTestBtn.addEventListener("click", () => {
    const source = patternSource.value.trim();
    const testText = patternTestInput.value;

    patternError.textContent = "";
    patternTestResult.textContent = "";

    if (!source) {
      patternError.textContent = "Enter a regex pattern first.";
      return;
    }

    const result = validateRegex(source, "i");
    if (!result.valid) {
      patternError.textContent = result.error;
      return;
    }

    const regex = new RegExp(source, "i");
    const matched = regex.test(testText);
    patternTestResult.textContent = matched ? "\u2713 Match" : "\u2717 No match";
    patternTestResult.style.color = matched ? "#27ae60" : "#e74c3c";
  });

  patternAddBtn.addEventListener("click", () => {
    const name = patternName.value.trim();
    const source = patternSource.value.trim();

    patternError.textContent = "";

    if (!name) {
      patternError.textContent = "Pattern name is required.";
      return;
    }
    if (!source) {
      patternError.textContent = "Regex source is required.";
      return;
    }

    const result = validateRegex(source, "i");
    if (!result.valid) {
      patternError.textContent = result.error;
      return;
    }

    if (editingIndex >= 0) {
      if (customPatterns.some((p, idx) => idx !== editingIndex && p.name === name)) {
        patternError.textContent = "Another pattern with this name already exists.";
        return;
      }
      customPatterns[editingIndex] = { name, patternSource: source, flags: "i" };
      setFormMode("add");
    } else {
      if (customPatterns.some((p) => p.name === name)) {
        patternError.textContent = "A pattern with this name already exists.";
        return;
      }
      customPatterns.push({ name, patternSource: source, flags: "i" });
    }

    saveCustomPatterns();
    renderPatternList();

    patternName.value = "";
    patternSource.value = "";
    patternTestInput.value = "";
    patternTestResult.textContent = "";
  });

  patternName.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      setFormMode("add");
      patternName.value = "";
      patternSource.value = "";
      patternTestInput.value = "";
      renderPatternList();
    }
  });

  const patternResetBtn = document.getElementById("pattern-reset-btn");
  patternResetBtn.addEventListener("click", () => {
    if (!confirm("Reset all custom patterns to the 10 default presets? This cannot be undone.")) return;
    customPatterns = PRESET_PATTERNS.map((p) => ({ ...p }));
    saveCustomPatterns();
    renderPatternList();
  });

  // Load existing custom patterns, merge with presets
  chrome.storage.local.get(["cv_customPatterns", "cv_presetsInitialized"], (data) => {
    try {
      customPatterns = JSON.parse(data.cv_customPatterns || "[]");
    } catch (_) {
      customPatterns = [];
    }

    if (!data.cv_presetsInitialized) {
      const existingNames = new Set(customPatterns.map((p) => p.name));
      for (const preset of PRESET_PATTERNS) {
        if (!existingNames.has(preset.name)) {
          customPatterns.push({ ...preset });
        }
      }
      chrome.storage.local.set({
        cv_customPatterns: JSON.stringify(customPatterns),
        cv_presetsInitialized: true,
      });
    }

    renderPatternList();
  });
});
