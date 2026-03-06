/**
 * SuperEyes Search Engine — Fetches real results from public APIs
 */
const SearchEngine = {

  /**
   * Company registration — 經濟部商工登記公示資料 Open Data API
   */
  async companyRegistration(query) {
    const results = [];

    // Try GCIS open data API for company search
    try {
      const apiUrl = `https://data.gcis.nat.gov.tw/od/data/api/5F64D864-61CB-4D0D-8AD9-492047CC1EA3?$format=json&$filter=Company_Name like ${encodeURIComponent(query)}&$skip=0&$top=5`;
      const resp = await fetch(apiUrl);
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data) && data.length > 0) {
          data.forEach(item => {
            results.push({
              type: 'data',
              title: item.Company_Name || query,
              details: [
                { label: '統一編號', value: item.Business_Accounting_NO || '—' },
                { label: '負責人', value: item.Responsible_Name || '—' },
                { label: '資本額', value: item.Capital_Stock_Amount ? Number(item.Capital_Stock_Amount).toLocaleString() + ' 元' : '—' },
                { label: '公司狀態', value: item.Company_Status_Desc || '—' },
                { label: '登記地址', value: item.Company_Location || '—' },
              ]
            });
          });
        }
      }
    } catch (e) {
      // API failed, fall through to links
    }

    // Also try business (商業) registration
    try {
      const bizUrl = `https://data.gcis.nat.gov.tw/od/data/api/7E6AFA72-AD6A-46D3-8681-ED77951D912D?$format=json&$filter=Business_Name like ${encodeURIComponent(query)}&$skip=0&$top=5`;
      const resp = await fetch(bizUrl);
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data) && data.length > 0) {
          data.forEach(item => {
            results.push({
              type: 'data',
              title: item.Business_Name || query,
              details: [
                { label: '統一編號', value: item.Business_Accounting_NO || '—' },
                { label: '負責人', value: item.Responsible_Name || '—' },
                { label: '資本額', value: item.Capital_Stock_Amount ? Number(item.Capital_Stock_Amount).toLocaleString() + ' 元' : '—' },
                { label: '組織類型', value: item.Business_Organization_Type_Desc || '—' },
                { label: '登記地址', value: item.Business_Address || '—' },
              ]
            });
          });
        }
      }
    } catch (e) {
      // ignore
    }

    // Always add direct search links
    results.push({
      type: 'link',
      label: '經濟部商工登記查詢',
      url: `https://findbiz.nat.gov.tw/fts/query/QueryBar/queryInit.do?fhl=zh_TW&queryStr=${encodeURIComponent(query)}`,
      desc: '前往官方網站查詢完整資料'
    });

    return {
      title: '公司登記資料',
      results,
      count: results.filter(r => r.type === 'data').length
    };
  },

  /**
   * Court judgments — Search via multiple sources
   */
  async courtJudgments(query) {
    const results = [];

    results.push({
      type: 'link',
      label: 'Lawsnote 法學搜尋',
      url: `https://lawsnote.com/search?q=${encodeURIComponent(query)}`,
      desc: '搜尋判決書全文、法規、函釋'
    });
    results.push({
      type: 'link',
      label: '司法院裁判書查詢',
      url: `https://judgment.judicial.gov.tw/FJUD/default.aspx`,
      desc: '官方判決書查詢系統'
    });
    results.push({
      type: 'link',
      label: 'Google 搜尋判決',
      url: `https://www.google.com/search?q=${encodeURIComponent(query + ' 判決書')}`,
      desc: '搜尋相關法院判決'
    });

    return { title: '法院判決', results, count: 0 };
  },

  /**
   * News — Fetch from Google News RSS
   */
  async news(query) {
    const results = [];

    // Try Google News RSS via a CORS-friendly approach
    try {
      const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=zh-TW&gl=TW&ceid=TW:zh-Hant`;
      const resp = await fetch(rssUrl);
      if (resp.ok) {
        const text = await resp.text();
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, 'text/xml');
        const items = xml.querySelectorAll('item');

        items.forEach((item, i) => {
          if (i >= 8) return;
          const title = item.querySelector('title')?.textContent || '';
          const link = item.querySelector('link')?.textContent || '';
          const pubDate = item.querySelector('pubDate')?.textContent || '';
          const source = item.querySelector('source')?.textContent || '';

          if (title && link) {
            results.push({
              type: 'news',
              title: title,
              url: link,
              source: source,
              date: pubDate ? formatDate(pubDate) : ''
            });
          }
        });
      }
    } catch (e) {
      // RSS fetch failed
    }

    // Fallback links
    results.push({
      type: 'link',
      label: 'Google 新聞',
      url: `https://news.google.com/search?q=${encodeURIComponent(query)}&hl=zh-TW&gl=TW`,
      desc: '查看更多新聞'
    });

    return {
      title: '相關新聞',
      results,
      count: results.filter(r => r.type === 'news').length
    };
  },

  /**
   * Public records — Government open data
   */
  async publicRecords(query) {
    const results = [];

    results.push({
      type: 'link',
      label: '政府公開資料平台',
      url: `https://data.gov.tw/datasets/search?p=1&size=10&s=_score&rft=${encodeURIComponent(query)}`,
      desc: '政府開放資料搜尋'
    });
    results.push({
      type: 'link',
      label: '公開資訊觀測站',
      url: `https://mops.twse.com.tw/mops/web/t05st03`,
      desc: '上市櫃公司公開資訊'
    });
    results.push({
      type: 'link',
      label: '透明足跡',
      url: `https://thaubing.gcaa.org.tw/search?query=${encodeURIComponent(query)}`,
      desc: '企業環境違規紀錄'
    });
    results.push({
      type: 'link',
      label: 'Google 搜尋公開資料',
      url: `https://www.google.com/search?q=${encodeURIComponent(query + ' 公開資料 公告')}`,
      desc: '搜尋各類公開資料'
    });

    return { title: '公開資料', results, count: 0 };
  },

  /**
   * Facebook
   */
  async facebook(query) {
    const results = [];

    results.push({
      type: 'link',
      label: 'Facebook 搜尋',
      url: `https://www.facebook.com/search/top/?q=${encodeURIComponent(query)}`,
      desc: '搜尋粉專、社團、貼文'
    });
    results.push({
      type: 'link',
      label: 'Google 搜尋 Facebook',
      url: `https://www.google.com/search?q=${encodeURIComponent(query + ' site:facebook.com')}`,
      desc: '透過 Google 搜尋 FB 頁面'
    });

    return { title: 'Facebook', results, count: 0 };
  },

  /**
   * Instagram
   */
  async instagram(query) {
    const results = [];

    results.push({
      type: 'link',
      label: 'Google 搜尋 Instagram',
      url: `https://www.google.com/search?q=${encodeURIComponent(query + ' site:instagram.com')}`,
      desc: '搜尋 IG 帳號與貼文'
    });
    results.push({
      type: 'link',
      label: 'Instagram 標籤',
      url: `https://www.instagram.com/explore/tags/${encodeURIComponent(query.replace(/\s+/g, ''))}/`,
      desc: '搜尋相關標籤'
    });

    return { title: 'Instagram', results, count: 0 };
  },

  /**
   * Run all searches in parallel
   */
  async searchAll(query, type, onProgress) {
    const tasks = [];
    const categories = [];

    if (type === 'all' || type === 'company') {
      tasks.push(this.companyRegistration(query));
      categories.push('company');
    }

    tasks.push(this.courtJudgments(query));
    categories.push('court');
    tasks.push(this.news(query));
    categories.push('news');
    tasks.push(this.publicRecords(query));
    categories.push('public');

    tasks.push(this.facebook(query));
    categories.push('fb');
    tasks.push(this.instagram(query));
    categories.push('ig');

    const results = {};
    let completed = 0;

    const settled = await Promise.allSettled(tasks);
    settled.forEach((result, i) => {
      completed++;
      if (result.status === 'fulfilled') {
        results[categories[i]] = result.value;
      } else {
        results[categories[i]] = { title: '', results: [], count: 0, error: true };
      }
      if (onProgress) onProgress(completed, tasks.length, categories[i]);
    });

    return results;
  }
};

/**
 * AI Analysis — uses MiniMax API (OpenAI-compatible) for cross-referencing
 */
const AIAnalyzer = {
  async analyze(query, searchResults) {
    const apiKey = localStorage.getItem('supereyes_api_key');
    if (!apiKey) return null;

    // Build context from search results
    let context = `搜尋目標：${query}\n\n`;

    if (searchResults.company?.results) {
      context += '【公司登記資料】\n';
      searchResults.company.results.forEach(r => {
        if (r.type === 'data') {
          context += `${r.title}\n`;
          r.details.forEach(d => { context += `  ${d.label}：${d.value}\n`; });
        }
      });
      context += '\n';
    }

    if (searchResults.news?.results) {
      context += '【相關新聞】\n';
      searchResults.news.results.forEach(r => {
        if (r.type === 'news') {
          context += `- ${r.title} (${r.source}, ${r.date})\n`;
        }
      });
      context += '\n';
    }

    const userMessage = `你是一個專業的調查分析師。根據以下搜尋到的公開資料，請對「${query}」進行交叉比對分析。

${context}

請提供：
1. **基本資料摘要**：根據搜到的資料總結此公司/個人的基本資訊
2. **風險評估**：基於法院判決、新聞等資料，評估可能的風險（如有）
3. **關聯分析**：分析不同資料來源之間的關聯性
4. **建議**：建議使用者可以進一步調查的方向

請用繁體中文回答，格式清楚，如果資料不足請誠實說明。`;

    try {
      const resp = await fetch('https://api.minimaxi.chat/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'MiniMax-Text-01',
          max_tokens: 2000,
          messages: [
            { role: 'system', content: '你是一個專業的台灣公開資料調查分析師，擅長交叉比對不同來源的資料，找出關聯性和潛在風險。' },
            { role: 'user', content: userMessage }
          ]
        })
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error?.message || `API error ${resp.status}`);
      }

      const data = await resp.json();
      return data.choices?.[0]?.message?.content || null;
    } catch (e) {
      console.error('AI analysis failed:', e);
      return `分析失敗：${e.message}`;
    }
  }
};

// Utility
function formatDate(dateStr) {
  try {
    const d = new Date(dateStr);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
  } catch {
    return dateStr;
  }
}
