# 線上文字編輯器

- `frontend/`
  - React + Vite + Tailwind + KaTeX
  - Markdown 模式：即時渲染、匯出 PDF（前端直接轉）
  - LaTeX 模式：可以把整段 .tex 送給後端編譯，並預覽產生的 PDF
- `backend/`
  - Node.js + Express
  - 提供 `/compile-latex` API
  - 呼叫系統上的 `tectonic`(或 `pdflatex`) 來把 .tex 轉成 PDF
 
### 注意：`tectonic`跟`pdflatex`必須要有其中之一

**若要下載 `tectonic`請使用以下指令**
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
**若要下載`pdflatex`請使用以下指令或網站**
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

## 啟動流程（開發狀態）

1. 啟動後端
```bash
cd backend
npm install
npm start
```
這會在 http://localhost:3001 開一個 `/compile-latex` API。

2. 啟動前端
```bash
cd ../frontend
npm install
npm install html2pdf.js
npm run dev
```
Vite 預設在 http://localhost:5173

3. 使用
- 前端頁面上切到「LaTeX」模式，貼上你的 TeX 文件
- 按「編譯並預覽 (.pdf)」
- 右側就會透過 iframe 顯示後端編譯好的 PDF

## 注意事項
- 這個後端在現在的型態下**不適合直接丟到公開網路**。  
  要上線必須把每次編譯放進 sandbox (例如 Docker 容器) 並做資源限制，避免惡意 .tex 造成安全風險或當機。
# online-editor
# online-editor
