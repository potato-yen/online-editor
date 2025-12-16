# Online Editor Frontend

這是一個基於 React + Vite + Tailwind CSS 的現代化線上文字編輯器，整合了 Supabase 進行身分驗證與資料儲存。

## 主要功能

### 1. 雙模式編輯器
- **Markdown 模式**:
  - 支援 **GFM** (GitHub Flavored Markdown)。
  - **即時預覽**: 支援 KaTeX 數學公式、**Mermaid 圖表** (流程圖/時序圖/類別圖...)、程式碼語法高亮 (Highlight.js)。
  - **工具列精靈**: 快速插入表格、圖片、連結、數學符號。
  - **捲動同步**: 編輯區與預覽區精準同步捲動。
  - **匯出**: 支援匯出 .md 原始檔或透過瀏覽器列印轉 PDF。

- **LaTeX 模式**:
  - 完整 LaTeX 語法支援。
  - **雲端編譯**: 呼叫後端 API 進行編譯，即時預覽 PDF (iframe 顯示)。
  - **視覺化輔助**: 
    - **矩陣精靈 (Matrix Wizard)**: 視覺化設定行列數與內容。
    - **多行公式精靈 (Aligned Wizard)**: 輕鬆建立對齊的數學推導式。
    - **表格精靈**: 快速產生 LaTeX 表格語法。
  - **錯誤除錯**: 解析 LaTeX Log，顯示友善的錯誤訊息與行號。

### 2. 專案管理
- **Supabase Auth**: 支援使用者註冊、登入。
- **雲端儲存**: 文件內容自動儲存至 Supabase Database。
- **檔案操作**: 建立新檔、匯入本機檔案 (.md/.tex)、重新命名、刪除確認。
- **範本系統**: 內建數學筆記與學術論文範本。

### 3. 個人化設定
- **編輯器外觀**: 自訂字體大小、自動換行 (Word Wrap)。
- **編輯行為**: 縮排設定 (2/4 spaces)、自動閉合括號。
- **自動存檔**: 可自訂自動存檔的秒數。
- **帳號管理**: 修改使用者名稱、密碼、刪除帳號。

## 環境變數 (.env)

請在 `frontend` 目錄下建立 `.env` 檔案：

```ini
VITE_SUPABASE_URL=你的_Supabase_URL
VITE_SUPABASE_ANON_KEY=你的_Supabase_Anon_Key
VITE_BACKEND_URL=http://localhost:3001  # 後端 API 位置

```

## 開發與執行
```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev

```

預設執行於 `http://localhost:5173`。

## Docker 部署

```bash
# 建置映像檔
docker build -t latex-frontend .

# 啟動容器
docker run -d \
  -p 5173:5173 \
  --name latex-frontend-container \
  latex-frontend

```

## 專案結構 `src/components/`: UI 元件 (EditorPane, PreviewPane, Modals, Toolbars, SettingsMenu...)
* `src/hooks/`: 自定義 Hooks (useEditorActions, useLatexCompiler, useScrollSync, useEditorModals...)
* `src/pages/`: 頁面路由 (Login, Signup, ProjectList, MarkdownEditor, LatexEditor)
* `src/lib/`: 工具函式與 Supabase Client
* `src/layouts/`: 頁面佈局 (AppLayout, AuthLayout)
* `src/styles.css`: 全域樣式、列印樣式與 Tailwind 設定

