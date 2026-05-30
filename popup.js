document.addEventListener('DOMContentLoaded', () => {
    const dateFilterEnabled = document.getElementById('dateFilterEnabled');
    const wordCountEnabled = document.getElementById('wordCountEnabled');
    const wordCountMode = document.getElementById('wordCountMode');
    const wordCountValue = document.getElementById('wordCountValue');
    const wordCountControls = document.getElementById('wordCountControls');
    const emojiFilterEnabled = document.getElementById('emojiFilterEnabled'); // NEW ELEMENT
    const keywordEnabled = document.getElementById('keywordEnabled');
    const keywordList = document.getElementById('keywordList');
    const statsListBtn = document.getElementById('statsListBtn');
    const statsChartBtn = document.getElementById('statsChartBtn');
    const summaryList = document.getElementById('summaryList');
    const summaryChart = document.getElementById('summaryChart');
    const summaryDonut = document.getElementById('summaryDonut');
    const summaryDonutValue = document.getElementById('summaryDonutValue');
    const totalChart = document.getElementById('totalChart');
    const hiddenChart = document.getElementById('hiddenChart');
    const visibleChart = document.getElementById('visibleChart');

    // --- A. Load settings from storage ---
    chrome.storage.local.get([
        'dateFilterEnabled',
        'wordCountEnabled', 'wordCountMode', 'wordCountValue',
        'keywordEnabled', 'keywordList', 'emojiFilterEnabled' // NEW SETTING
    ], (data) => {
        // Date filter setting
        dateFilterEnabled.checked = data.dateFilterEnabled !== undefined ? data.dateFilterEnabled : true;

        // Word Count Settings
        wordCountEnabled.checked = data.wordCountEnabled !== undefined ? data.wordCountEnabled : true;
        wordCountMode.value = data.wordCountMode || 'max';
        wordCountValue.value = data.wordCountValue || 12; 
        
        // Emoji Setting
        emojiFilterEnabled.checked = data.emojiFilterEnabled !== undefined ? data.emojiFilterEnabled : true; // Default to ON for aggressive date filtering
        
        // Keyword Settings
        keywordEnabled.checked = data.keywordEnabled !== undefined ? data.keywordEnabled : false;
        keywordList.value = data.keywordList || '';

        // Initial UI state
        wordCountControls.style.display = wordCountEnabled.checked ? 'block' : 'none';
        keywordList.disabled = !keywordEnabled.checked;
        
        wordCountValue.min = 3;
        wordCountValue.max = 50;
    });

    // --- B. Save settings on change (Includes Auto-Reload Logic) ---
    function saveSettings() {
        // 1. Sanitize and update word count inputs
        const isWcEnabled = wordCountEnabled.checked;
        let wcCount = parseInt(wordCountValue.value);

        if (isNaN(wcCount) || wcCount < 3) { wcCount = 3; } 
        else if (wcCount > 50) { wcCount = 50; }
        wordCountValue.value = wcCount;

        // 2. Update UI state
        wordCountControls.style.display = isWcEnabled ? 'block' : 'none';
        keywordList.disabled = !keywordEnabled.checked;

        // 3. Save to storage
        chrome.storage.local.set({ 
            dateFilterEnabled: dateFilterEnabled.checked,
            wordCountEnabled: isWcEnabled,
            wordCountMode: wordCountMode.value,
            wordCountValue: wcCount,
            emojiFilterEnabled: emojiFilterEnabled.checked, // NEW SAVE
            keywordEnabled: keywordEnabled.checked,
            keywordList: keywordList.value.trim()
        }, () => {
             // 4. CRITICAL: Auto-Reload on Save
             chrome.tabs.query({ url: "*://www.youtube.com/*" }, (tabs) => {
                tabs.forEach(tab => {
                    chrome.tabs.sendMessage(tab.id, { type: 'REFILTER_NOW' }, (response) => {
                        if (chrome.runtime.lastError) {} 
                    });
                });
            });
        });
    }

    // Attach listeners to all controls
    dateFilterEnabled.addEventListener('change', saveSettings);
    wordCountEnabled.addEventListener('change', saveSettings);
    wordCountMode.addEventListener('change', saveSettings);
    wordCountValue.addEventListener('change', saveSettings);
    keywordEnabled.addEventListener('change', saveSettings);
    keywordList.addEventListener('change', saveSettings);
    keywordList.addEventListener('blur', saveSettings); 
    emojiFilterEnabled.addEventListener('change', saveSettings); // NEW LISTENER

    // --- C. Get counts from Content Script ---
    function getCounts() {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length === 0) return; 

            chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_COUNTS' }, (response) => {
                if (chrome.runtime.lastError) {
                    document.getElementById('total').textContent = '0';
                    document.getElementById('hidden').textContent = '0';
                    document.getElementById('visible').textContent = '0';
                    renderSummaryChart(0, 0, 0);
                    return;
                }
                
                if (response) {
                    document.getElementById('total').textContent = response.total;
                    document.getElementById('hidden').textContent = response.hidden;
                    document.getElementById('visible').textContent = response.visible;
                    renderSummaryChart(response.total, response.hidden, response.visible);
                }
            });
        });
    }

    function renderSummaryChart(total, hidden, visible) {
        totalChart.textContent = total;
        hiddenChart.textContent = hidden;
        visibleChart.textContent = visible;
        summaryDonutValue.textContent = total;

        if (total <= 0) {
            summaryDonut.style.background = 'conic-gradient(#5bc0ff 0deg, #5bc0ff 360deg)';
            return;
        }

        const hiddenEnd = (hidden / total) * 360;
        summaryDonut.style.background = `conic-gradient(#bd77ff 0deg ${hiddenEnd}deg, #44d17f ${hiddenEnd}deg 360deg)`;
    }

    function setStatsView(mode) {
        const viewMode = mode === 'chart' ? 'chart' : 'list';
        summaryList.dataset.view = viewMode;
        summaryChart.dataset.view = viewMode;

        statsListBtn.classList.toggle('active', viewMode === 'list');
        statsChartBtn.classList.toggle('active', viewMode === 'chart');
    }

    statsListBtn.addEventListener('click', () => setStatsView('list'));
    statsChartBtn.addEventListener('click', () => setStatsView('chart'));
    setStatsView('list');

    let countsPollingTimer = null;

    // Initial count load when popup opens
    getCounts();

    // Keep counters fresh while popup is open.
    countsPollingTimer = setInterval(getCounts, 1200);

    window.addEventListener('beforeunload', () => {
        if (countsPollingTimer) {
            clearInterval(countsPollingTimer);
            countsPollingTimer = null;
        }
    });
});
