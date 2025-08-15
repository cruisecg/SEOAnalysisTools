# 空間便利店 SEO Inspector

專門針對場地租借網站的 SEO 快速健檢工具，幫助您的場地更容易被找到、吸引更多活動主辦方與租客上門。

## 🚀 功能特色

- **全面檢測**: 技術基礎、內容結構、結構化資料、效能指標和社群標記
- **快速分析**: 30秒內完成分析，提供 A-E 等級評價
- **可分享報告**: HTML/PDF 報告連結，完整中文介面
- **自動化 SSL**: 免費 SSL 證書自動申請、更新和監控

## 🏗️ 技術架構

- **前端**: Next.js 14 + Tailwind CSS
- **後端**: TypeScript + SQLite + Playwright
- **部署**: Docker + Nginx 反向代理
- **監控**: SSL 自動續期 + 24/7 健康檢查

## 🚀 快速開始

### Docker 部署 (推薦)

```bash
# 克隆專案
git clone https://github.com/cruisecg/SEOAnalysisTools.git
cd SEOAnalysisTools

# 啟動服務 (包含 nginx 在 80/443 端口)
docker compose --profile production up -d

# 訪問應用
# 開發: http://localhost
# 生產: https://seo.onestep.place
```

### 本地開發

```bash
# 安裝依賴
npm install
npx playwright install chromium

# 啟動開發服務
npm run dev
# 訪問 http://localhost:3000
```

## 🔐 SSL 自動化設定

### 生產環境 (3 步驟)

```bash
# 1. 設定域名和郵箱
nano scripts/ssl-init.sh  # 修改 DOMAIN 和 EMAIL

# 2. 一鍵初始化 SSL
./scripts/ssl-init.sh

# 3. 設定自動更新 (每週檢查)
sudo ./scripts/setup-ssl-cron.sh
```

### 開發環境

```bash
# 生成自簽名證書
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/key.pem -out ssl/cert.pem \
  -subj "/C=TW/ST=Taiwan/L=Taipei/O=SEO Inspector/CN=localhost"

# 重啟服務
docker compose --profile production restart
```

### SSL 監控與管理

```bash
# 查看 SSL 狀態
./scripts/ssl-status.sh

# 啟動 SSL 監控服務
docker compose -f docker-compose.ssl.yml --profile ssl up -d

# 查看監控日誌
tail -f logs/ssl-monitor.log
```

## 📋 SEO 檢測項目

| 類別 | 項目 | 分數 |
|------|------|------|
| **技術基礎** (30分) | HTTPS、robots.txt、sitemap、canonical URL | 
| **內容結構** (25分) | Title、Meta Description、H1、標題階層、圖片 Alt |
| **結構化資料** (10分) | JSON-LD、Schema.org 合規性 |
| **效能優化** (25分) | 壓縮、快取、圖片優化、延遲載入、CWV |
| **社群標記** (10分) | Open Graph、Twitter Cards |

## 📊 API 接口

```bash
# 分析網站
POST /api/analyze
{"url": "https://example.com"}

# 查詢結果
GET /api/result/{task_id}

# 查看報告
GET /api/report/{task_id}

# 健康檢查
GET /api/health
```

## ⚙️ 環境變數

| 變數 | 預設值 | 說明 |
|------|--------|------|
| `DATABASE_PATH` | `./data/seo_analysis.db` | 資料庫路徑 |
| `RENDER_TIMEOUT_MS` | `10000` | 頁面渲染超時 |
| `RATE_LIMIT_ANONYMOUS` | `5` | 每小時分析限制 |

## 🔧 管理命令

| 命令 | 說明 |
|------|------|
| `npm test` | 執行測試 |
| `./scripts/ssl-status.sh` | SSL 證書狀態 |
| `./scripts/ssl-renew.sh` | 手動更新證書 |
| `docker compose ps` | 查看容器狀態 |

## 🔒 安全性考量

- 遵守 robots.txt 規則和網站服務條款
- 實施速率限制防止濫用
- 不儲存敏感資訊，僅供學術和站長診斷用途

## 🤝 貢獻與授權

歡迎提交 Issue 和 Pull Request。本專案僅供學術和站長診斷用途使用。

---

**免責聲明**: 請勿用於大規模爬蟲或違反目標網站服務條款的行為。