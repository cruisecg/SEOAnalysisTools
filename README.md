# 空間便利店 SEO Inspector

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
docker compose --profile production up -d
```

應用將在以下端口可用：
- **HTTP**: http://localhost (端口 80)
- **HTTPS**: https://localhost (端口 443，需要SSL證書)

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

## 🔐 SSL/HTTPS 設定

### 🚀 自動化 SSL 設定 (推薦)

本項目提供完全自動化的 SSL 證書管理系統，包含自動申請、更新和監控。

#### 1. **一鍵初始化 SSL**
```bash
# 編輯腳本中的域名和郵箱
nano scripts/ssl-init.sh  # 修改 DOMAIN 和 EMAIL

# 執行自動 SSL 設定
./scripts/ssl-init.sh
```

#### 2. **設定自動更新**
```bash
# 安裝自動更新 cron 任務
sudo ./scripts/setup-ssl-cron.sh
```

#### 3. **驗證自動化系統**
```bash
# 檢查 SSL 證書狀態
openssl x509 -enddate -noout -in ssl/cert.pem

# 查看更新日誌
tail -f logs/ssl-renewal.log

# 手動測試更新腳本
sudo ./scripts/ssl-renew.sh
```

### 🔄 自動更新特性

- ✅ **智能檢測**: 證書到期前 30 天自動更新
- ✅ **零停機**: 自動停止/啟動容器進行更新
- ✅ **日誌記錄**: 完整的更新日誌和錯誤追蹤
- ✅ **健康監控**: 24 小時證書狀態監控
- ✅ **郵件通知**: 更新成功/失敗自動通知 (可選)
- ✅ **自動重試**: 失敗時自動重試機制

### 📊 SSL 監控面板

使用 Docker Compose 啟動 SSL 監控服務：

```bash
# 啟動 SSL 監控服務
docker compose -f docker-compose.ssl.yml --profile ssl up -d

# 查看證書監控日誌
tail -f logs/ssl-monitor.log
```

### 🛠️ 手動 SSL 設定 (進階用戶)

如果需要手動設定，請按照以下步驟：

1. **安裝 Certbot**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install certbot

# macOS
brew install certbot
```

2. **獲取 SSL 證書**
```bash
# 替換為你的域名
sudo certbot certonly --standalone -d seo.onestep.place
```

3. **複製證書到專案目錄**
```bash
# 創建 ssl 目錄
mkdir -p ssl

# 複製證書文件 (需要 sudo 權限)
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ssl/key.pem

# 設定權限
sudo chown $USER:$USER ssl/*.pem
chmod 600 ssl/*.pem
```

4. **啟用 HTTPS 配置**

編輯 `nginx.conf`，取消註解 HTTPS 部分：

```nginx
# 取消註解以下配置並修改域名
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    # SSL 安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # 複製 HTTP 服務器的所有 location 區塊
    # ... (與 HTTP 配置相同)
}

# HTTP 自動重定向到 HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

5. **重新啟動服務**
```bash
docker compose --profile production down
docker compose --profile production up -d
```

### 使用自簽名證書 (開發環境)

1. **生成自簽名證書**
```bash
# 創建 ssl 目錄
mkdir -p ssl

# 生成私鑰和證書
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/key.pem \
  -out ssl/cert.pem \
  -subj "/C=TW/ST=Taiwan/L=Taipei/O=SEO Inspector/CN=localhost"
```

2. **啟用 HTTPS 配置** (同上步驟 4)

3. **訪問應用**
- 瀏覽器會顯示安全警告，點擊「繼續前往」即可
- 訪問：https://localhost

### 證書自動更新

設定 cron 任務自動更新 Let's Encrypt 證書：

```bash
# 編輯 crontab
sudo crontab -e

# 添加以下行（每月1號凌晨2點檢查更新）
0 2 1 * * certbot renew --quiet && docker compose --profile production restart nginx
```

### SSL 配置驗證

1. **檢查證書有效性**
```bash
openssl x509 -in ssl/cert.pem -text -noout
```

2. **測試 SSL 配置**
```bash
# 使用 SSL Labs 測試 (線上工具)
# https://www.ssllabs.com/ssltest/

# 或使用命令行測試
openssl s_client -connect localhost:443 -servername localhost
```

3. **檢查 HTTPS 重定向**
```bash
curl -I http://localhost
# 應該返回 301 重定向到 https://
```

### 📊 SSL 狀態面板

使用內建的 SSL 狀態檢查工具：

```bash
# 查看完整 SSL 狀態報告
./scripts/ssl-status.sh
```

### 🚀 快速 SSL 設定指南

**生產環境完整設定 (3 步驟)**:

```bash
# 1. 編輯域名和郵箱
nano scripts/ssl-init.sh

# 2. 一鍵初始化 SSL
./scripts/ssl-init.sh

# 3. 設定自動更新
sudo ./scripts/setup-ssl-cron.sh
```

**開發環境快速設定**:

```bash
# 生成自簽名證書
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/key.pem -out ssl/cert.pem \
  -subj "/C=TW/ST=Taiwan/L=Taipei/O=SEO Inspector/CN=localhost"

# 重啟服務
docker compose --profile production restart
```

### 🔧 SSL 管理命令總覽

| 命令 | 說明 |
|------|------|
| `./scripts/ssl-status.sh` | 查看 SSL 證書狀態 |
| `./scripts/ssl-init.sh` | 初始化 SSL 證書 |
| `sudo ./scripts/ssl-renew.sh` | 手動更新證書 |
| `sudo ./scripts/setup-ssl-cron.sh` | 設定自動更新 |
| `tail -f logs/ssl-renewal.log` | 查看更新日誌 |
| `docker compose -f docker-compose.ssl.yml --profile ssl up -d` | 啟動 SSL 監控 |

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