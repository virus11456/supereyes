/**
 * Search engine module — generates search links for various public data sources.
 * Since most Taiwan government databases don't offer CORS-friendly APIs,
 * we generate direct search links that open in new tabs.
 */

const SearchEngine = {
  /**
   * Company registration data — 經濟部商工登記公示資料查詢
   */
  companyRegistration(query) {
    const gcisUrl = `https://findbiz.nat.gov.tw/fts/query/QueryBar/queryInit.do?fhl=zh_TW&queryStr=${encodeURIComponent(query)}`;
    const companyUrl = `https://www.twincn.com/item.aspx?no=${encodeURIComponent(query)}`;

    return {
      title: '公司登記資料',
      links: [
        {
          label: '經濟部商工登記查詢',
          url: gcisUrl,
          desc: '查詢公司基本資料、登記地址、資本額、負責人等'
        },
        {
          label: '台灣公司網',
          url: companyUrl,
          desc: '公司登記資料、董監事、分公司資訊'
        },
        {
          label: 'Google 搜尋公司資料',
          url: `https://www.google.com/search?q=${encodeURIComponent(query + ' 公司登記 資本額 負責人')}`,
          desc: '透過 Google 搜尋相關公司資訊'
        }
      ]
    };
  },

  /**
   * Court judgments — 司法院法學資料檢索
   */
  courtJudgments(query) {
    const judicialUrl = `https://judgment.judicial.gov.tw/FJUD/default.aspx`;
    const lawsnoteUrl = `https://lawsnote.com/search?q=${encodeURIComponent(query)}`;

    return {
      title: '法院判決',
      links: [
        {
          label: 'Lawsnote 法學搜尋',
          url: lawsnoteUrl,
          desc: '搜尋判決書全文、法規、函釋'
        },
        {
          label: '司法院裁判書查詢',
          url: judicialUrl,
          desc: '官方判決書查詢系統（需在站內輸入關鍵字）'
        },
        {
          label: 'Google 搜尋判決',
          url: `https://www.google.com/search?q=${encodeURIComponent(query + ' 判決 site:judicial.gov.tw OR site:lawsnote.com')}`,
          desc: '透過 Google 搜尋相關判決'
        }
      ]
    };
  },

  /**
   * News search — 新聞搜尋
   */
  news(query) {
    return {
      title: '相關新聞',
      links: [
        {
          label: 'Google 新聞',
          url: `https://news.google.com/search?q=${encodeURIComponent(query)}&hl=zh-TW&gl=TW`,
          desc: '最新相關新聞報導'
        },
        {
          label: 'Yahoo 新聞搜尋',
          url: `https://tw.news.yahoo.com/search?p=${encodeURIComponent(query)}`,
          desc: 'Yahoo 奇摩新聞搜尋'
        },
        {
          label: 'Google 搜尋新聞',
          url: `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=nws`,
          desc: 'Google 新聞搜尋結果'
        }
      ]
    };
  },

  /**
   * Public records — 公開資料
   */
  publicRecords(query) {
    return {
      title: '公開資料',
      links: [
        {
          label: '政府公開資料平台',
          url: `https://data.gov.tw/datasets/search?p=1&size=10&s=_score&rft=${encodeURIComponent(query)}`,
          desc: '政府開放資料搜尋'
        },
        {
          label: '公開資訊觀測站',
          url: `https://mops.twse.com.tw/mops/web/t05st03`,
          desc: '上市櫃公司公開資訊（需在站內查詢）'
        },
        {
          label: 'Google 搜尋公開資料',
          url: `https://www.google.com/search?q=${encodeURIComponent(query + ' 公開資料 OR 公告 OR 公示')}`,
          desc: '透過 Google 搜尋各種公開資料'
        },
        {
          label: '透明足跡',
          url: `https://thaubing.gcaa.org.tw/search?query=${encodeURIComponent(query)}`,
          desc: '企業環境違規紀錄查詢'
        }
      ]
    };
  },

  /**
   * Facebook search
   */
  facebook(query) {
    return {
      title: 'Facebook',
      links: [
        {
          label: 'Facebook 搜尋',
          url: `https://www.facebook.com/search/top/?q=${encodeURIComponent(query)}`,
          desc: '在 Facebook 搜尋相關粉專、社團、貼文'
        },
        {
          label: 'Google 搜尋 Facebook',
          url: `https://www.google.com/search?q=${encodeURIComponent(query + ' site:facebook.com')}`,
          desc: '透過 Google 搜尋 Facebook 頁面'
        }
      ]
    };
  },

  /**
   * Instagram search
   */
  instagram(query) {
    return {
      title: 'Instagram',
      links: [
        {
          label: 'Instagram 搜尋',
          url: `https://www.instagram.com/explore/tags/${encodeURIComponent(query.replace(/\s+/g, ''))}/`,
          desc: '搜尋相關 Instagram 標籤'
        },
        {
          label: 'Google 搜尋 Instagram',
          url: `https://www.google.com/search?q=${encodeURIComponent(query + ' site:instagram.com')}`,
          desc: '透過 Google 搜尋 Instagram 帳號'
        }
      ]
    };
  },

  /**
   * Run all searches and return results
   */
  searchAll(query, type) {
    const results = {};

    if (type === 'all' || type === 'company') {
      results.company = this.companyRegistration(query);
    }

    results.court = this.courtJudgments(query);
    results.news = this.news(query);
    results.public = this.publicRecords(query);

    if (type === 'all' || type === 'person') {
      results.fb = this.facebook(query);
      results.ig = this.instagram(query);
    }

    // For company-only mode, still show social but with company context
    if (type === 'company') {
      results.fb = this.facebook(query);
      results.ig = this.instagram(query);
    }

    return results;
  }
};
