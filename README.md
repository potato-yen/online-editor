# 線上文字編輯器

-   **`frontend/`**
    -   React + Vite + TypeScript + TailwindCSS
    -   使用 `react-router-dom` 進行頁面導航。
    -   使用 `AuthContext` 管理全域登入狀態。
-   **`backend/`**
    -   Node.js + Express
    -   使用 `SQLite` 儲存使用者資料。
    -   使用 `JWT` (JSON Web Tokens) 進行使用者認證。

## 主要功能

* **雙模式編輯**：可在 Markdown 和 LaTeX 模式間自由切換。
* **使用者認證**：
    * 支援使用者註冊與登入。
    * 使用 `JWT` 進行 session 管理。
    * 資料庫使用 `SQLite`，密碼使用 `bcryptjs` 雜湊儲存。
* **Markdown 模式**：
    * 即時渲染預覽（支援 GFM 表格、KaTeX 數學公式）。
    * 前端即時匯出 PDF (使用 `html2pdf.js`)。
* **LaTeX 模式**：
    * **[受保護]** 只有登入的使用者才能呼叫編譯 API。
    * 後端即時編譯：將 `.tex` 原始碼傳送至後端 `/compile-latex` API。
    * 後端使用 `tectonic` (或 `pdflatex`) 進行編譯。
    * 前端 `iframe` 即時預覽編譯後的 PDF。
* **檔案操作**：支援匯入 `.md` / `.tex` 檔案，並可下載原始碼。
 


## 啟動流程（開發狀態）


### 1. 啟動後端 (Backend)
後端負責 API 和資料庫。

```bash
cd backend
```

安裝 dependencies (express, cors, sqlite3, bcryptjs, jsonwebtoken 等)
```
npm install
```

建立環境變數檔案
在 backend/ 資料夾中建立一個 .env 檔案
```
touch .env
```

編輯 .env 檔案，並加入一個隨機的密鑰
```
JWT_SECRET='your-super-strong-and-secret-key-change-this'
```
啟動伺服器
```
npm start
````

  * 這會在 `http://localhost:3001` 啟動 API 伺服器，用以compile Latex。
  * 第一次啟動時，它會自動在 `backend/` 資料夾中建立一個 `project.db` 檔案作為 SQLite 資料庫。


### 2. 啟動前端 (Frontend)

先回到專案跟目錄
```bash
cd ..
cd frontend
```

安裝 dependencies (react, react-router-dom, jwt-decode 等)
```bash
npm install
```

建立環境變數檔案
在 frontend/ 資料夾中建立一個 .env 檔案
```bash
touch .env
```

編輯 .env 檔案，指向後端 API 位址
```
VITE_API_BASE_URL=http://localhost:3001
```


啟動 Vite 開發伺服器
```
npm run dev
```


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

