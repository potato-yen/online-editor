# Latex Compile Backend

這是一個基於 Node.js (Express) 的後端服務，主要提供 LaTeX 編譯功能與使用者帳號管理（需高權限操作）。

## 功能

1.  **LaTeX 編譯 (`POST /compile-latex`)**
    - 接收 LaTeX 原始碼，呼叫系統上的 LaTeX 引擎 (預設為 `tectonic`) 進行編譯。
    - 回傳編譯後的 PDF (Base64) 或錯誤日誌 (包含解析後的錯誤行號)。
    - 每個請求會在獨立的暫存資料夾中執行，編譯完成後自動清理。

2.  **帳號刪除 (`POST /delete-account`)**
    - 透過 Supabase Admin API 刪除使用者帳號。
    - **注意**：此功能需要設定 `SUPABASE_SERVICE_ROLE_KEY` 環境變數。

## 環境變數 (.env)

請在 `backend` 目錄下建立 `.env` 檔案：

```ini
# Supabase 設定 (用於帳號刪除功能)
SUPABASE_URL=你的_Supabase_URL
SUPABASE_SERVICE_ROLE_KEY=你的_Supabase_Service_Role_Key

```

## 安裝與執行
### 本機開發**需求：**

* Node.js (v20+)
* LaTeX 引擎: `tectonic` (推薦，自動下載套件) 或 `pdflatex` (TeX Live)

```bash
# 安裝依賴
npm install

# 啟動伺服器 (預設 Port 3001)
npm start

```

### Docker 部署 (推薦)本專案提供 `Dockerfile`，並已優化 Tectonic 快取機制。建議搭配根目錄的 `start.sh` 使用。

手動 Docker 執行指令：

```bash
# 1. 建置映像檔
docker build -t latex-backend .

# 2. 建立 Volume (用於快取 Tectonic 套件，避免每次重抓)
docker volume create tectonic-cache

# 3. 啟動容器
docker run -d \
  -p 3001:3001 \
  --env-file .env \
  -v tectonic-cache:/root/.cache/Tectonic \
  --name latex-backend-container \
  --cpus="1.0" \
  --memory="1g" \
  latex-backend

```

## 設定 LaTeX 引擎專案預設使用 `tectonic`。若您希望使用標準的 `pdflatex`，請修改 `server.js` 中的設定：

```javascript
// server.js
const LATEX_CMD = 'pdflatex';
const LATEX_ARGS = ['-interaction=nonstopmode', '-halt-on-error', 'main.tex'];

```

## 安全性注意事項此後端會直接執行使用者提供的 LaTeX 程式碼。在生產環境中，強烈建議：

1. **使用 Docker 容器** 隔離執行環境 (已提供)。
2. 設定 **CPU 與記憶體限制** (參考 `start.sh`)。
3. 不要給予容器 root 權限 (本專案 Dockerfile 使用 Node 基礎映像檔，建議進一步配置 User)。