# 線上文字編輯器

- `frontend/`
  - React + Vite + Tailwind + KaTeX + TailwindCSS
  - 使用 `Supabase API` 進行使用者登入與存取資料

- `backend/`
  - Node.js + Express
  - 提供 `/compile-latex` API
  - 呼叫系統上的 `tectonic`(或 `pdflatex`) 來把 .tex 轉成 PDF

## 主要功能（簡述）

- 支援 **Markdown / LaTeX** 兩種文檔類型，登入後以「專案列表」管理文檔（每位用戶最多 10 份）。
- 左側編輯、右側預覽：Markdown 走 KaTeX 渲染、LaTeX 走後端編譯 PDF 即時預覽。
- **自動儲存 + 手動 Save 按鈕**，內容會綁定到目前登入使用者的 Supabase documents。
- 匯入 `.md / .tex`，匯出 `.md / .tex`；Markdown 可一鍵匯出為白底 PDF。
- 專案列表提供「新增（名稱＋類型）/ 重新命名 / 刪除」功能，並以最近編輯時間排序。
- 右上角頭像顯示註冊時填寫的使用者名稱，點擊可展開使用者資訊與登出選單。

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
4.  登入後，您將被導向主編輯器頁面，可以開始使用了。

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

