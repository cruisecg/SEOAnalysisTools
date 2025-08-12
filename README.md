# OneStep SEO Inspector

一個全面的網站SEO分析工具，讓您只需輸入網址，即可快速獲得詳細的SEO分析報告和修正建議。

## 🚀 功能特色

- **全面檢測**: 涵蓋技術基礎、內容結構、結構化資料、效能指標和社群標記
- **快速分析**: 通常在30秒內完成分析
- **詳細報告**: 提供具體分數、等級評價和優先級建議
- **可分享報告**: 生成可分享的HTML報告連結
- **多種匯出**: 支援PDF和JSON格式匯出
- **繁體中文**: 完整的中文介面和專業術語
- **響應式設計**: 支援桌面和行動裝置

## 🏗️ 系統架構

本專案使用現代化的全端技術堆疊：

- **前端**: Next.js 14 (App Router) + Tailwind CSS
- **後端**: Next.js Route Handlers + TypeScript
- **資料庫**: SQLite (使用 better-sqlite3)
- **爬蟲**: Playwright (無頭瀏覽器)
- **分析引擎**: 自建SEO分析演算法
- **部署**: Docker + 可選的Nginx反向代理

## 📋 檢測項目

### 技術基礎 (30分)
- HTTP狀態碼 (5分)
- HTTPS使用 (5分)
- robots.txt檢測 (3分)
- sitemap.xml檢測 (3分)
- Canonical URL (4分)
- 可索引性檢查 (5分)

### 內容結構 (25分)
- Title標籤長度與品質 (5分)
- Meta Description (5分)
- H1標籤唯一性 (5分)
- 標題階層結構 (5分)
- 圖片Alt屬性覆蓋率 (5分)

### 結構化資料 (10分)
- JSON-LD存在性 (5分)
- Schema.org合規性 (5分)

### 效能與核心網頁生命力 (25分)
- 內容壓縮 (5分)
- 快取設定 (5分)
- 圖片最佳化 (5分)
- 延遲載入 (5分)
- 核心網頁生命力 (5分)

### 社群標記 (10分)
- Open Graph標籤 (6分)
- Twitter Cards (4分)

## 🚀 快速開始

### 使用Docker (推薦)

1. **複製專案**
```bash
git clone https://github.com/cruisecg/SEOAnalysisTools.git
cd SEOAnalysisTools
```

2. **使用Docker Compose啟動**
```bash
docker-compose up -d
```

3. **訪問應用**
開啟瀏覽器訪問 http://localhost:3000

### 本地開發

1. **環境要求**
- Node.js 18+
- npm 或 yarn

2. **安裝依賴**
```bash
npm install
```

3. **安裝Playwright瀏覽器**
```bash
npx playwright install chromium
```

4. **設定環境變數**
```bash
cp .env.local.example .env.local
# 編輯 .env.local 設定必要的環境變數
```

5. **啟動開發伺服器**
```bash
npm run dev
```

6. **建置生產版本**
```bash
npm run build
npm start
```

或使用提供的啟動腳本：
```bash
./scripts/start.sh
```

## 🔧 設定選項

### 環境變數

| 變數名稱 | 預設值 | 說明 |
|---------|--------|------|
| `DATABASE_PATH` | `./data/seo_analysis.db` | SQLite資料庫路徑 |
| `RENDER_TIMEOUT_MS` | `10000` | 頁面渲染超時時間(毫秒) |
| `MAX_ANALYSIS_SECONDS` | `60` | 單次分析最長時間(秒) |
| `MAX_HTML_MB` | `10` | HTML文件大小上限(MB) |
| `RATE_LIMIT_ANONYMOUS` | `5` | 未登入用戶每小時限制 |
| `RATE_LIMIT_AUTHENTICATED` | `20` | 登入用戶每小時限制 |

### Docker環境變數
所有環境變數都可以在 `docker-compose.yml` 中設定。

## 📊 API文檔

### 分析網址
```bash
POST /api/analyze
Content-Type: application/json

{
  "url": "https://example.com"
}
```

回應:
```json
{
  "success": true,
  "task_id": "uuid-task-id"
}
```

### 查詢結果
```bash
GET /api/result/{task_id}
```

### 查看報告
```bash
GET /api/report/{task_id}
```

### 系統健康檢查
```bash
GET /api/health
```

## 🧪 測試

```bash
# 執行單元測試
npm test

# 執行端到端測試
npm run test:e2e

# 測試覆蓋率
npm run test:coverage
```

## 📦 部署

### Docker部署 (推薦)

1. **建置映像**
```bash
docker build -t seo-inspector .
```

2. **執行容器**
```bash
docker run -p 3000:3000 -v ./data:/app/data seo-inspector
```

3. **使用Docker Compose (含Nginx)**
```bash
docker-compose --profile production up -d
```

### 手動部署

1. **建置應用**
```bash
npm run build
```

2. **設定生產環境變數**
3. **啟動應用**
```bash
npm start
```

## 🔒 安全性考量

- 遵守網站robots.txt規則
- 設定適當的User-Agent
- 實施速率限制防止濫用
- 不儲存敏感資訊
- 僅供學術和站長用途

## 🤝 貢獻

歡迎提交Issue和Pull Request來改善此專案。

## 📄 授權

本專案僅供學術和站長診斷用途使用。請遵守目標網站的服務條款和robots.txt規則。

## 🙏 致謝

感謝所有開源專案的貢獻，讓這個工具得以實現。

---

**免責聲明**: 本工具僅供網站站長進行自我診斷和學術研究使用，請勿用於大規模爬蟲或違反目標網站服務條款的行為。