/**
 * SuperEyes — Main application logic
 */
(function () {
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const loading = document.getElementById('loading');
  const loadingText = document.getElementById('loadingText');
  const loadingSteps = document.getElementById('loadingSteps');
  const progressBar = document.getElementById('progressBar');
  const results = document.getElementById('results');
  const emptyState = document.getElementById('emptyState');
  const resultQuery = document.getElementById('resultQuery');
  const resultCount = document.getElementById('resultCount');
  const typeBtns = document.querySelectorAll('.type-btn');
  const suggestionTags = document.querySelectorAll('.suggestion-tag');
  const aiBody = document.getElementById('aiBody');
  const aiAnalysis = document.getElementById('aiAnalysis');

  // Settings
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsModal = document.getElementById('settingsModal');
  const apiKeyInput = document.getElementById('apiKeyInput');
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');
  const closeSettingsBtn = document.getElementById('closeSettingsBtn');
  const aiSetupBtn = document.getElementById('aiSetupBtn');

  let currentType = 'all';

  // === Settings Modal ===
  settingsBtn.addEventListener('click', openSettings);
  if (aiSetupBtn) aiSetupBtn.addEventListener('click', openSettings);
  closeSettingsBtn.addEventListener('click', closeSettings);
  settingsModal.querySelector('.modal-backdrop').addEventListener('click', closeSettings);
  saveSettingsBtn.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    if (key) {
      localStorage.setItem('supereyes_api_key', key);
    } else {
      localStorage.removeItem('supereyes_api_key');
    }
    closeSettings();
  });

  function openSettings() {
    apiKeyInput.value = localStorage.getItem('supereyes_api_key') || '';
    settingsModal.classList.remove('hidden');
    apiKeyInput.focus();
  }

  function closeSettings() {
    settingsModal.classList.add('hidden');
  }

  // === Type Toggle ===
  typeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      typeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentType = btn.dataset.type;
    });
  });

  // === Suggestions ===
  suggestionTags.forEach(tag => {
    tag.addEventListener('click', () => {
      searchInput.value = tag.dataset.query;
      performSearch();
    });
  });

  // === Search ===
  searchBtn.addEventListener('click', performSearch);
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') performSearch();
  });

  const loadingMessages = {
    company: '搜尋公司登記資料...',
    court: '搜尋法院判決...',
    news: '搜尋相關新聞...',
    public: '搜尋公開資料...',
    fb: '搜尋 Facebook...',
    ig: '搜尋 Instagram...'
  };

  async function performSearch() {
    const query = searchInput.value.trim();
    if (!query) { searchInput.focus(); return; }

    saveRecentSearch(query);

    // Show loading
    emptyState.classList.add('hidden');
    results.classList.add('hidden');
    loading.classList.remove('hidden');
    loadingSteps.innerHTML = '';
    progressBar.style.width = '0%';
    loadingText.textContent = '正在搜尋...';

    // Disable button
    searchBtn.disabled = true;

    try {
      const searchResults = await SearchEngine.searchAll(query, currentType, (done, total, category) => {
        const pct = Math.round((done / total) * 80);
        progressBar.style.width = pct + '%';
        loadingText.textContent = loadingMessages[category] || '搜尋中...';

        const step = document.createElement('div');
        step.className = 'loading-step done';
        step.textContent = loadingMessages[category]?.replace('...', '') + ' 完成';
        loadingSteps.appendChild(step);
      });

      // Render results
      renderResults(query, searchResults);
      loading.classList.add('hidden');
      results.classList.remove('hidden');

      // Run AI analysis
      runAIAnalysis(query, searchResults);

    } catch (err) {
      loading.classList.add('hidden');
      emptyState.classList.remove('hidden');
      console.error('Search failed:', err);
    } finally {
      searchBtn.disabled = false;
    }
  }

  async function runAIAnalysis(query, searchResults) {
    const apiKey = localStorage.getItem('supereyes_api_key');
    if (!apiKey) {
      aiBody.innerHTML = `
        <div class="ai-placeholder">
          <p>設定 MiniMax API Key 即可啟用 AI 交叉比對分析</p>
          <button class="btn-small" onclick="document.getElementById('settingsBtn').click()">前往設定</button>
        </div>`;
      return;
    }

    aiBody.innerHTML = `
      <div class="ai-loading">
        <div class="ai-typing">
          <span></span><span></span><span></span>
        </div>
        <p>AI 正在分析資料並進行交叉比對...</p>
      </div>`;

    const analysis = await AIAnalyzer.analyze(query, searchResults);
    if (analysis) {
      aiBody.innerHTML = `<div class="ai-result">${formatMarkdown(analysis)}</div>`;
    } else {
      aiBody.innerHTML = `
        <div class="ai-placeholder">
          <p>AI 分析無法完成，請確認 API Key 是否正確</p>
        </div>`;
    }
  }

  function renderResults(query, data) {
    resultQuery.textContent = query;

    let totalCount = 0;
    Object.values(data).forEach(d => { if (d.count) totalCount += d.count; });
    resultCount.textContent = totalCount > 0 ? `找到 ${totalCount} 筆資料` : '';

    renderCard('result-company', 'status-company', data.company);
    renderCard('result-court', 'status-court', data.court);
    renderCard('result-news', 'status-news', data.news);
    renderCard('result-public', 'status-public', data.public);
    renderCard('result-fb', 'status-fb', data.fb);
    renderCard('result-ig', 'status-ig', data.ig);

    document.getElementById('card-company').classList.toggle('hidden', !data.company);
    document.getElementById('card-court').classList.toggle('hidden', !data.court);
    document.getElementById('card-news').classList.toggle('hidden', !data.news);
    document.getElementById('card-public').classList.toggle('hidden', !data.public);
    document.getElementById('card-fb').classList.toggle('hidden', !data.fb);
    document.getElementById('card-ig').classList.toggle('hidden', !data.ig);
  }

  function renderCard(bodyId, statusId, data) {
    const el = document.getElementById(bodyId);
    const statusEl = document.getElementById(statusId);
    if (!el || !data) return;

    // Status badge
    if (statusEl) {
      if (data.count > 0) {
        statusEl.textContent = `${data.count} 筆`;
        statusEl.className = 'card-status has-data';
      } else {
        statusEl.textContent = '連結';
        statusEl.className = 'card-status';
      }
    }

    let html = '';

    data.results.forEach(item => {
      if (item.type === 'data') {
        html += `<div class="data-card">
          <div class="data-title">${escapeHtml(item.title)}</div>
          <div class="data-details">
            ${item.details.map(d => `
              <div class="data-row">
                <span class="data-label">${escapeHtml(d.label)}</span>
                <span class="data-value">${escapeHtml(d.value)}</span>
              </div>
            `).join('')}
          </div>
        </div>`;
      } else if (item.type === 'news') {
        html += `<div class="news-item">
          <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer" class="news-title">${escapeHtml(item.title)}</a>
          <div class="news-meta">
            ${item.source ? `<span class="news-source">${escapeHtml(item.source)}</span>` : ''}
            ${item.date ? `<span class="news-date">${escapeHtml(item.date)}</span>` : ''}
          </div>
        </div>`;
      } else if (item.type === 'link') {
        html += `<a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer" class="ext-link">
          <div class="ext-link-content">
            <span class="ext-link-label">${escapeHtml(item.label)}</span>
            <span class="ext-link-desc">${escapeHtml(item.desc)}</span>
          </div>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>`;
      }
    });

    el.innerHTML = html || '<p class="no-data">暫無資料</p>';
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function formatMarkdown(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n- /g, '</p><li>')
      .replace(/\n(\d+)\. /g, '</p><li>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>')
      .replace(/<p><\/p>/g, '');
  }

  function saveRecentSearch(query) {
    try {
      let recent = JSON.parse(localStorage.getItem('supereyes_recent') || '[]');
      recent = recent.filter(q => q !== query);
      recent.unshift(query);
      recent = recent.slice(0, 10);
      localStorage.setItem('supereyes_recent', JSON.stringify(recent));
    } catch (e) { /* ignore */ }
  }
})();
