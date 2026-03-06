/**
 * SuperEyes — Main application logic
 */
(function () {
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const loading = document.getElementById('loading');
  const results = document.getElementById('results');
  const emptyState = document.getElementById('emptyState');
  const resultQuery = document.getElementById('resultQuery');
  const typeBtns = document.querySelectorAll('.type-btn');
  const suggestionTags = document.querySelectorAll('.suggestion-tag');

  let currentType = 'all';

  // Type toggle
  typeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      typeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentType = btn.dataset.type;
    });
  });

  // Suggestion tags
  suggestionTags.forEach(tag => {
    tag.addEventListener('click', () => {
      searchInput.value = tag.dataset.query;
      performSearch();
    });
  });

  // Search triggers
  searchBtn.addEventListener('click', performSearch);
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') performSearch();
  });

  function performSearch() {
    const query = searchInput.value.trim();
    if (!query) {
      searchInput.focus();
      return;
    }

    // Save to recent searches
    saveRecentSearch(query);

    // Show loading
    emptyState.classList.add('hidden');
    results.classList.add('hidden');
    loading.classList.remove('hidden');

    // Simulate a brief loading state for UX
    setTimeout(() => {
      const searchResults = SearchEngine.searchAll(query, currentType);
      renderResults(query, searchResults);
      loading.classList.add('hidden');
      results.classList.remove('hidden');
    }, 400);
  }

  function renderResults(query, data) {
    resultQuery.textContent = query;

    // Render each category
    renderCard('result-company', data.company);
    renderCard('result-court', data.court);
    renderCard('result-news', data.news);
    renderCard('result-public', data.public);
    renderCard('result-fb', data.fb);
    renderCard('result-ig', data.ig);

    // Show/hide cards based on available data
    document.getElementById('card-company').classList.toggle('hidden', !data.company);
    document.getElementById('card-court').classList.toggle('hidden', !data.court);
    document.getElementById('card-news').classList.toggle('hidden', !data.news);
    document.getElementById('card-public').classList.toggle('hidden', !data.public);
    document.getElementById('card-fb').classList.toggle('hidden', !data.fb);
    document.getElementById('card-ig').classList.toggle('hidden', !data.ig);
  }

  function renderCard(elementId, data) {
    const el = document.getElementById(elementId);
    if (!el || !data) return;

    const linksHtml = data.links.map(link => `
      <li class="link-item">
        <div>
          <a href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer">
            ${escapeHtml(link.label)}
          </a>
          <div class="link-desc">${escapeHtml(link.desc)}</div>
        </div>
      </li>
    `).join('');

    el.innerHTML = `<ul class="link-list">${linksHtml}</ul>`;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Recent searches (localStorage)
  function saveRecentSearch(query) {
    try {
      let recent = JSON.parse(localStorage.getItem('supereyes_recent') || '[]');
      recent = recent.filter(q => q !== query);
      recent.unshift(query);
      recent = recent.slice(0, 10);
      localStorage.setItem('supereyes_recent', JSON.stringify(recent));
    } catch (e) {
      // localStorage not available
    }
  }
})();
