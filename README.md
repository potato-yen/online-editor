# 線上文字編輯器

- `frontend/`
  - React + Vite + Tailwind + KaTeX + TailwindCSS
  - 使用 `Supabase API` 進行使用者登入與存取資料

- `backend/`
  - Node.js + Express
  - 提供 `/compile-latex` API
  - 呼叫系統上的 `tectonic`(或 `pdflatex`) 來把 .tex 轉成 PDF

## 主要功能（簡述）

- 雙模式編輯與全新 UI：支援 Markdown / LaTeX 編輯，採用現代化深色主題 (Dark Mode) 與動態背景設計，提供更舒適的視覺體驗。

- 增強型 Markdown：除了 KaTeX 數學公式外，新增 Mermaid 圖表繪製支援與程式碼區塊語法高亮 (Highlight.js)。

- LaTeX 智慧輔助：內建視覺化的矩陣生成器 (Matrix Modal)、表格精靈與常用數學符號快捷選單，大幅降低複雜語法的輸入門檻。

- 專案與檔案管理：支援文檔的新增、刪除、重新命名，並可直接匯入本機檔案 (.md / .tex) 進行編輯。

- 個人化與帳號設定：可自訂編輯器字體大小、自動換行與縮排設定；帳號管理功能新增修改密碼與刪除帳號。

- 即時預覽與同步：左側編輯、右側預覽（支援捲動同步），內容自動儲存至雲端資料庫，並支援匯出原始碼或 PDF。

## 啟動流程（開發狀態）

### 1. 啟動後端

```bash
cd backend
npm install
npm start
```

<details>
<summary><strong>以 Docker 啟動後端</strong></summary>

```bash
cd backend
docker build --no-cache -t latex-backend .
docker run --rm -p 3001:3001 latex-backend
```

</details>
請自行修改 `.env.example` 為 `.env`

```bash
SUPABASE_URL=your-supabase-url-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

這會在 http://localhost:3001 開一個 `/compile-latex` API。

### 2. 啟動前端

```bash
cd frontend
npm install
npm run dev
```

<details>
<summary><strong>以 Docker 啟動前端</strong></summary>

```bash
cd frontend
docker build --no-cache -t latex-frontend .
docker run --rm -p 5173:5173 latex-frontend
```

</details>

請自行修改 `.env.example` 為 `.env`

```bash
VITE_SUPABASE_URL=your-supabase-url-here
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Vite 預設在 http://localhost:5173

### 3. 使用
1.  開啟 `http://localhost:5173`。
2.  您會被導向「註冊」或「登入」頁面。
3.  註冊一個新帳號並登入。
4.  登入後，您將被導向專屬專案資料庫
5.  選擇`import` 或 `Add New`新增檔案，並輸入檔名
6.  進入主要編輯頁面，即可開始使用

### 注意：`tectonic`跟`pdflatex`必須要有其中之一
<details>
<summary><strong>若要下載 tectonic 請使用以下指令</strong></summary>

##### Unix(include MacOS)
```bash
curl --proto '=https' --tlsv1.2 -fsSL https://drop-sh.fullyjustified.net |sh
```
##### MacOS(brew)
```bash
$ brew install tectonic
```
##### Windows(Powershell)
```ps
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://drop-ps1.fullyjustified.net'))
```

</details>

<details>
<summary><strong>若要下載 pdflatex 請使用以下指令或網站</strong></summary>

##### Debain/Ubuntu
```bash
sudo apt-get update
sudo apt-get install texlive-latex-base
sudo apt-get install texlive-fonts-recommended
sudo apt-get install texlive-fonts-extra
```
##### MacOS
```bash
brew install basictex
```
##### Windows
請參考 [MiKTeX](https://miktex.org/download)

</details>

專案目前預設使用 `tectonic`，若要更改，請編輯 `backend/server.js` 中的 `LATEX_CMD` 常數。

## 注意事項
- 這個後端在現在的型態下**不適合直接丟到公開網路**。  
  要上線必須把每次編譯放進 sandbox (例如 Docker 容器) 並做資源限制，避免惡意 .tex 造成安全風險或當機。

