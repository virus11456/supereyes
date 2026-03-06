/**
 * SuperEyes — Main application
 */
(function () {
  const $ = id => document.getElementById(id);
  const searchInput = $('searchInput');
  const searchBtn = $('searchBtn');
  const loading = $('loading');
  const loadingText = $('loadingText');
  const progressBar = $('progressBar');
  const results = $('results');
  const emptyState = $('emptyState');
  const resultQuery = $('resultQuery');
  const companySection = $('companySection');
  const companyData = $('companyData');
  const aiResults = $('aiResults');
  const sourcesSection = $('sourcesSection');
  const sourceLinks = $('sourceLinks');
  const apiNotice = $('apiNotice');

  const settingsBtn = $('settingsBtn');
  const settingsModal = $('settingsModal');
  const apiKeyInput = $('apiKeyInput');
  const proxyUrlInput = $('proxyUrlInput');
  const saveSettingsBtn = $('saveSettingsBtn');
  const closeSettingsBtn = $('closeSettingsBtn');
  const apiNoticeBtn = $('apiNoticeBtn');

  const typeBtns = document.querySelectorAll('.type-btn');
  const suggestionTags = document.querySelectorAll('.suggestion-tag');
  let currentType = 'all';

  // === Settings ===
  settingsBtn.addEventListener('click', openSettings);
  apiNoticeBtn.addEventListener('click', openSettings);
  closeSettingsBtn.addEventListener('click', closeSettings);
  settingsModal.querySelector('.modal-backdrop').addEventListener('click', closeSettings);
  saveSettingsBtn.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    if (key) localStorage.setItem('supereyes_api_key', key);
    else localStorage.removeItem('supereyes_api_key');
    const proxy = proxyUrlInput.value.trim().replace(/\/+$/, '');
    if (proxy) localStorage.setItem('supereyes_proxy_url', proxy);
    else localStorage.removeItem('supereyes_proxy_url');
    closeSettings();
  });

  function openSettings() {
    apiKeyInput.value = localStorage.getItem('supereyes_api_key') || '';
    proxyUrlInput.value = localStorage.getItem('supereyes_proxy_url') || '';
    settingsModal.classList.remove('hidden');
    apiKeyInput.focus();
  }
  function closeSettings() { settingsModal.classList.add('hidden'); }

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
  searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') performSearch(); });

  async function performSearch() {
    const query = searchInput.value.trim();
    if (!query) { searchInput.focus(); return; }

    const apiKey = localStorage.getItem('supereyes_api_key');
    apiNotice.classList.add('hidden');

    // Show loading
    emptyState.classList.add('hidden');
    results.classList.add('hidden');
    loading.classList.remove('hidden');
    searchBtn.disabled = true;

    // Animate progress
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += Math.random() * 10;
      if (progress > 90) progress = 90;
      progressBar.style.width = progress + '%';
    }, 300);

    const hasAI = !!apiKey;
    loadingText.textContent = hasAI ? '搜尋公司登記資料...' : '搜尋公司登記資料...';

    const steps = hasAI ? [
      '搜尋公司登記資料...',
      'AI 正在搜尋法院判決、新聞報導...',
      'AI 正在分析社群媒體資料...',
      'AI 正在進行交叉比對分析...'
    ] : ['搜尋公司登記資料...'];
    let stepIdx = 0;
    const stepInterval = setInterval(() => {
      stepIdx++;
      if (stepIdx < steps.length) loadingText.textContent = steps[stepIdx];
    }, 2000);

    try {
      // Always fetch company data; only run AI if key exists
      const tasks = [SearchEngine.fetchCompanyData(query)];
      if (hasAI) tasks.push(SearchEngine.aiSearch(query, currentType));

      const settled = await Promise.allSettled(tasks);

      clearInterval(progressInterval);
      clearInterval(stepInterval);
      progressBar.style.width = '100%';

      const companyResults = settled[0].status === 'fulfilled' ? settled[0].value : [];
      let aiContent = null;
      let aiError = null;

      if (hasAI && settled[1]) {
        if (settled[1].status === 'fulfilled') {
          aiContent = settled[1].value;
        } else {
          aiError = settled[1].reason?.message || 'AI 分析失敗';
        }
      }

      renderResults(query, companyResults, aiContent, aiError, hasAI);

      loading.classList.add('hidden');
      results.classList.remove('hidden');
    } catch (err) {
      clearInterval(progressInterval);
      clearInterval(stepInterval);
      loading.classList.add('hidden');
      results.classList.remove('hidden');
      resultQuery.textContent = query;
      companySection.classList.add('hidden');
      aiResults.innerHTML = `<div class="error-msg">
        <p>搜尋失敗：${escapeHtml(err.message)}</p>
      </div>`;
      renderSourceLinks(query);
    } finally {
      searchBtn.disabled = false;
    }
  }

  function renderResults(query, companyResults, aiContent, aiError, hasAI) {
    resultQuery.textContent = query;

    // Company data
    if (companyResults && companyResults.length > 0) {
      companySection.classList.remove('hidden');
      companyData.innerHTML = companyResults.map(c => `
        <div class="company-card">
          <div class="company-name">${escapeHtml(c.name)}</div>
          <div class="company-details">
            ${c.taxId ? `<div class="detail-row"><span class="detail-label">統一編號</span><span>${escapeHtml(c.taxId)}</span></div>` : ''}
            ${c.representative ? `<div class="detail-row"><span class="detail-label">負責人</span><span>${escapeHtml(c.representative)}</span></div>` : ''}
            ${c.capital ? `<div class="detail-row"><span class="detail-label">資本額</span><span>${escapeHtml(c.capital)}</span></div>` : ''}
            ${c.status ? `<div class="detail-row"><span class="detail-label">狀態</span><span>${escapeHtml(c.status)}</span></div>` : ''}
            ${c.address ? `<div class="detail-row"><span class="detail-label">地址</span><span>${escapeHtml(c.address)}</span></div>` : ''}
          </div>
        </div>
      `).join('');
    } else {
      companySection.classList.add('hidden');
    }

    // AI results
    if (aiContent) {
      document.querySelector('.ai-results-section').classList.remove('hidden');
      aiResults.innerHTML = renderMarkdown(aiContent);
    } else if (aiError) {
      document.querySelector('.ai-results-section').classList.remove('hidden');
      aiResults.innerHTML = `<div class="error-msg">
        <p>AI 分析失敗：${escapeHtml(aiError)}</p>
        <p>請確認 API Key 是否正確，或稍後再試。</p>
      </div>`;
    } else if (!hasAI) {
      document.querySelector('.ai-results-section').classList.remove('hidden');
      aiResults.innerHTML = `<div class="ai-notice">
        <p>設定 MiniMax API Key 可啟用 AI 深度分析（法院判決、新聞、社群媒體、風險評估等）</p>
        <button class="btn-small" onclick="document.getElementById('settingsBtn').click()">設定 API Key</button>
      </div>`;
    } else {
      document.querySelector('.ai-results-section').classList.remove('hidden');
      aiResults.innerHTML = '<p class="no-data">AI 未返回結果</p>';
    }

    // Source links
    renderSourceLinks(query);
  }

  function renderSourceLinks(query) {
    const links = SearchEngine.getSourceLinks(query);
    sourcesSection.classList.remove('hidden');
    sourceLinks.innerHTML = links.map(link => `
      <a href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer" class="source-link">
        <span class="source-icon">${link.icon}</span>
        <span class="source-label">${escapeHtml(link.label)}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
        </svg>
      </a>
    `).join('');
  }

  function renderMarkdown(text) {
    // Convert markdown to HTML
    let html = escapeHtml(text);

    // Headers
    html = html.replace(/^## (.+)$/gm, '<h3 class="md-h2">$1</h3>');
    html = html.replace(/^### (.+)$/gm, '<h4 class="md-h3">$1</h4>');

    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // List items
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/^(\d+)\. (.+)$/gm, '<li><span class="list-num">$1.</span> $2</li>');

    // Wrap consecutive <li> in <ul>
    html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul class="md-list">$1</ul>');

    // Paragraphs - wrap non-tag lines
    html = html.split('\n').map(line => {
      line = line.trim();
      if (!line) return '';
      if (line.startsWith('<h') || line.startsWith('<ul') || line.startsWith('<li') || line.startsWith('</')) return line;
      return `<p>${line}</p>`;
    }).join('\n');

    // Clean up
    html = html.replace(/<p><\/p>/g, '');

    return `<div class="md-content">${html}</div>`;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
})();
