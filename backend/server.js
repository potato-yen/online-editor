/**
 * Minimal LaTeX compile server.
 *
 * Endpoint:
 *   POST /compile-latex
 *   body: { "source": "<full .tex source>" }
 *
 * Response:
 *   - success: { success: true, pdfBase64: "<base64 PDF buffer>" }
 *   - failure: { success: false, errorLog: "..." }
 *
 * IMPORTANT:
 * - This version runs a LaTeX engine directly on the host machine.
 * - This is OK for local / personal use.
 * - Do NOT expose this publicly without sandboxing (Docker, no network,
 *   resource limits, etc.) because arbitrary LaTeX can be abused.
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { randomUUID } = require('crypto');
const { execFile } = require('child_process');

// ---------------------------
// LaTeX engine config
// ---------------------------
//
// OPTION 1: tectonic (建議開發用，因為是單一 binary，依賴比較少)
//   需要系統上有 `tectonic` 這個指令
//   macOS 可用: brew install tectonic
//
// OPTION 2: pdflatex (如果你已經裝 MacTeX / TeX Live)
//   改掉下面兩個常數即可
//

// ---- 用 tectonic 的版本 ----
const LATEX_CMD = 'tectonic';
const LATEX_ARGS = [
  'main.tex',
  '--outfmt',
  'pdf'
];

// ---- 如果你想用 pdflatex，請改成這樣： ----
// const LATEX_CMD = 'pdflatex';
// const LATEX_ARGS = [
//   '-interaction=nonstopmode', // 不要互動停下來
//   '-halt-on-error',           // 出錯就停
//   'main.tex'
// ];
//
// 然後記得重新啟動後端 `npm start`

// ---------------------------
// 小工具: 執行 LaTeX 編譯一次
// ---------------------------
//
// runLatexOnce(workDir, timeoutMs) 會：
//   在 workDir 執行 LATEX_CMD LATEX_ARGS
//   timeout 超過就丟錯
//
function runLatexOnce(workDir, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    execFile(
      LATEX_CMD,
      LATEX_ARGS,
      {
        cwd: workDir,
        timeout: timeoutMs, // ms
      },
      (error, stdout, stderr) => {
        if (error) {
          // 回傳詳細資訊讓呼叫端自行組裝錯誤訊息
          reject({ error, stdout, stderr });
        } else {
          resolve({ stdout, stderr });
        }
      }
    );
  });
}

function formatLatexErrorLog(info) {
  if (!info || typeof info !== 'object') {
    return 'Unknown LaTeX error';
  }

  const chunks = [];
  if (info.stdout && info.stdout.trim()) {
    chunks.push(`STDOUT:\n${info.stdout.trim()}`);
  }
  if (info.stderr && info.stderr.trim()) {
    chunks.push(`STDERR:\n${info.stderr.trim()}`);
  }
  if (!chunks.length && info.error) {
    chunks.push(String(info.error));
  }

  return chunks.join('\n\n') || 'Unknown LaTeX error';
}

// ---------------------------
// 建立 Express app
// ---------------------------
const app = express();

// 允許從前端 (http://localhost:5173) 來呼叫
app.use(cors());

// 允許 JSON body，限制大小，避免有人硬灌超大檔案
app.use(express.json({ limit: '1mb' }));

// ---------------------------
// POST /compile-latex
// ---------------------------
//
// Request body 範例：
//   {
//     "source": "\\documentclass{article}\\begin{document}Hello\\end{document}"
//   }
//
// 回傳 JSON：
//   成功：{ success: true, pdfBase64: "..." }
//   失敗：{ success: false, errorLog: "..." }
//
app.post('/compile-latex', async (req, res) => {
  try {
    const source = req.body && req.body.source;

    // 檢查 body
    if (typeof source !== 'string' || !source.trim()) {
      return res.status(400).json({ error: 'Missing LaTeX source' });
    }

    // ---------------------------
    // 1. 建立此次編譯的臨時資料夾
    // ---------------------------
    // /tmp/latex-jobs/<uuid> 之類的
    const baseTmp = path.join(os.tmpdir(), 'latex-jobs');
    fs.mkdirSync(baseTmp, { recursive: true });

    const jobId = randomUUID();
    const workDir = path.join(baseTmp, jobId);
    fs.mkdirSync(workDir, { recursive: true });

    // 把前端送來的 LaTeX 內容寫成 main.tex
    const texPath = path.join(workDir, 'main.tex');
    fs.writeFileSync(texPath, source, 'utf8');

    // ---------------------------
    // 2. 執行 LaTeX 編譯器
    // ---------------------------
    // 第一次跑 tectonic 時，牠可能會去抓套件，會花比較久時間
    // runLatexOnce 裡預設 timeout 是 8000ms
    // 如果你看到一直 timeout，可以把上面 runLatexOnce 的 timeout 調大
    try {
      await runLatexOnce(workDir, 15000); // 15 秒，第一次跑 tectonic 可能需要
    } catch (e) {
      // 編譯失敗，回傳錯誤資訊
      // （前端會把 error.message 顯示成「編譯失敗：...」）
      console.error('LaTeX compile failed:', e);

      // 清理暫存資料夾（最佳實務，避免 /tmp 爆掉）
      try {
        fs.rmSync(workDir, { recursive: true, force: true });
      } catch (_) {}

      const errorLog = formatLatexErrorLog(e);

      return res
        .status(200)
        .json({ success: false, errorLog });
    }

    // ---------------------------
    // 3. 確認 main.pdf 是否產生
    // ---------------------------
    const pdfPath = path.join(workDir, 'main.pdf');
    if (!fs.existsSync(pdfPath)) {
      // 如果沒有 PDF，代表編譯器沒有成功輸出
      try {
        fs.rmSync(workDir, { recursive: true, force: true });
      } catch (_) {}

      return res
        .status(500)
        .json({ error: 'No PDF output generated' });
    }

    // 讀取 PDF 檔案內容
    const pdfBuf = fs.readFileSync(pdfPath);

    // ---------------------------
    // 4. 回傳 PDF 給前端
    // ---------------------------
    const pdfBase64 = pdfBuf.toString('base64');
    res.json({ success: true, pdfBase64 });

    // ---------------------------
    // 5. 清理暫存
    // ---------------------------
    try {
      fs.rmSync(workDir, { recursive: true, force: true });
    } catch (_) {
      // ignore cleanup error
    }

  } catch (err) {
    // 如果整個 try/catch 掉下來，就代表 server 內部有例外
    console.error('Server error:', err);

    return res.status(500).json({
      error: 'Server error',
      detail: String(err),
    });
  }
});

// ---------------------------
// 啟動伺服器
// ---------------------------
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`LaTeX compile server listening on http://localhost:${PORT}`);
});
