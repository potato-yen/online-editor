# Frontend

## 功能
- Markdown/LaTeX 模式切換
- Markdown:
  - 即時預覽 (標題/清單/表格/GFM/KaTeX 數學)
  - 匯出 PDF (html2pdf.js)
- LaTeX:
  - 編輯 .tex 內容
  - 「編譯並預覽 (.pdf)」會呼叫後端 `/compile-latex`
  - 後端回傳 PDF blob，前端用 iframe 顯示
- 左右區塊寬度可拖曳調整

## 開發
```bash
npm install
npm run dev
```

預設 Vite 開在 http://localhost:5173  
後端預設跑在 http://localhost:3001
你可以修改 `BACKEND_URL` 常數 (src/App.tsx) 來對應後端位置。
