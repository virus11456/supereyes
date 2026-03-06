# 👁️ SuperEyes 超級之眼

搜尋公司或個人名稱，一鍵查找背後所有公開資料。

## 功能

### 🔍 搜尋模式
- **全部** — 同時搜尋公司與個人相關資料
- **公司** — 針對公司登記、商業資訊搜尋
- **個人** — 針對個人社群、公開紀錄搜尋

### 📊 六大資料來源

| 類別 | 來源 | 說明 |
|------|------|------|
| 🏢 公司登記 | 經濟部商工登記、台灣公司網 | 公司基本資料、資本額、負責人、董監事 |
| ⚖️ 法院判決 | Lawsnote、司法院裁判書查詢 | 判決書全文、法規、函釋 |
| 📰 新聞 | Google News、Yahoo 新聞 | 最新相關新聞報導 |
| 📋 公開資料 | 政府開放資料平台、公開資訊觀測站、透明足跡 | 政府公告、上市櫃資訊、環境違規紀錄 |
| 📘 Facebook | Facebook 搜尋、Google site search | 粉專、社團、貼文 |
| 📷 Instagram | Instagram 標籤、Google site search | IG 帳號、相關標籤 |

### 📱 PWA 支援
- 可安裝到手機桌面，如同原生 App
- Service Worker 離線快取
- 深色主題響應式設計，支援手機與桌面

## 部署

### GitHub Pages（推薦）
1. 到 repo **Settings** → **Pages**
2. Source 選擇 **GitHub Actions**
3. 儲存後自動部署

網站網址：`https://<username>.github.io/supereyes/`

### 本地開發
```bash
npx serve .
```
開啟 `http://localhost:3000`

## 技術架構
- 純 HTML / CSS / JavaScript（無框架依賴）
- PWA：Web App Manifest + Service Worker
- 響應式設計，支援 RWD
- 深色主題 UI

## 授權
所有搜尋結果皆來自公開來源。
