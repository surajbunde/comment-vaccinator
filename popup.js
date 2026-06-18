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
});
