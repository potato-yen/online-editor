# Backend

這是簡單版 LaTeX 編譯後端。

## 用法
```bash
npm install
npm start
```

預設會在 http://localhost:3001 監聽一個 API：

- `POST /compile-latex`
  - body: `{ "source": "<整份 .tex 原文>" }`
  - 回傳：編譯後的 PDF（二進位內容，Content-Type = application/pdf）

前端會呼叫這個端點，把使用者在 LaTeX 模式輸入的內容送來，並把回傳的 PDF 用 iframe 顯示。

## 你需要什麼環境
- Node.js (跑這個 server)
- 一個 LaTeX 編譯器，例如：
  - [tectonic]：單一 binary，適合拿來做雛形
  - 或 `pdflatex` (TeX Live)
- 這支 server 預設用 `tectonic`，請確保本機裝得到 `tectonic`，或把 `LATEX_CMD` / `LATEX_ARGS` 改成 `pdflatex` 版本。

## 安全性（很重要）
這份程式碼**不安全，不能直接公開給陌生人用**。

原因：
- 它直接在主機上執行你丟來的 LaTeX。
- 惡意 LaTeX 可以大量吃 CPU、嘗試存取檔案、甚至嘗試執行系統命令（視 TeX 引擎設定而定）。

上線前你必須：
1. 把這段編譯動作放進 Docker / sandbox。
2. 關網路（`--network=none`）。
3. 設定 CPU / 記憶體 / timeout 限制。
4. 每次編譯用新的乾淨容器，跑完就砍掉。

如果只是你本機自用（例如做作業、寫報告），這版是 OK 的。
