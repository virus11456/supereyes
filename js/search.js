/**
 * SuperEyes Search Engine
 * - GCIS API for company registration data
 * - MiniMax AI for comprehensive search + analysis
 */

const SearchEngine = {
  /**
   * Fetch company data from GCIS Open Data API
   */
  async fetchCompanyData(query) {
    const results = [];

    try {
      const apiUrl = `https://data.gcis.nat.gov.tw/od/data/api/5F64D864-61CB-4D0D-8AD9-492047CC1EA3?$format=json&$filter=Company_Name like ${encodeURIComponent(query)}&$skip=0&$top=5`;
      const resp = await fetch(apiUrl);
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data)) {
          data.forEach(item => {
            results.push({
              name: item.Company_Name || '',
              taxId: item.Business_Accounting_NO || '',
              representative: item.Responsible_Name || '',
              capital: item.Capital_Stock_Amount ? Number(item.Capital_Stock_Amount).toLocaleString() + ' 元' : '',
              status: item.Company_Status_Desc || '',
              address: item.Company_Location || ''
            });
          });
        }
      }
    } catch (e) { /* ignore */ }

    // Also try business registration
    try {
      const bizUrl = `https://data.gcis.nat.gov.tw/od/data/api/7E6AFA72-AD6A-46D3-8681-ED77951D912D?$format=json&$filter=Business_Name like ${encodeURIComponent(query)}&$skip=0&$top=3`;
      const resp = await fetch(bizUrl);
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data)) {
          data.forEach(item => {
            results.push({
              name: item.Business_Name || '',
              taxId: item.Business_Accounting_NO || '',
              representative: item.Responsible_Name || '',
              capital: item.Capital_Stock_Amount ? Number(item.Capital_Stock_Amount).toLocaleString() + ' 元' : '',
              status: item.Business_Organization_Type_Desc || '',
              address: item.Business_Address || ''
            });
          });
        }
      }
    } catch (e) { /* ignore */ }

    return results;
  },

  /**
   * Use MiniMax AI to search and analyze
   */
  async aiSearch(query, type) {
    const apiKey = localStorage.getItem('supereyes_api_key');
    if (!apiKey) return null;

    const typeContext = {
      all: '公司與個人',
      company: '公司',
      person: '個人'
    };

    const userMessage = `請針對「${query}」（搜尋類型：${typeContext[type] || '全部'}）進行深度調查，搜尋並整理所有公開可得的資料。

請依照以下格式回覆，每個有找到資料的類別都要列出：

## 基本資料
簡要說明此${typeContext[type] || '對象'}的基本背景資訊。

## 公司登記 / 商業登記
如果是公司，列出公司名稱、統編、負責人、資本額、成立日期、營業項目等。如果是個人，列出其已知的公司關聯。

## 法院判決紀錄
列出與「${query}」相關的法院判決、訴訟紀錄。如有，說明案由、判決結果。如無公開紀錄，也請說明。

## 新聞報導
列出近期與「${query}」相關的重要新聞報導，包含新聞標題、媒體來源、大致時間和摘要。

## 社群媒體
列出在 Facebook、Instagram 等平台上與「${query}」相關的公開頁面或帳號資訊。

## 公開資料與政府紀錄
列出在政府公開資料平台、公開資訊觀測站、環境違規紀錄等的相關資料。

## 風險評估與交叉分析
根據以上所有資料進行交叉比對：
- 綜合風險評估（低/中/高）
- 不同來源之間的關聯性分析
- 值得注意的事項

## 建議進一步調查方向
列出使用者可以進一步深入調查的方向和建議。

**重要規則**：
- 用繁體中文回答
- 每個類別如果有找到資料就詳細列出，沒有就寫「目前未找到相關公開紀錄」
- 新聞報導請盡量列出具體的標題和來源
- 必須根據你所知的真實資訊回答，不確定的要標註「待確認」
- 格式要清楚，善用條列式`;

    try {
      // MiniMax China Coding Plan: anthropic path + OpenAI format
      const resp = await fetch('https://api.minimaxi.com/anthropic/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'MiniMax-M2.5',
          max_tokens: 2048,
          messages: [
            {
              role: 'system',
              content: '你是「SuperEyes 超級之眼」的核心 AI 調查引擎。你的工作是根據使用者輸入的公司名稱或個人姓名，盡可能全面地搜尋並整理所有公開可得的資料，包括公司登記、法院判決、新聞報導、社群媒體、政府公開資料等。你必須提供有根據的資訊，並在不確定時誠實標註。回答使用繁體中文。'
            },
            { role: 'user', content: userMessage }
          ]
        })
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        const errMsg = err.error?.message || err.message || `API 錯誤 ${resp.status}`;
        throw new Error(errMsg);
      }

      const data = await resp.json();
      // OpenAI format response
      return data.choices?.[0]?.message?.content || null;
    } catch (e) {
      console.error('AI search failed:', e);
      throw e;
    }
  },

  /**
   * Generate source links for the query
   */
  getSourceLinks(query) {
    return [
      { icon: '🏢', label: '經濟部商工登記', url: `https://findbiz.nat.gov.tw/fts/query/QueryBar/queryInit.do?fhl=zh_TW&queryStr=${encodeURIComponent(query)}` },
      { icon: '⚖️', label: 'Lawsnote 法學搜尋', url: `https://lawsnote.com/search?q=${encodeURIComponent(query)}` },
      { icon: '⚖️', label: '司法院裁判書', url: `https://judgment.judicial.gov.tw/FJUD/default.aspx` },
      { icon: '📰', label: 'Google 新聞', url: `https://news.google.com/search?q=${encodeURIComponent(query)}&hl=zh-TW&gl=TW` },
      { icon: '📋', label: '政府公開資料', url: `https://data.gov.tw/datasets/search?p=1&size=10&s=_score&rft=${encodeURIComponent(query)}` },
      { icon: '📋', label: '公開資訊觀測站', url: `https://mops.twse.com.tw/mops/web/t05st03` },
      { icon: '🌱', label: '透明足跡', url: `https://thaubing.gcaa.org.tw/search?query=${encodeURIComponent(query)}` },
      { icon: '📘', label: 'Facebook 搜尋', url: `https://www.facebook.com/search/top/?q=${encodeURIComponent(query)}` },
      { icon: '📷', label: 'Instagram 搜尋', url: `https://www.google.com/search?q=${encodeURIComponent(query + ' site:instagram.com')}` },
      { icon: '🔍', label: 'Google 搜尋', url: `https://www.google.com/search?q=${encodeURIComponent(query)}` },
    ];
  }
};
