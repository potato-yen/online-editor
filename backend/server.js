require('dotenv').config();

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { randomUUID } = require('crypto');
const { execFile } = require('child_process');

// Database + Auth
const { db, initDb } = require('./db');
const authRoutes = require('./routes/auth');
const verifyToken = require('./middleware/authMiddleware');

// =============================================================
// LaTeX engine configuration
// =============================================================
//
// OPTION 1: tectonic (default)
//   Install command:
//     macOS: brew install tectonic
//
// OPTION 2: pdflatex (if using MacTeX / TeX Live)
//   Replace LATEX_CMD and LATEX_ARGS accordingly.
//
// NOTE: You must restart backend after switching engine.
// =============================================================

// ---- Default: tectonic ----
const LATEX_CMD = 'tectonic';
const LATEX_ARGS = [
  'main.tex',
  '--outfmt', 'pdf'
];

// ---- pdflatex version (commented) ----
// const LATEX_CMD = 'pdflatex';
// const LATEX_ARGS = [
//   '-interaction=nonstopmode',
//   '-halt-on-error',
//   'main.tex'
// ];

// -------------------------------------------------------------
// Helper: run LaTeX compiler once
// -------------------------------------------------------------
// Executes LATEX_CMD in workDir.
// timeoutMs: milliseconds before force‑killing.
// Returns: { stdout, stderr } or throws Error
// -------------------------------------------------------------
function runLatexOnce(workDir, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    execFile(
      LATEX_CMD,
      LATEX_ARGS,
      {
        cwd: workDir,
        timeout: timeoutMs,
      },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(
            `latex error: ${error}\nstdout:\n${stdout}\nstderr:\n${stderr}`
          ));
        } else {
          resolve({ stdout, stderr });
        }
      }
    );
  });
}

// =============================================================
// Create Express app
// =============================================================
const app = express();
initDb(); // Initialize DB

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Attach auth routes
app.use('/api/auth', authRoutes);

// =============================================================
// POST /compile-latex  (Protected by verifyToken)
// =============================================================
// Body: { "source": "<LaTeX code>" }
// Response:
//    success → PDF binary (Content-Type: application/pdf)
//    failure → JSON { error: "...", detail: "..." }
// =============================================================
app.post('/compile-latex', verifyToken, async (req, res) => {
  console.log(`Compile request from user: ${req.user.username}`);

  try {
    const source = req.body && req.body.source;

    if (typeof source !== 'string' || !source.trim()) {
      return res.status(400).json({ error: 'Missing LaTeX source' });
    }

    // -------------------------------------------------------------
    // 1. Create temporary job directory
    // -------------------------------------------------------------
    const baseTmp = path.join(os.tmpdir(), 'latex-jobs');
    fs.mkdirSync(baseTmp, { recursive: true });

    const jobId = randomUUID();
    const workDir = path.join(baseTmp, jobId);
    fs.mkdirSync(workDir, { recursive: true });

    const texPath = path.join(workDir, 'main.tex');
    fs.writeFileSync(texPath, source, 'utf8');

    // -------------------------------------------------------------
    // 2. Run LaTeX compiler
    // -------------------------------------------------------------
    try {
      await runLatexOnce(workDir, 15000); // tectonic might need time
    } catch (e) {
      console.error('LaTeX compile failed:', e);
      try { fs.rmSync(workDir, { recursive: true, force: true }); } catch (_) {}
      return res.status(500).json({ error: 'Compilation failed', detail: String(e) });
    }

    // -------------------------------------------------------------
    // 3. Check PDF output
    // -------------------------------------------------------------
    const pdfPath = path.join(workDir, 'main.pdf');
    if (!fs.existsSync(pdfPath)) {
      try { fs.rmSync(workDir, { recursive: true, force: true }); } catch (_) {}
      return res.status(500).json({ error: 'No PDF output generated' });
    }

    const pdfBuf = fs.readFileSync(pdfPath);

    // -------------------------------------------------------------
    // 4. Send PDF
    // -------------------------------------------------------------
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="output.pdf"');
    res.send(pdfBuf);

    // -------------------------------------------------------------
    // 5. Cleanup
    // -------------------------------------------------------------
    try { fs.rmSync(workDir, { recursive: true, force: true }); } catch (_) {}

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Server error', detail: String(err) });
  }
});

// =============================================================
// Start server
// =============================================================
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`LaTeX compile server listening on http://localhost:${PORT}`);
});

