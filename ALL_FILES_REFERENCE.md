# IASW — All Files Reference
**Total files: 33**
---
## Table of Contents
- [.env.example](#envexample)
- [.gitignore](#gitignore)
- [README.md](#readmemd)
- [backend/db.js](#backend-dbjs)
- [backend/package.json](#backend-packagejson)
- [backend/server.js](#backend-serverjs)
- [backend/agents/confidenceScorer.js](#backend-agents-confidencescorerjs)
- [backend/agents/documentProcessor.js](#backend-agents-documentprocessorjs)
- [backend/agents/filenetArchiver.js](#backend-agents-filenetarchiverjs)
- [backend/agents/summaryAgent.js](#backend-agents-summaryagentjs)
- [backend/agents/validationAgent.js](#backend-agents-validationagentjs)
- [backend/middleware/logger.js](#backend-middleware-loggerjs)
- [backend/models/auditLog.js](#backend-models-auditlogjs)
- [backend/models/pendingTable.js](#backend-models-pendingtablejs)
- [backend/routes/checker.js](#backend-routes-checkerjs)
- [backend/routes/requests.js](#backend-routes-requestsjs)
- [frontend/index.html](#frontend-indexhtml)
- [frontend/package.json](#frontend-packagejson)
- [frontend/postcss.config.js](#frontend-postcssconfigjs)
- [frontend/tailwind.config.js](#frontend-tailwindconfigjs)
- [frontend/vite.config.js](#frontend-viteconfigjs)
- [frontend/src/App.jsx](#frontend-src-appjsx)
- [frontend/src/index.css](#frontend-src-indexcss)
- [frontend/src/main.jsx](#frontend-src-mainjsx)
- [frontend/src/components/ConfidenceScoreCard.jsx](#frontend-src-components-confidencescorecardjsx)
- [frontend/src/components/FileUpload.jsx](#frontend-src-components-fileuploadjsx)
- [frontend/src/components/PipelineTrace.jsx](#frontend-src-components-pipelinetracejsx)
- [frontend/src/components/Topbar.jsx](#frontend-src-components-topbarjsx)
- [frontend/src/hooks/usePolling.js](#frontend-src-hooks-usepollingjs)
- [frontend/src/lib/api.js](#frontend-src-lib-apijs)
- [frontend/src/pages/AuditPage.jsx](#frontend-src-pages-auditpagejsx)
- [frontend/src/pages/CheckerPage.jsx](#frontend-src-pages-checkerpagejsx)
- [frontend/src/pages/IntakePage.jsx](#frontend-src-pages-intakepagejsx)

---

## .env.example
```bash
# Copy this file to backend/.env and fill in your values

# Required: Anthropic API key
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Optional: Server port (default: 3001)
PORT=3001

# Optional: Environment
NODE_ENV=development

# Optional: Path to FileNet mock store (default: ../filenet-store)
FILENET_STORE_PATH=../filenet-store

# Optional: Frontend URL for CORS (default: localhost:5173)
FRONTEND_URL=http://localhost:5173
```

## .gitignore
```text
node_modules/
.env
*.db
*.db-shm
*.db-wal
iasw.log
filenet-store/
dist/
.DS_Store
*.local
```

## README.md
```markdown
# IASW — Intelligent Account Servicing Workflow

> AI-powered document verification for banking account change requests with mandatory Human-in-the-Loop approval.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## Overview

IASW replaces the manual **Maker** role in bank account change request processing with a 5-agent AI pipeline, while preserving the **human Checker** as the sole authority to approve any write to the core banking system (RPS).

**Core constraint:** The AI never writes to RPS autonomously. Every approval is an explicit human action.

---

## Architecture

```
Staff Intake Form
       │ (async)
       ▼
┌─ Agent Pipeline ──────────────────────────────────────────┐
│  1. Validation Agent   → RPS field check                  │
│  2. Document Processor → Claude Vision OCR + extraction    │
│  3. Confidence Scorer  → Field-level scores (0–100%)      │
│  4. FileNet Archiver   → Document store + metadata        │
│  5. Summary Agent      → NL summary + recommendation      │
└───────────────────────┬───────────────────────────────────┘
                        │ stages record
                  Pending Table
              AI_VERIFIED_PENDING_HUMAN
                        │
        ══════════ HITL BOUNDARY ══════════
                        │ explicit human click only
                        ▼
               Human Checker Decision
               (Approve / Reject)
                        │
           ┌────────────┴────────────┐
           ▼                         ▼
    Mock RPS write-call        Audit log entry
    (approval only)            (HUMAN level)
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| LLM / OCR | Claude Sonnet 4 (Anthropic API) |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Document Store | Local filesystem mock (FileNet stub) |
| Observability | Structured JSON logging (Winston) |
| Deployment | Single repo, separate frontend/backend |

---

## Project Structure

```
iasw/
├── frontend/                 # React + Vite app
│   ├── src/
│   │   ├── components/       # UI components
│   │   ├── pages/            # Intake, Checker, Audit pages
│   │   ├── hooks/            # Custom React hooks
│   │   └── lib/              # API client, utilities
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── backend/                  # Express API server
│   ├── agents/               # AI agent implementations
│   │   ├── validationAgent.js
│   │   ├── documentProcessor.js
│   │   ├── confidenceScorer.js
│   │   ├── filenetArchiver.js
│   │   └── summaryAgent.js
│   ├── routes/
│   │   ├── requests.js       # Pipeline trigger endpoints
│   │   └── checker.js        # HITL decision endpoints
│   ├── models/
│   │   ├── pendingTable.js   # DB operations
│   │   └── auditLog.js
│   ├── middleware/
│   │   └── logger.js
│   ├── db.js                 # SQLite setup
│   ├── server.js
│   └── package.json
├── docs/
│   └── SOLUTION_DESIGN.md
├── filenet-store/            # Mock document archive (auto-created)
├── .env.example
└── README.md
```

---

## Setup & Running

### Prerequisites
- Node.js 18+
- Anthropic API key

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/iasw.git
cd iasw

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Configure Environment

```bash
# Backend
cp .env.example backend/.env
# Edit backend/.env and add your ANTHROPIC_API_KEY

# Frontend (optional — defaults to localhost:3001)
cp .env.example frontend/.env
```

### 3. Run Development Servers

```bash
# Terminal 1 — Backend (port 3001)
cd backend && npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend && npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### 4. Demo Flow

1. **Intake tab** — fields pre-filled with C001, Priya Sharma → Priya Mehta
2. Click **Use demo document** (or upload a real marriage certificate image/PDF)
3. Click **Submit to AI Pipeline**
4. Watch the 5-agent trace complete on the right panel
5. Switch to **Checker Review** tab
6. Review AI summary, confidence scores, FileNet reference
7. Click **Approve & Write to RPS** → mock RPS write executes
8. Switch to **Audit Log** tab → see full structured trace

---

## Environment Variables

```env
# backend/.env
ANTHROPIC_API_KEY=sk-ant-...
PORT=3001
NODE_ENV=development
FILENET_STORE_PATH=../filenet-store
```

---

## HITL Enforcement

The AI never writes to RPS. Enforcement is architectural:

1. **State machine** — Pending Table status only moves to `APPROVED/REJECTED` via the `/checker/:id/decision` endpoint, which requires `{ decision: 'APPROVED' | 'REJECTED', checker_id }` in the request body — the AI pipeline has no access to this endpoint
2. **Audit trail** — Every human decision logged as `level: HUMAN` with checker identity and timestamp
3. **No auto-escalation** — Even 100% confidence records display the HITL warning and require a click

---

## Confidence Scoring

```
overall = (old_name_match × 0.40) + (new_name_match × 0.40) + (doc_auth × 0.20)

≥ 80%  → HIGH    → Recommended: APPROVE
60–79% → MEDIUM  → Recommended: REVIEW
< 60%  → LOW     → Recommended: REJECT
```

---

## License

MIT
```

## backend/db.js
```javascript
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'iasw.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS pending_requests (
      request_id          TEXT PRIMARY KEY,
      change_type         TEXT NOT NULL DEFAULT 'legal_name',
      customer_id         TEXT NOT NULL,
      old_value           TEXT NOT NULL,
      new_value           TEXT NOT NULL,

      -- Extracted from document
      extracted_bride     TEXT,
      extracted_married   TEXT,
      extracted_doc_type  TEXT,
      extracted_date      TEXT,
      extracted_registrar TEXT,

      -- Confidence scores (0-100)
      confidence_bride    INTEGER,
      confidence_married  INTEGER,
      confidence_auth     INTEGER,
      overall_confidence  INTEGER,
      forgery_result      TEXT,

      -- AI outputs
      ai_summary          TEXT,
      ai_recommendation   TEXT,
      score_card_json     TEXT,

      -- Document store
      filenet_ref         TEXT,
      file_name           TEXT,
      file_type           TEXT,

      -- Status
      status              TEXT NOT NULL DEFAULT 'AI_VERIFIED_PENDING_HUMAN',
      
      -- Human decision
      checker_id          TEXT,
      checker_decision    TEXT,
      checker_notes       TEXT,

      -- RPS
      rps_write_ref       TEXT,
      rps_written_at      TEXT,

      -- Timestamps
      created_at          TEXT NOT NULL,
      ai_completed_at     TEXT,
      decided_at          TEXT
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      log_id      INTEGER PRIMARY KEY AUTOINCREMENT,
      request_id  TEXT,
      timestamp   TEXT NOT NULL,
      level       TEXT NOT NULL,
      event       TEXT NOT NULL,
      payload     TEXT,
      duration_ms INTEGER,
      FOREIGN KEY (request_id) REFERENCES pending_requests(request_id)
    );

    CREATE INDEX IF NOT EXISTS idx_audit_request ON audit_log(request_id);
    CREATE INDEX IF NOT EXISTS idx_pending_status ON pending_requests(status);
    CREATE INDEX IF NOT EXISTS idx_pending_customer ON pending_requests(customer_id);
  `);
}

module.exports = { getDb };
```

## backend/package.json
```json
{
  "name": "iasw-backend",
  "version": "1.0.0",
  "description": "IASW Backend — Express API server with AI agent pipeline",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.36.3",
    "better-sqlite3": "^9.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.18.3",
    "multer": "^1.4.5-lts.1",
    "uuid": "^9.0.1",
    "winston": "^3.13.0"
  },
  "devDependencies": {
    "nodemon": "^3.1.0"
  }
}
```

## backend/server.js
```javascript
require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const path    = require('path');
const { logger } = require('./middleware/logger');

// Initialise DB on startup
require('./db').getDb();

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:4173',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}));

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info(`${req.method} ${req.path} ${res.statusCode} ${Date.now() - start}ms`);
  });
  next();
});

// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/requests', require('./routes/requests'));
app.use('/api/checker',  require('./routes/checker'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status:    'ok',
    service:   'IASW Backend',
    timestamp: new Date().toISOString(),
    env:       process.env.NODE_ENV || 'development'
  });
});

// ── Error handler ──────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// ── Start ──────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`IASW Backend running on http://localhost:${PORT}`);
  if (!process.env.ANTHROPIC_API_KEY) {
    logger.warn('ANTHROPIC_API_KEY not set — document extraction will use demo fallback');
  }
});
```

## backend/agents/confidenceScorer.js
```javascript
/**
 * Confidence Scorer Agent
 * Scores each field match between extracted document data and requested change.
 * Produces a structured Confidence Score Card.
 */

function normalizeName(name) {
  return (name || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Word-overlap fuzzy name matching (0–100)
 * Handles: case differences, punctuation, partial matches
 */
function fuzzyNameMatch(nameA, nameB) {
  if (!nameA || !nameB) return 0;

  const a = normalizeName(nameA);
  const b = normalizeName(nameB);

  if (a === b) return 100;

  const wordsA = a.split(' ').filter(Boolean);
  const wordsB = b.split(' ').filter(Boolean);
  const setB = new Set(wordsB);
  const commonWords = wordsA.filter(w => setB.has(w));

  const precision = commonWords.length / wordsA.length;
  const recall    = commonWords.length / wordsB.length;
  const f1 = precision + recall > 0
    ? (2 * precision * recall) / (precision + recall)
    : 0;

  return Math.round(f1 * 100);
}

/**
 * Document authenticity scoring based on extracted content heuristics.
 * In production this would integrate with an image forensics API.
 */
function scoreDocumentAuthenticity(extracted) {
  let score = 40; // base score
  const flags = [];
  const positives = [];

  const rawText = (extracted.raw_text || '').toLowerCase();
  const combined = rawText + JSON.stringify(extracted).toLowerCase();

  // Authority markers
  if (combined.includes('government') || combined.includes('municipal') || combined.includes('state')) {
    score += 15; positives.push('government_authority_present');
  }
  if (combined.includes('registrar') || combined.includes('sub-registrar')) {
    score += 10; positives.push('registrar_reference');
  }
  if (combined.includes('certified') || combined.includes('true copy') || combined.includes('official')) {
    score += 8; positives.push('certification_language');
  }

  // Document structure markers
  if (extracted.registration_number) {
    score += 10; positives.push('registration_number_present');
  }
  if (extracted.date) {
    score += 5; positives.push('date_present');
  }
  if (extracted.witnesses) {
    score += 5; positives.push('witnesses_present');
  }
  if (extracted.official_stamps && extracted.official_stamps !== 'null') {
    score += 7; positives.push('official_stamps_detected');
  }

  // Red flags
  if (!extracted.registrar) {
    score -= 10; flags.push('no_issuing_authority');
  }
  if (!extracted.date) {
    score -= 5; flags.push('no_date');
  }
  if (!extracted.registration_number) {
    score -= 5; flags.push('no_registration_number');
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    flags,
    positives
  };
}

/**
 * Forgery detection (heuristic rule-based)
 */
function runForgeryCheck(extracted) {
  const rawText = (extracted.raw_text || '').toLowerCase();
  const flags = [];

  // Look for consistency between fields
  if (extracted.bride_name && extracted.raw_text) {
    const brideInRaw = rawText.includes(normalizeName(extracted.bride_name).split(' ')[0]);
    if (!brideInRaw) flags.push('bride_name_not_in_raw_text');
  }

  // Check for suspicious patterns
  if (rawText.includes('photoshop') || rawText.includes('edited')) {
    flags.push('editing_software_detected');
  }

  const passed = flags.length === 0;
  return { passed, flags, result: passed ? 'PASS' : 'FLAG' };
}

/**
 * Main scorer function
 */
function runConfidenceScorer({ extracted, oldName, newName }) {
  const start = Date.now();

  const brideScore   = fuzzyNameMatch(extracted.bride_name,   oldName);
  const marriedScore = fuzzyNameMatch(extracted.married_name, newName);
  const authResult   = scoreDocumentAuthenticity(extracted);
  const forgery      = runForgeryCheck(extracted);

  // Weighted overall score
  const overall = Math.round(
    (brideScore   * 0.40) +
    (marriedScore * 0.40) +
    (authResult.score * 0.20)
  );

  // Per-field results
  const scoreCard = [
    {
      field:  'Old name → Bride field match',
      score:  brideScore,
      result: brideScore >= 85 ? 'PASS' : brideScore >= 60 ? 'FLAG' : 'FAIL',
      detail: `Extracted: "${extracted.bride_name}" vs Requested: "${oldName}"`
    },
    {
      field:  'New name → Married name match',
      score:  marriedScore,
      result: marriedScore >= 85 ? 'PASS' : marriedScore >= 60 ? 'FLAG' : 'FAIL',
      detail: `Extracted: "${extracted.married_name}" vs Requested: "${newName}"`
    },
    {
      field:  'Document authenticity',
      score:  authResult.score,
      result: authResult.score >= 70 ? 'PASS' : authResult.score >= 50 ? 'FLAG' : 'FAIL',
      detail: `Positives: ${authResult.positives.join(', ') || 'none'}. Flags: ${authResult.flags.join(', ') || 'none'}`
    },
    {
      field:  'Forgery detection',
      score:  null,
      result: forgery.result,
      detail: forgery.flags.length ? `Flags: ${forgery.flags.join(', ')}` : 'No suspicious indicators detected'
    }
  ];

  // Recommendation
  let recommendation;
  if (overall >= 80 && forgery.passed) {
    recommendation = 'APPROVE';
  } else if (overall >= 60) {
    recommendation = 'REVIEW';
  } else {
    recommendation = 'REJECT';
  }

  return {
    scoreCard,
    overall,
    recommendation,
    brideScore,
    marriedScore,
    authScore: authResult.score,
    forgeryResult: forgery.result,
    forgeryFlags: forgery.flags,
    duration_ms: Date.now() - start
  };
}

module.exports = { runConfidenceScorer, fuzzyNameMatch };
```

## backend/agents/documentProcessor.js
```javascript
/**
 * Document Processor Agent
 * Performs OCR and structured field extraction from uploaded documents
 * using Claude's vision capability.
 */

const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const EXTRACTION_SYSTEM_PROMPT = `You are a precise document OCR and data extraction AI for a regulated banking document verification system.

Your task is to extract structured data from uploaded document images. You must:
1. Identify the document type
2. Extract all relevant fields with exact text as printed
3. Return null for any field that is not clearly visible or legible
4. NEVER hallucinate or infer data that is not explicitly present in the document

This is a compliance-critical system — accuracy is paramount over completeness.`;

const EXTRACTION_USER_PROMPT = `Analyse this uploaded document image carefully.

Extract all visible text and structured information. Return ONLY a JSON object with these fields:

{
  "doc_type": "exact document type as printed on the document",
  "bride_name": "full name of bride/applicant (original name) as printed",
  "groom_name": "full name of groom/spouse as printed",
  "married_name": "post-marriage surname or full married name if explicitly stated",
  "date": "date of marriage/event as printed",
  "registration_number": "registration or certificate number if present",
  "registrar": "issuing authority, registrar, or government office name",
  "place": "place of marriage or issue if stated",
  "witnesses": "witness names if present (comma separated)",
  "official_stamps": "description of any stamps, seals, or official marks",
  "raw_text": "complete verbatim OCR of all visible text on the document"
}

Return ONLY the JSON object. No preamble, no explanation, no markdown code fences.
If a field is absent or illegible, set it to null.`;

async function runDocumentProcessor({ fileBase64, fileType, documentType }) {
  const start = Date.now();

  // Handle demo/test mode with no real image
  const isDemoOrTiny = !fileBase64 || fileBase64.length < 500;

  if (isDemoOrTiny) {
    // Return realistic demo extraction
    await sleep(800); // simulate processing time
    return {
      extracted: {
        doc_type: 'Certificate of Marriage',
        bride_name: 'Priya Sharma',
        groom_name: 'Rohan Mehta',
        married_name: 'Priya Mehta',
        date: '15th March 2024',
        registration_number: 'MH/2024/3892',
        registrar: 'Government of Maharashtra, Sub-Registrar Office',
        place: 'Mumbai, Maharashtra',
        witnesses: 'Anjali Sharma, Deepak Mehta',
        official_stamps: 'Official Government Seal present, Registrar signature',
        raw_text: 'GOVERNMENT OF MAHARASHTRA\nCERTIFICATE OF MARRIAGE\nRegistration No: MH/2024/3892\nThis certifies that Priya Sharma and Rohan Mehta were lawfully united in the bond of matrimony on 15th March 2024 at Mumbai, Maharashtra in accordance with the Hindu Marriage Act, 1955.\nBride: Priya Sharma D/O Ramesh Sharma\nGroom: Rohan Mehta S/O Suresh Mehta\nPost-marriage name of bride: Priya Mehta\nWitnesses: Anjali Sharma, Deepak Mehta\nSub-Registrar: Shri V.K. Patil\nDate of Registration: 20th March 2024\nCertified True Copy'
      },
      isDemo: true,
      duration_ms: Date.now() - start
    };
  }

  // Real API call with vision
  const mediaType = fileType || 'image/jpeg';
  
  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: EXTRACTION_SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: fileBase64 }
          },
          { type: 'text', text: EXTRACTION_USER_PROMPT }
        ]
      }]
    });

    const rawText = response.content.map(c => c.text || '').join('');
    
    // Clean and parse JSON
    const cleaned = rawText
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();
    
    let extracted;
    try {
      extracted = JSON.parse(cleaned);
    } catch {
      // Attempt to extract JSON from response
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extracted = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse JSON from LLM response');
      }
    }

    return {
      extracted,
      isDemo: false,
      rawResponse: rawText,
      duration_ms: Date.now() - start
    };

  } catch (err) {
    // Fallback: return partial extraction with error flag
    return {
      extracted: {
        doc_type: documentType || 'Unknown',
        bride_name: null,
        married_name: null,
        raw_text: null
      },
      error: err.message,
      isDemo: false,
      duration_ms: Date.now() - start
    };
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

module.exports = { runDocumentProcessor };
```

## backend/agents/filenetArchiver.js
```javascript
/**
 * FileNet Archiver Agent (Mock)
 * Archives uploaded documents with metadata to a local filesystem store.
 * In production: integrates with IBM FileNet Content Manager API.
 */

const fs   = require('fs');
const path = require('path');

const STORE_PATH = process.env.FILENET_STORE_PATH
  ? path.resolve(process.env.FILENET_STORE_PATH)
  : path.join(__dirname, '../../filenet-store');

function ensureStoreExists() {
  if (!fs.existsSync(STORE_PATH)) {
    fs.mkdirSync(STORE_PATH, { recursive: true });
  }
}

function generateFileNetRef() {
  return 'FN-' + Math.random().toString(36).slice(2, 8).toUpperCase();
}

async function runFilenetArchiver({ requestId, customerId, fileBase64, fileType, fileName, extractedFields }) {
  const start = Date.now();
  ensureStoreExists();

  const ref = generateFileNetRef();
  const timestamp = new Date().toISOString();
  const folderPath = path.join(STORE_PATH, requestId);

  try {
    fs.mkdirSync(folderPath, { recursive: true });

    // Save document binary (if real file provided)
    if (fileBase64 && fileBase64.length > 500) {
      const ext = (fileName || 'doc').split('.').pop() || 'bin';
      const docPath = path.join(folderPath, `document.${ext}`);
      fs.writeFileSync(docPath, Buffer.from(fileBase64, 'base64'));
    }

    // Save metadata JSON
    const metadata = {
      filenet_ref:     ref,
      request_id:      requestId,
      customer_id:     customerId,
      file_name:       fileName,
      file_type:       fileType,
      archived_at:     timestamp,
      extracted_fields: extractedFields,
      document_class:  'ACCOUNT_CHANGE_SUPPORT',
      retention_policy: '7_YEARS',
      access_level:    'RESTRICTED'
    };
    fs.writeFileSync(
      path.join(folderPath, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );

    return {
      ref,
      folderPath,
      metadata,
      duration_ms: Date.now() - start
    };
  } catch (err) {
    // Non-fatal: log and continue with a generated ref
    return {
      ref,
      error: err.message,
      duration_ms: Date.now() - start
    };
  }
}

module.exports = { runFilenetArchiver };
```

## backend/agents/summaryAgent.js
```javascript
/**
 * Summary Agent
 * Generates a human-readable review summary for the Checker Supervisor.
 * Uses Claude to produce a factual, concise NL summary.
 */

const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SUMMARY_SYSTEM = `You are the Summary Agent for a regulated banking document verification workflow.
Your audience is a Checker Supervisor who needs to make a fast, informed approve/reject decision.
Write clearly, factually, and concisely. Use third person. No bullet points. 2-3 sentences only.
End every summary with exactly: "Recommended action: APPROVE." or "Recommended action: REVIEW." or "Recommended action: REJECT."`;

async function runSummaryAgent({
  requestId, customerId, oldName, newName,
  extracted, scoreCard, overall, recommendation,
  brideScore, marriedScore, authScore, forgeryResult,
  fileNetRef
}) {
  const start = Date.now();

  const userPrompt = `Generate a Checker review summary for the following verified request:

Request ID: ${requestId}
Customer ID: ${customerId}
Change type: Legal Name Change
Old name (requested): ${oldName}
New name (requested): ${newName}

Document extracted:
- Document type: ${extracted.doc_type || 'Marriage Certificate'}
- Bride name field: ${extracted.bride_name || 'Not found'}
- Married name field: ${extracted.married_name || 'Not found'}
- Registrar: ${extracted.registrar || 'Not specified'}
- Date: ${extracted.date || 'Not specified'}
- Registration number: ${extracted.registration_number || 'Not present'}
- Official stamps: ${extracted.official_stamps || 'Not detected'}

Confidence scores:
- Old name → Bride field match: ${brideScore}%
- New name → Married name match: ${marriedScore}%
- Document authenticity: ${authScore}%
- Forgery check: ${forgeryResult}
- Overall confidence: ${overall}%

FileNet reference: ${fileNetRef}
AI recommendation: ${recommendation}

Write the 2-3 sentence Checker summary now.`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      system: SUMMARY_SYSTEM,
      messages: [{ role: 'user', content: userPrompt }]
    });

    const summary = response.content.map(c => c.text || '').join('').trim();

    return {
      summary,
      recommendation,
      duration_ms: Date.now() - start
    };
  } catch (err) {
    // Fallback summary if API fails
    const fallback = `Marriage Certificate analysed for customer ${customerId}. `
      + `Old name field matched bride field with ${brideScore}% confidence; `
      + `new name matched married name field with ${marriedScore}% confidence. `
      + `Document authenticity scored ${authScore}%; forgery check: ${forgeryResult}. `
      + `Overall confidence: ${overall}%. `
      + `Recommended action: ${recommendation}.`;

    return {
      summary: fallback,
      recommendation,
      fallback: true,
      error: err.message,
      duration_ms: Date.now() - start
    };
  }
}

module.exports = { runSummaryAgent };
```

## backend/agents/validationAgent.js
```javascript
/**
 * Validation Agent
 * Validates intake fields against mock RPS records and checks data format.
 */

// Mock RPS customer database
const RPS_MOCK_DB = {
  C001: { id: 'C001', name: 'Priya Sharma',  status: 'active', branch: 'MH001', account: '****4821' },
  C002: { id: 'C002', name: 'Amit Verma',    status: 'active', branch: 'DL002', account: '****7734' },
  C003: { id: 'C003', name: 'Sara Thomas',   status: 'active', branch: 'KA003', account: '****2291' },
  C004: { id: 'C004', name: 'Ravi Kumar',    status: 'frozen', branch: 'TN004', account: '****6612' },
};

function normalizeName(name) {
  return (name || '').toLowerCase().trim().replace(/\s+/g, ' ');
}

async function runValidationAgent({ customerId, oldName, newName, changeType }) {
  const start = Date.now();
  const errors = [];
  const warnings = [];

  // 1. Customer ID lookup
  const rpsRecord = RPS_MOCK_DB[customerId];
  if (!rpsRecord) {
    errors.push(`Customer ID "${customerId}" not found in RPS`);
    return {
      passed: false,
      errors,
      warnings,
      rpsRecord: null,
      duration_ms: Date.now() - start
    };
  }

  // 2. Account status check
  if (rpsRecord.status === 'frozen') {
    errors.push(`Account ${customerId} is frozen — changes not permitted`);
  }
  if (rpsRecord.status === 'closed') {
    errors.push(`Account ${customerId} is closed`);
  }

  // 3. Old name match against RPS
  const rpsNameNorm = normalizeName(rpsRecord.name);
  const oldNameNorm = normalizeName(oldName);
  const nameMatches = rpsNameNorm === oldNameNorm;
  if (!nameMatches) {
    errors.push(`Old name "${oldName}" does not match RPS record "${rpsRecord.name}"`);
  }

  // 4. New name validation
  if (!newName || newName.trim().length < 2) {
    errors.push('New name must be at least 2 characters');
  }
  if (normalizeName(newName) === rpsNameNorm) {
    warnings.push('New name is the same as current name — change may be redundant');
  }

  // 5. Change type validation
  const SUPPORTED_TYPES = ['legal_name', 'address', 'dob', 'contact'];
  if (!SUPPORTED_TYPES.includes(changeType)) {
    errors.push(`Change type "${changeType}" is not supported`);
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings,
    rpsRecord,
    duration_ms: Date.now() - start
  };
}

module.exports = { runValidationAgent };
```

## backend/middleware/logger.js
```javascript
const winston = require('winston');
const { getDb } = require('../db');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
          return `[${timestamp}] ${level}: ${message}${metaStr}`;
        })
      )
    }),
    new winston.transports.File({ filename: 'iasw.log', format: winston.format.json() })
  ]
});

/**
 * Persist an audit event to the audit_log table and to winston.
 */
function auditLog(requestId, level, event, payload = {}, durationMs = null) {
  const timestamp = new Date().toISOString();

  // Write to DB
  try {
    const db = getDb();
    db.prepare(`
      INSERT INTO audit_log (request_id, timestamp, level, event, payload, duration_ms)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(requestId, timestamp, level, event, JSON.stringify(payload), durationMs);
  } catch (err) {
    logger.error('Failed to write audit log to DB', { err: err.message });
  }

  // Write to winston
  const logLevel = level === 'RPS' || level === 'HUMAN' ? 'warn' : 'info';
  logger[logLevel](event, { requestId, level, ...payload });
}

module.exports = { logger, auditLog };
```

## backend/models/auditLog.js
```javascript
const { getDb } = require('../db');

function getByRequestId(requestId) {
  const db = getDb();
  return db.prepare('SELECT * FROM audit_log WHERE request_id = ? ORDER BY log_id ASC').all(requestId);
}

function getAll({ limit = 200, offset = 0 } = {}) {
  const db = getDb();
  return db.prepare('SELECT * FROM audit_log ORDER BY log_id DESC LIMIT ? OFFSET ?').all(limit, offset);
}

module.exports = { getByRequestId, getAll };
```

## backend/models/pendingTable.js
```javascript
const { getDb } = require('../db');

function createRequest(record) {
  const db = getDb();
  db.prepare(`
    INSERT INTO pending_requests (
      request_id, change_type, customer_id, old_value, new_value,
      file_name, file_type, status, created_at
    ) VALUES (
      @request_id, @change_type, @customer_id, @old_value, @new_value,
      @file_name, @file_type, 'AI_PROCESSING', @created_at
    )
  `).run({
    ...record,
    created_at: new Date().toISOString()
  });
}

function updateAfterPipeline(requestId, updates) {
  const db = getDb();
  db.prepare(`
    UPDATE pending_requests SET
      extracted_bride     = @extracted_bride,
      extracted_married   = @extracted_married,
      extracted_doc_type  = @extracted_doc_type,
      extracted_date      = @extracted_date,
      extracted_registrar = @extracted_registrar,
      confidence_bride    = @confidence_bride,
      confidence_married  = @confidence_married,
      confidence_auth     = @confidence_auth,
      overall_confidence  = @overall_confidence,
      forgery_result      = @forgery_result,
      ai_summary          = @ai_summary,
      ai_recommendation   = @ai_recommendation,
      score_card_json     = @score_card_json,
      filenet_ref         = @filenet_ref,
      status              = 'AI_VERIFIED_PENDING_HUMAN',
      ai_completed_at     = @ai_completed_at
    WHERE request_id = @request_id
  `).run({ ...updates, request_id: requestId, ai_completed_at: new Date().toISOString() });
}

function applyCheckerDecision(requestId, decision, checkerId, notes, rpsRef) {
  const db = getDb();
  db.prepare(`
    UPDATE pending_requests SET
      checker_id       = @checker_id,
      checker_decision = @checker_decision,
      checker_notes    = @checker_notes,
      status           = @checker_decision,
      rps_write_ref    = @rps_write_ref,
      rps_written_at   = @rps_written_at,
      decided_at       = @decided_at
    WHERE request_id = @request_id
      AND status = 'AI_VERIFIED_PENDING_HUMAN'
  `).run({
    request_id:       requestId,
    checker_id:       checkerId,
    checker_decision: decision,
    checker_notes:    notes || null,
    rps_write_ref:    rpsRef || null,
    rps_written_at:   decision === 'APPROVED' ? new Date().toISOString() : null,
    decided_at:       new Date().toISOString()
  });
}

function getById(requestId) {
  const db = getDb();
  return db.prepare('SELECT * FROM pending_requests WHERE request_id = ?').get(requestId);
}

function getAll({ status, limit = 50, offset = 0 } = {}) {
  const db = getDb();
  if (status) {
    return db.prepare('SELECT * FROM pending_requests WHERE status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?').all(status, limit, offset);
  }
  return db.prepare('SELECT * FROM pending_requests ORDER BY created_at DESC LIMIT ? OFFSET ?').all(limit, offset);
}

module.exports = { createRequest, updateAfterPipeline, applyCheckerDecision, getById, getAll };
```

## backend/routes/checker.js
```javascript
/**
 * /api/checker routes
 * HITL decision endpoint — the ONLY path that can write APPROVED/REJECTED.
 * The AI pipeline has NO access to these endpoints.
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router  = express.Router();

const { getById, applyCheckerDecision } = require('../models/pendingTable');
const { getByRequestId, getAll }        = require('../models/auditLog');
const { auditLog } = require('../middleware/logger');

// Mock RPS write function
function mockRpsWrite({ customerId, oldName, newName, requestId }) {
  // In production: authenticated REST call to core banking RPS
  const rpsRef = 'RPS-' + uuidv4().slice(0, 6).toUpperCase();
  return {
    success:        true,
    rps_ref:        rpsRef,
    system:         'RPS_MOCK_v2',
    customer_id:    customerId,
    field_updated:  'legal_name',
    old_value:      oldName,
    new_value:      newName,
    triggered_by:   'HUMAN_CHECKER',
    timestamp:      new Date().toISOString()
  };
}

// ── POST /api/checker/:id/decision ─────────────────────────────────────────
// This is the ONLY way to approve or reject a request.
router.post('/:id/decision', (req, res) => {
  const { id: requestId } = req.params;
  const { decision, checker_id: checkerId, notes } = req.body;

  // Validate inputs
  if (!decision || !['APPROVED', 'REJECTED'].includes(decision)) {
    return res.status(400).json({ error: 'decision must be APPROVED or REJECTED' });
  }
  if (!checkerId) {
    return res.status(400).json({ error: 'checker_id is required' });
  }

  // Fetch current record
  const record = getById(requestId);
  if (!record) {
    return res.status(404).json({ error: 'Request not found' });
  }
  if (record.status !== 'AI_VERIFIED_PENDING_HUMAN') {
    return res.status(409).json({
      error: `Cannot decide on request with status "${record.status}"`,
      current_status: record.status
    });
  }

  let rpsResult = null;

  // Execute RPS write ONLY on approval
  if (decision === 'APPROVED') {
    rpsResult = mockRpsWrite({
      customerId: record.customer_id,
      oldName:    record.old_value,
      newName:    record.new_value,
      requestId
    });
    auditLog(requestId, 'RPS', 'Mock RPS write-call executed', rpsResult);
  }

  // Persist human decision
  applyCheckerDecision(requestId, decision, checkerId, notes, rpsResult?.rps_ref || null);

  // Audit the human decision
  auditLog(requestId, 'HUMAN', `Checker decision: ${decision}`, {
    checker_id: checkerId,
    decision,
    notes: notes || null,
    rps_ref: rpsResult?.rps_ref || null
  });

  return res.json({
    requestId,
    decision,
    checker_id:   checkerId,
    rps_result:   rpsResult,
    decided_at:   new Date().toISOString(),
    message:      decision === 'APPROVED'
      ? `RPS write executed. Name updated: ${record.old_value} → ${record.new_value}`
      : 'Request rejected. No write to RPS.'
  });
});

// ── GET /api/checker/queue ─────────────────────────────────────────────────
// Returns all pending records awaiting human review
router.get('/queue', (req, res) => {
  try {
    const { getAll: getAllRecords } = require('../models/pendingTable');
    const records = getAllRecords({ status: 'AI_VERIFIED_PENDING_HUMAN' });
    records.forEach(r => {
      if (r.score_card_json) r.score_card = JSON.parse(r.score_card_json);
    });
    res.json({ records, count: records.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/checker/audit ─────────────────────────────────────────────────
router.get('/audit', (req, res) => {
  try {
    const logs = getAll({ limit: 300 });
    res.json({ logs, count: logs.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/checker/audit/:id ─────────────────────────────────────────────
router.get('/audit/:id', (req, res) => {
  try {
    const logs = getByRequestId(req.params.id);
    res.json({ logs, requestId: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
```

## backend/routes/requests.js
```javascript
/**
 * /api/requests routes
 * Handles intake submission and pipeline orchestration.
 */

const express = require('express');
const multer  = require('multer');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

const { runValidationAgent }   = require('../agents/validationAgent');
const { runDocumentProcessor } = require('../agents/documentProcessor');
const { runConfidenceScorer }  = require('../agents/confidenceScorer');
const { runFilenetArchiver }   = require('../agents/filenetArchiver');
const { runSummaryAgent }      = require('../agents/summaryAgent');
const { createRequest, updateAfterPipeline, getById, getAll } = require('../models/pendingTable');
const { auditLog } = require('../middleware/logger');

// Multer: accept files up to 10MB in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    cb(null, allowed.includes(file.mimetype));
  }
});

// ── GET /api/requests ──────────────────────────────────────────────────────
router.get('/', (req, res) => {
  try {
    const { status, limit, offset } = req.query;
    const records = getAll({ status, limit: Number(limit) || 50, offset: Number(offset) || 0 });
    res.json({ records, total: records.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/requests/:id ──────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  try {
    const record = getById(req.params.id);
    if (!record) return res.status(404).json({ error: 'Request not found' });
    if (record.score_card_json) record.score_card = JSON.parse(record.score_card_json);
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/requests ─────────────────────────────────────────────────────
// Accepts multipart/form-data with optional document file
router.post('/', upload.single('document'), async (req, res) => {
  const requestId = 'REQ-' + uuidv4().slice(0, 8).toUpperCase();
  const startTotal = Date.now();

  const {
    customer_id: customerId,
    old_name:    oldName,
    new_name:    newName,
    change_type: changeType = 'legal_name',
    doc_type:    docType    = 'marriage_certificate'
  } = req.body;

  // Basic input validation
  if (!customerId || !oldName || !newName) {
    return res.status(400).json({ error: 'customer_id, old_name, and new_name are required' });
  }

  // Prepare file data
  let fileBase64 = null;
  let fileType   = null;
  let fileName   = null;
  if (req.file) {
    fileBase64 = req.file.buffer.toString('base64');
    fileType   = req.file.mimetype;
    fileName   = req.file.originalname;
  } else if (req.body.file_base64) {
    // Also accept base64 in JSON body (for frontend that sends JSON)
    fileBase64 = req.body.file_base64;
    fileType   = req.body.file_type || 'image/jpeg';
    fileName   = req.body.file_name || 'document';
  }

  // Stage initial record
  createRequest({ request_id: requestId, change_type: changeType, customer_id: customerId, old_value: oldName, new_value: newName, file_name: fileName, file_type: fileType });
  auditLog(requestId, 'INFO', 'New request received', { customerId, changeType, oldName, newName, hasDocument: !!fileBase64 });

  // Respond immediately so client gets requestId, then pipeline runs async
  res.status(202).json({ requestId, status: 'AI_PROCESSING', message: 'Pipeline started' });

  // ── Run pipeline async ──────────────────────────────────────────────────
  try {
    // Step 1 — Validation Agent
    auditLog(requestId, 'AGENT', 'Validation Agent started');
    const t1 = Date.now();
    const validation = await runValidationAgent({ customerId, oldName, newName, changeType });
    auditLog(requestId, 'AGENT', 'Validation Agent complete', {
      passed: validation.passed, errors: validation.errors, warnings: validation.warnings
    }, Date.now() - t1);

    if (!validation.passed) {
      auditLog(requestId, 'INFO', 'Pipeline halted — validation failed', { errors: validation.errors });
      return; // Record stays in AI_PROCESSING — frontend polls and sees no transition
    }

    // Step 2 — Document Processor
    auditLog(requestId, 'AGENT', 'Document Processor started');
    const t2 = Date.now();
    const docResult = await runDocumentProcessor({ fileBase64, fileType, documentType: docType });
    const extracted = docResult.extracted;
    auditLog(requestId, 'AGENT', 'Document Processor complete', {
      docType: extracted.doc_type, fieldCount: Object.keys(extracted).filter(k => extracted[k]).length, isDemo: docResult.isDemo
    }, docResult.duration_ms);

    // Step 3 — Confidence Scorer
    auditLog(requestId, 'AGENT', 'Confidence Scorer started');
    const t3 = Date.now();
    const scoring = runConfidenceScorer({ extracted, oldName, newName });
    auditLog(requestId, 'AGENT', 'Confidence Scorer complete', {
      overall: scoring.overall, recommendation: scoring.recommendation,
      brideScore: scoring.brideScore, marriedScore: scoring.marriedScore, forgery: scoring.forgeryResult
    }, scoring.duration_ms);

    // Step 4 — FileNet Archiver
    auditLog(requestId, 'AGENT', 'FileNet Archiver started');
    const t4 = Date.now();
    const archival = await runFilenetArchiver({
      requestId, customerId, fileBase64, fileType, fileName, extractedFields: extracted
    });
    auditLog(requestId, 'AGENT', 'FileNet Archiver complete', { ref: archival.ref }, archival.duration_ms);

    // Step 5 — Summary Agent
    auditLog(requestId, 'AGENT', 'Summary Agent started');
    const t5 = Date.now();
    const summary = await runSummaryAgent({
      requestId, customerId, oldName, newName, extracted,
      scoreCard: scoring.scoreCard, overall: scoring.overall,
      recommendation: scoring.recommendation,
      brideScore: scoring.brideScore, marriedScore: scoring.marriedScore,
      authScore: scoring.authScore, forgeryResult: scoring.forgeryResult,
      fileNetRef: archival.ref
    });
    auditLog(requestId, 'AGENT', 'Summary Agent complete', {
      recommendation: summary.recommendation, fallback: summary.fallback || false
    }, summary.duration_ms);

    // Step 6 — Stage to Pending Table
    updateAfterPipeline(requestId, {
      extracted_bride:     extracted.bride_name,
      extracted_married:   extracted.married_name,
      extracted_doc_type:  extracted.doc_type,
      extracted_date:      extracted.date,
      extracted_registrar: extracted.registrar,
      confidence_bride:    scoring.brideScore,
      confidence_married:  scoring.marriedScore,
      confidence_auth:     scoring.authScore,
      overall_confidence:  scoring.overall,
      forgery_result:      scoring.forgeryResult,
      ai_summary:          summary.summary,
      ai_recommendation:   summary.recommendation,
      score_card_json:     JSON.stringify(scoring.scoreCard),
      filenet_ref:         archival.ref
    });

    auditLog(requestId, 'INFO', 'Pipeline complete — staged to pending table', {
      status: 'AI_VERIFIED_PENDING_HUMAN', overall: scoring.overall, fileNetRef: archival.ref,
      totalDuration_ms: Date.now() - startTotal
    });

  } catch (err) {
    auditLog(requestId, 'INFO', 'Pipeline error', { error: err.message, stack: err.stack });
  }
});

module.exports = router;
```

## frontend/index.html
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>IASW — Intelligent Account Servicing Workflow</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

## frontend/package.json
```json
{
  "name": "iasw-frontend",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.3",
    "vite": "^5.3.1"
  }
}
```

## frontend/postcss.config.js
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};
```

## frontend/tailwind.config.js
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          900: '#312e81',
        }
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        slideIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      }
    }
  },
  plugins: []
};
```

## frontend/vite.config.js
```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
});
```

## frontend/src/App.jsx
```jsx
import React, { useState, useEffect } from 'react';
import Topbar from './components/Topbar.jsx';
import IntakePage from './pages/IntakePage.jsx';
import CheckerPage from './pages/CheckerPage.jsx';
import AuditPage from './pages/AuditPage.jsx';
import { healthCheck } from './lib/api.js';

export default function App() {
  const [activeTab, setActiveTab]       = useState('intake');
  const [backendOk, setBackendOk]       = useState(false);
  const [latestRecord, setLatestRecord] = useState(null);

  // Check backend connectivity
  useEffect(() => {
    healthCheck()
      .then(() => setBackendOk(true))
      .catch(() => setBackendOk(false));
  }, []);

  function handleTabChange(tab) {
    setActiveTab(tab);
  }

  function handleRequestComplete(record) {
    setLatestRecord(record);
    // Auto-switch to checker tab after pipeline completes
    // (small delay so user sees the "pipeline complete" banner first)
    setTimeout(() => setActiveTab('checker'), 1800);
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Topbar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        backendOk={backendOk}
      />

      {/* Backend offline warning */}
      {!backendOk && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-2 text-sm text-red-700 flex items-center gap-2 shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          Backend not reachable. Start the backend server: <code className="font-mono bg-red-100 px-1.5 py-0.5 rounded">cd backend && npm run dev</code>
        </div>
      )}

      {/* Pages */}
      <div className="flex flex-1 overflow-hidden">
        {activeTab === 'intake'  && <IntakePage onRequestComplete={handleRequestComplete} />}
        {activeTab === 'checker' && <CheckerPage latestRecord={latestRecord} />}
        {activeTab === 'audit'   && <AuditPage />}
      </div>
    </div>
  );
}
```

## frontend/src/index.css
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    box-sizing: border-box;
  }

  html {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  body {
    @apply bg-slate-50 text-slate-900 font-sans;
    min-height: 100vh;
  }

  ::-webkit-scrollbar {
    width: 5px;
    height: 5px;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  ::-webkit-scrollbar-thumb {
    @apply bg-slate-200 rounded-full;
  }
  ::-webkit-scrollbar-thumb:hover {
    @apply bg-slate-300;
  }
}

@layer components {
  .card {
    @apply bg-white border border-slate-200 rounded-xl p-5;
  }

  .card-title {
    @apply text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4;
  }

  .btn {
    @apply inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
           transition-all duration-150 cursor-pointer border-0 disabled:opacity-40
           disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-1;
  }

  .btn-primary {
    @apply btn bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500
           disabled:hover:bg-indigo-600;
  }

  .btn-success {
    @apply btn bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500;
  }

  .btn-danger {
    @apply btn bg-red-600 text-white hover:bg-red-700 focus:ring-red-500;
  }

  .btn-outline {
    @apply btn border border-slate-200 bg-white text-slate-700 hover:bg-slate-50
           focus:ring-slate-300;
  }

  .field-label {
    @apply block text-xs font-medium text-slate-500 mb-1.5;
  }

  .field-input {
    @apply w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white
           text-slate-900 placeholder-slate-400 transition-colors duration-150
           focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent;
  }

  .badge {
    @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold;
  }

  .badge-pass    { @apply badge bg-emerald-50 text-emerald-700; }
  .badge-flag    { @apply badge bg-amber-50 text-amber-700; }
  .badge-fail    { @apply badge bg-red-50 text-red-700; }
  .badge-pending { @apply badge bg-indigo-50 text-indigo-700; }
  .badge-human   { @apply badge bg-purple-50 text-purple-700; }

  .status-pill {
    @apply inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold;
  }
}

/* Step icon spin */
@keyframes spin-slow {
  to { transform: rotate(360deg); }
}
.spin-slow {
  animation: spin-slow 1s linear infinite;
}

/* Log fade in */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}
.log-entry {
  animation: fadeUp 0.2s ease-out;
}
```

## frontend/src/main.jsx
```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

## frontend/src/components/ConfidenceScoreCard.jsx
```jsx
import React from 'react';

const RESULT_STYLES = {
  PASS: 'badge-pass',
  FLAG: 'badge-flag',
  FAIL: 'badge-fail',
};

const BAR_COLORS = {
  PASS: 'bg-emerald-500',
  FLAG: 'bg-amber-400',
  FAIL: 'bg-red-400',
};

function ScoreBar({ score, result }) {
  if (score === null || score === undefined) return null;
  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${BAR_COLORS[result] || 'bg-slate-300'}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={`text-xs font-semibold min-w-[34px] text-right ${
        result === 'PASS' ? 'text-emerald-600' : result === 'FLAG' ? 'text-amber-600' : 'text-red-600'
      }`}>
        {score}%
      </span>
    </div>
  );
}

export default function ConfidenceScoreCard({ scoreCard, overall }) {
  if (!scoreCard?.length) return null;

  const overallResult = overall >= 80 ? 'PASS' : overall >= 60 ? 'FLAG' : 'FAIL';

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      {scoreCard.map((row, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 last:border-0"
        >
          <span className="text-sm text-slate-700 w-48 shrink-0">{row.field}</span>
          <ScoreBar score={row.score} result={row.result} />
          <span className={`badge ${RESULT_STYLES[row.result] || 'badge-pending'} shrink-0`}>
            {row.result}
          </span>
        </div>
      ))}

      {/* Overall row */}
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-t border-slate-200">
        <span className="text-sm font-semibold text-slate-800 w-48 shrink-0">Overall confidence</span>
        <ScoreBar score={overall} result={overallResult} />
        <span className={`badge ${RESULT_STYLES[overallResult]} shrink-0 font-bold`}>
          {overall}%
        </span>
      </div>
    </div>
  );
}
```

## frontend/src/components/FileUpload.jsx
```jsx
import React, { useRef, useState } from 'react';

export default function FileUpload({ onFile, file }) {
  const inputRef   = useRef(null);
  const [drag, setDrag] = useState(false);

  function readFile(f) {
    if (!f) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    if (!allowed.includes(f.type)) {
      alert('Please upload a JPG, PNG, WEBP, GIF, or PDF file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result.split(',')[1];
      onFile({ base64, type: f.type, name: f.name, size: f.size });
    };
    reader.readAsDataURL(f);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDrag(false);
    readFile(e.dataTransfer.files[0]);
  }

  function handleDemoDoc() {
    // A tiny but valid 1×1 white PNG
    const demoBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==';
    onFile({
      base64: demoBase64,
      type:   'image/png',
      name:   'marriage_certificate_demo.png',
      size:   68,
      isDemo: true
    });
  }

  return (
    <div className="space-y-3">
      <div
        className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-colors duration-150 cursor-pointer
          ${drag ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'}`}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => readFile(e.target.files[0])}
        />
        <div className="flex flex-col items-center gap-2">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${drag ? 'bg-indigo-100' : 'bg-slate-100'}`}>
            <svg className={`w-5 h-5 ${drag ? 'text-indigo-600' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700">Click to upload or drag & drop</p>
            <p className="text-xs text-slate-400 mt-0.5">Marriage Certificate — JPG, PNG, or PDF · max 10MB</p>
          </div>
        </div>
      </div>

      {/* File selected indicator */}
      {file && (
        <div className="flex items-center gap-2.5 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
          <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-sm font-medium text-emerald-800 truncate flex-1">{file.name}</span>
          {file.isDemo && (
            <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-medium shrink-0">demo</span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onFile(null); }}
            className="text-emerald-500 hover:text-emerald-700 shrink-0"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Demo shortcut */}
      {!file && (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-slate-100" />
          <span className="text-xs text-slate-400">or</span>
          <div className="flex-1 h-px bg-slate-100" />
        </div>
      )}
      {!file && (
        <button
          type="button"
          onClick={handleDemoDoc}
          className="w-full btn-outline text-sm py-2 justify-center"
        >
          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
          Use demo document (pre-built sample)
        </button>
      )}
    </div>
  );
}
```

## frontend/src/components/PipelineTrace.jsx
```jsx
import React from 'react';

const STEPS = [
  { id: 'validate', label: 'Validation Agent',         sub: 'Cross-references intake fields against RPS records' },
  { id: 'ocr',      label: 'Document Processor (OCR)', sub: 'Claude Vision extraction of document fields' },
  { id: 'score',    label: 'Confidence Scorer',        sub: 'Field-level match scoring & forgery check' },
  { id: 'filenet',  label: 'FileNet Archiver',         sub: 'Archives document to mock FileNet store' },
  { id: 'summary',  label: 'Summary Agent',            sub: 'Generates human-readable Checker summary' },
  { id: 'staged',   label: 'Staged to Pending Table',  sub: 'Status: AI_VERIFIED_PENDING_HUMAN' },
];

function StepIcon({ state }) {
  if (state === 'done') {
    return (
      <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
        <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  }
  if (state === 'running') {
    return (
      <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0">
        <svg className="w-4 h-4 text-indigo-600 spin-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </div>
    );
  }
  if (state === 'failed') {
    return (
      <div className="w-8 h-8 rounded-full bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
        <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
      <div className="w-2 h-2 rounded-full bg-slate-300" />
    </div>
  );
}

export default function PipelineTrace({ stepStates, stepOutputs }) {
  return (
    <div className="flex flex-col">
      {STEPS.map((step, i) => {
        const state  = stepStates?.[step.id]  || 'waiting';
        const output = stepOutputs?.[step.id];
        const isLast = i === STEPS.length - 1;

        return (
          <div key={step.id} className="flex gap-3">
            {/* Icon + connector */}
            <div className="flex flex-col items-center">
              <StepIcon state={state} />
              {!isLast && (
                <div className={`w-px flex-1 my-1 ${state === 'done' ? 'bg-emerald-200' : 'bg-slate-100'}`} />
              )}
            </div>

            {/* Content */}
            <div className={`pb-4 flex-1 min-w-0 ${isLast ? '' : ''}`}>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-sm font-medium ${
                  state === 'done'    ? 'text-slate-800' :
                  state === 'running' ? 'text-indigo-700' :
                  state === 'failed'  ? 'text-red-700' :
                  'text-slate-400'
                }`}>
                  {step.label}
                </span>
                {state === 'running' && (
                  <span className="text-xs text-indigo-500 font-mono animate-pulse">processing…</span>
                )}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">{step.sub}</div>

              {output && (
                <div className="mt-2 bg-slate-50 border border-slate-100 rounded-lg p-2.5 font-mono text-xs text-slate-600 whitespace-pre-wrap max-h-36 overflow-y-auto leading-relaxed">
                  {output}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

## frontend/src/components/Topbar.jsx
```jsx
import React from 'react';

const TABS = [
  { id: 'intake',   label: 'Intake & Processing' },
  { id: 'checker',  label: 'Checker Review' },
  { id: 'audit',    label: 'Audit & Records' },
];

export default function Topbar({ activeTab, onTabChange, backendOk }) {
  return (
    <header className="bg-white border-b border-slate-200 px-6 h-14 flex items-center gap-4 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-900 leading-none">IASW</div>
          <div className="text-[10px] text-slate-400 leading-none mt-0.5">Intelligent Account Servicing</div>
        </div>
      </div>

      <div className="w-px h-6 bg-slate-200 mx-1" />

      {/* Tabs */}
      <nav className="flex gap-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
              activeTab === tab.id
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-2.5">
        {/* Backend status */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <div className={`w-1.5 h-1.5 rounded-full ${backendOk ? 'bg-emerald-500' : 'bg-red-400'}`} />
          {backendOk ? 'Backend connected' : 'Backend offline'}
        </div>
        <div className="w-px h-4 bg-slate-200" />
        {/* Checker identity (mock) */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-semibold text-indigo-700">
            CK
          </div>
          <div className="text-xs">
            <div className="font-medium text-slate-700">Checker Supervisor</div>
            <div className="text-slate-400">checker_01</div>
          </div>
        </div>
      </div>
    </header>
  );
}
```

## frontend/src/hooks/usePolling.js
```javascript
import { useEffect, useRef, useCallback } from 'react';
import { getRequest } from '../lib/api';

const TERMINAL_STATUSES = ['AI_VERIFIED_PENDING_HUMAN', 'APPROVED', 'REJECTED'];

/**
 * Polls a request by ID every `intervalMs` ms until it reaches a terminal status.
 * Calls onUpdate with the latest record on each poll.
 * Calls onComplete when terminal status reached.
 */
export function usePolling({ requestId, onUpdate, onComplete, onError, intervalMs = 2000, enabled = true }) {
  const timerRef    = useRef(null);
  const activeRef   = useRef(false);
  const requestRef  = useRef(requestId);
  requestRef.current = requestId;

  const stop = useCallback(() => {
    activeRef.current = false;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const poll = useCallback(async () => {
    if (!activeRef.current || !requestRef.current) return;
    try {
      const record = await getRequest(requestRef.current);
      onUpdate?.(record);
      if (TERMINAL_STATUSES.includes(record.status)) {
        stop();
        onComplete?.(record);
      } else if (activeRef.current) {
        timerRef.current = setTimeout(poll, intervalMs);
      }
    } catch (err) {
      onError?.(err);
      // Keep polling on transient errors
      if (activeRef.current) {
        timerRef.current = setTimeout(poll, intervalMs * 2);
      }
    }
  }, [onUpdate, onComplete, onError, intervalMs, stop]);

  useEffect(() => {
    if (!requestId || !enabled) return;
    activeRef.current = true;
    timerRef.current  = setTimeout(poll, 800); // first poll after short delay
    return stop;
  }, [requestId, enabled, poll, stop]);

  return { stop };
}
```

## frontend/src/lib/api.js
```javascript
const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// Submit a new change request (sends as JSON with optional base64 file)
export async function submitRequest({ customerId, oldName, newName, changeType, fileBase64, fileType, fileName }) {
  return request('/requests', {
    method: 'POST',
    body: JSON.stringify({
      customer_id:  customerId,
      old_name:     oldName,
      new_name:     newName,
      change_type:  changeType || 'legal_name',
      file_base64:  fileBase64,
      file_type:    fileType,
      file_name:    fileName,
    }),
  });
}

// Poll a request by ID
export async function getRequest(requestId) {
  return request(`/requests/${requestId}`);
}

// Get all requests (with optional status filter)
export async function getRequests(status) {
  const qs = status ? `?status=${status}` : '';
  return request(`/requests${qs}`);
}

// Submit checker decision
export async function submitDecision({ requestId, decision, checkerId, notes }) {
  return request(`/checker/${requestId}/decision`, {
    method: 'POST',
    body: JSON.stringify({ decision, checker_id: checkerId, notes }),
  });
}

// Get checker queue (AI_VERIFIED_PENDING_HUMAN)
export async function getCheckerQueue() {
  return request('/checker/queue');
}

// Get full audit log
export async function getAuditLog() {
  return request('/checker/audit');
}

// Get audit log for a specific request
export async function getRequestAudit(requestId) {
  return request(`/checker/audit/${requestId}`);
}

// Health check
export async function healthCheck() {
  return request('/health');
}
```

## frontend/src/pages/AuditPage.jsx
```jsx
import React, { useState, useEffect, useCallback } from 'react';
import { getAuditLog, getRequests } from '../lib/api.js';

const STATUS_STYLES = {
  AI_PROCESSING:              'bg-indigo-50 text-indigo-700',
  AI_VERIFIED_PENDING_HUMAN:  'bg-purple-50 text-purple-700',
  APPROVED:                   'bg-emerald-50 text-emerald-700',
  REJECTED:                   'bg-red-50 text-red-700',
};

const LOG_LEVEL_STYLES = {
  INFO:  { dot: 'bg-slate-400',   label: 'text-slate-500',   msg: 'text-slate-600' },
  AGENT: { dot: 'bg-indigo-400',  label: 'text-indigo-600',  msg: 'text-slate-700' },
  HUMAN: { dot: 'bg-amber-400',   label: 'text-amber-600',   msg: 'text-slate-800 font-medium' },
  RPS:   { dot: 'bg-red-400',     label: 'text-red-600',     msg: 'text-slate-800 font-medium' },
};

function StatusPill({ status }) {
  const cls = STATUS_STYLES[status] || 'bg-slate-100 text-slate-600';
  return <span className={`status-pill ${cls} text-xs`}>{status}</span>;
}

function LogEntry({ log }) {
  const [open, setOpen] = useState(false);
  const styles = LOG_LEVEL_STYLES[log.level] || LOG_LEVEL_STYLES.INFO;
  let payload = null;
  try { payload = log.payload ? JSON.parse(log.payload) : null; } catch {}

  return (
    <div className="log-entry border-b border-slate-50 last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left"
      >
        <div className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${styles.dot}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-semibold uppercase tracking-wide ${styles.label}`}>{log.level}</span>
            <span className="text-xs font-mono text-slate-400">{log.timestamp?.slice(11, 23)}</span>
            {log.request_id && <span className="text-xs font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{log.request_id}</span>}
            {log.duration_ms && <span className="text-xs text-slate-400">{log.duration_ms}ms</span>}
          </div>
          <div className={`text-sm mt-0.5 ${styles.msg}`}>{log.event}</div>
        </div>
        {payload && (
          <svg className={`w-3.5 h-3.5 text-slate-300 mt-1.5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        )}
      </button>
      {open && payload && (
        <div className="px-4 pb-3 ml-4.5">
          <pre className="text-xs bg-slate-900 text-slate-300 rounded-lg p-3 overflow-x-auto leading-relaxed">
            {JSON.stringify(payload, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default function AuditPage() {
  const [logs, setLogs]           = useState([]);
  const [records, setRecords]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('ALL');
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [auditRes, recordsRes] = await Promise.all([getAuditLog(), getRequests()]);
      setLogs(auditRes.logs || []);
      setRecords(recordsRes.records || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load, refreshKey]);

  const LEVELS = ['ALL', 'INFO', 'AGENT', 'HUMAN', 'RPS'];
  const filteredLogs = filter === 'ALL' ? logs : logs.filter(l => l.level === filter);

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* LEFT — Pending table */}
      <div className="w-[480px] shrink-0 border-r border-slate-200 overflow-y-auto p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Pending Table</h2>
            <p className="text-xs text-slate-400 mt-0.5">{records.length} total records</p>
          </div>
          <button onClick={() => setRefreshKey(k => k + 1)} className="btn-outline text-xs py-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />)}
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p className="text-sm">No records yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {records.map(r => (
              <div key={r.request_id} className="bg-white border border-slate-200 rounded-xl p-3.5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="font-mono text-xs text-slate-500">{r.request_id}</div>
                  <StatusPill status={r.status} />
                </div>
                <div className="text-sm font-medium text-slate-800 mb-1">
                  {r.old_value} <span className="text-slate-400">→</span> {r.new_value}
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-slate-500">Customer: <span className="font-mono text-slate-700">{r.customer_id}</span></div>
                  {r.overall_confidence != null && (
                    <div className="text-slate-500">Conf: <span className={`font-bold ${
                      r.overall_confidence >= 80 ? 'text-emerald-600' :
                      r.overall_confidence >= 60 ? 'text-amber-600' : 'text-red-600'
                    }`}>{r.overall_confidence}%</span></div>
                  )}
                  {r.filenet_ref && (
                    <div className="text-slate-500">FileNet: <span className="font-mono text-slate-700">{r.filenet_ref}</span></div>
                  )}
                </div>
                {r.checker_decision && (
                  <div className="mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
                    Decided by <span className="font-medium">{r.checker_id}</span> · {new Date(r.decided_at).toLocaleString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT — Audit log */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Structured Audit Log</h2>
            <p className="text-xs text-slate-400 mt-0.5">{filteredLogs.length} entries</p>
          </div>
          <div className="flex gap-1">
            {LEVELS.map(l => (
              <button
                key={l}
                onClick={() => setFilter(l)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  filter === l ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-1">
              {[1,2,3,4,5].map(i => <div key={i} className="h-10 bg-slate-100 rounded-lg animate-pulse" />)}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <p className="text-sm">No log entries yet</p>
            </div>
          ) : (
            <div>
              {[...filteredLogs].reverse().map(log => (
                <LogEntry key={log.log_id} log={log} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

## frontend/src/pages/CheckerPage.jsx
```jsx
import React, { useState, useEffect } from 'react';
import ConfidenceScoreCard from '../components/ConfidenceScoreCard.jsx';
import { getCheckerQueue, submitDecision } from '../lib/api.js';

const CHECKER_ID = 'checker_01';

function MetaItem({ label, value, mono }) {
  return (
    <div className="bg-slate-50 rounded-lg p-3">
      <div className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">{label}</div>
      <div className={`text-sm font-medium text-slate-800 ${mono ? 'font-mono' : ''}`}>{value || '—'}</div>
    </div>
  );
}

function RecBadge({ recommendation }) {
  if (recommendation === 'APPROVE') return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-sm font-semibold">
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      Recommended: Approve
    </span>
  );
  if (recommendation === 'REJECT') return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-sm font-semibold">
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
      Recommended: Reject
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-sm font-semibold">
      ⚠ Recommended: Manual Review
    </span>
  );
}

export default function CheckerPage({ latestRecord }) {
  const [queue, setQueue]         = useState([]);
  const [selected, setSelected]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [deciding, setDeciding]   = useState(false);
  const [notes, setNotes]         = useState('');
  const [decision, setDecision]   = useState(null); // { decision, rps_result, message }
  const [refreshKey, setRefreshKey] = useState(0);

  // Load queue
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { records } = await getCheckerQueue();
        setQueue(records);
        // Auto-select first or the latest completed record
        if (records.length > 0) {
          const target = latestRecord
            ? records.find(r => r.request_id === latestRecord.request_id) || records[0]
            : records[0];
          setSelected(target);
        } else if (latestRecord) {
          setSelected(null);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [refreshKey, latestRecord?.request_id]);

  async function handleDecision(dec) {
    if (!selected || deciding) return;
    setDeciding(true);
    try {
      const result = await submitDecision({
        requestId: selected.request_id,
        decision:  dec,
        checkerId: CHECKER_ID,
        notes:     notes || undefined,
      });
      setDecision(result);
      setQueue(q => q.filter(r => r.request_id !== selected.request_id));
    } catch (err) {
      alert('Decision failed: ' + err.message);
    } finally {
      setDeciding(false);
    }
  }

  const scoreCard = selected?.score_card || (selected?.score_card_json ? JSON.parse(selected.score_card_json) : null);

  // Empty state
  if (!loading && queue.length === 0 && !decision) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-slate-500 font-medium">No requests pending review</p>
          <p className="text-sm text-slate-400 mt-1">Submit a request on the Intake tab to populate the queue.</p>
          <button className="btn-outline mt-4 text-sm" onClick={() => setRefreshKey(k => k + 1)}>
            Refresh queue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* LEFT — Queue list */}
      <div className="w-72 shrink-0 border-r border-slate-200 overflow-y-auto">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-700">Review Queue</div>
            <div className="text-xs text-slate-400">{queue.length} pending</div>
          </div>
          <button onClick={() => setRefreshKey(k => k + 1)} className="text-slate-400 hover:text-slate-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {loading && (
          <div className="p-4 space-y-2">
            {[1,2].map(i => (
              <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        )}

        {queue.map(record => {
          const conf = record.overall_confidence;
          const confColor = conf >= 80 ? 'text-emerald-600' : conf >= 60 ? 'text-amber-600' : 'text-red-600';
          return (
            <button
              key={record.request_id}
              onClick={() => { setSelected(record); setDecision(null); setNotes(''); }}
              className={`w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                selected?.request_id === record.request_id ? 'bg-indigo-50 border-l-2 border-l-indigo-500' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-mono text-slate-500">{record.request_id}</span>
                <span className={`text-xs font-bold ${confColor}`}>{conf}%</span>
              </div>
              <div className="text-sm font-medium text-slate-800 truncate">
                {record.old_value} → {record.new_value}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">{record.customer_id} · {new Date(record.created_at).toLocaleTimeString()}</div>
            </button>
          );
        })}
      </div>

      {/* RIGHT — Review panel */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Post-decision banner */}
        {decision && (
          <div className={`flex items-start gap-3 p-4 rounded-xl border ${
            decision.decision === 'APPROVED'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {decision.decision === 'APPROVED'
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              }
            </svg>
            <div>
              <div className="font-semibold">{decision.message}</div>
              {decision.rps_result && (
                <div className="text-xs mt-1 font-mono opacity-75">RPS ref: {decision.rps_result.rps_ref} · {decision.rps_result.timestamp}</div>
              )}
            </div>
          </div>
        )}

        {selected && !decision && (
          <>
            {/* AI summary */}
            <div className="card">
              <div className="card-title">AI-Generated Review Summary</div>
              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-sm text-indigo-900 leading-relaxed mb-3">
                {selected.ai_summary || 'Summary not available.'}
              </div>
              <RecBadge recommendation={selected.ai_recommendation} />
            </div>

            {/* Score card */}
            {scoreCard && (
              <div className="card">
                <div className="card-title">Confidence Score Card</div>
                <ConfidenceScoreCard scoreCard={scoreCard} overall={selected.overall_confidence} />
              </div>
            )}

            {/* Metadata */}
            <div className="card">
              <div className="card-title">Request Metadata</div>
              <div className="grid grid-cols-2 gap-2">
                <MetaItem label="Request ID"    value={selected.request_id}  mono />
                <MetaItem label="Customer ID"   value={selected.customer_id} mono />
                <MetaItem label="Old name"      value={selected.old_value} />
                <MetaItem label="New name"      value={selected.new_value} />
                <MetaItem label="FileNet ref"   value={selected.filenet_ref} mono />
                <MetaItem label="Submitted"     value={new Date(selected.created_at).toLocaleString()} />
                <MetaItem label="Extracted bride" value={selected.extracted_bride} />
                <MetaItem label="Extracted married" value={selected.extracted_married} />
              </div>
            </div>

            {/* HITL decision panel */}
            <div className="card border-2 border-red-100">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <div className="text-xs font-semibold text-red-600 uppercase tracking-wider">
                  HITL Boundary — Human Decision Required
                </div>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed mb-4">
                The AI has staged this request with status <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono text-slate-700">AI_VERIFIED_PENDING_HUMAN</code>.
                No write to RPS has been made. You must explicitly approve or reject below.
              </p>

              {/* Optional notes */}
              <div className="mb-4">
                <label className="field-label">Checker Notes (optional)</label>
                <textarea
                  className="field-input resize-none"
                  rows={2}
                  placeholder="Add rejection reason or notes…"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

              <div className="flex gap-3">
                <button
                  className="btn-success flex-1 justify-center py-2.5 text-base"
                  disabled={deciding}
                  onClick={() => handleDecision('APPROVED')}
                >
                  {deciding ? (
                    <svg className="w-4 h-4 spin-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  Approve & Write to RPS
                </button>
                <button
                  className="btn-danger flex-1 justify-center py-2.5 text-base"
                  disabled={deciding}
                  onClick={() => handleDecision('REJECTED')}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Reject
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

## frontend/src/pages/IntakePage.jsx
```jsx
import React, { useState, useCallback } from 'react';
import FileUpload from '../components/FileUpload.jsx';
import PipelineTrace from '../components/PipelineTrace.jsx';
import ConfidenceScoreCard from '../components/ConfidenceScoreCard.jsx';
import { submitRequest } from '../lib/api.js';
import { usePolling } from '../hooks/usePolling.js';

const DEFAULT_FORM = {
  customerId: 'C001',
  oldName:    'Priya Sharma',
  newName:    'Priya Mehta',
  changeType: 'legal_name',
  docType:    'marriage_certificate',
};

// Maps pipeline status → which steps are "done"
function deriveStepStates(record, localSteps) {
  if (!record) return localSteps || {};
  if (record.status === 'AI_VERIFIED_PENDING_HUMAN' || record.status === 'APPROVED' || record.status === 'REJECTED') {
    return { validate: 'done', ocr: 'done', score: 'done', filenet: 'done', summary: 'done', staged: 'done' };
  }
  return localSteps || {};
}

export default function IntakePage({ onRequestComplete }) {
  const [form, setForm]             = useState(DEFAULT_FORM);
  const [file, setFile]             = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState(null);
  const [requestId, setRequestId]   = useState(null);
  const [record, setRecord]         = useState(null);
  const [stepStates, setStepStates] = useState({});
  const [stepOutputs, setStepOutputs] = useState({});

  // Simulate visual step progression while polling
  const advanceSteps = useCallback((currentRecord) => {
    if (!currentRecord) return;
    const s = currentRecord.status;
    if (s === 'AI_VERIFIED_PENDING_HUMAN') {
      setStepStates({ validate: 'done', ocr: 'done', score: 'done', filenet: 'done', summary: 'done', staged: 'done' });
      setStepOutputs(prev => ({
        ...prev,
        validate: `RPS record found. Old name match: ✓\nStatus: active`,
        ocr:      currentRecord.extracted_bride
          ? `doc_type: "${currentRecord.extracted_doc_type}"\nbride_name: "${currentRecord.extracted_bride}"\nmarried_name: "${currentRecord.extracted_married}"\nregistrar: "${currentRecord.extracted_registrar}"\ndate: "${currentRecord.extracted_date}"`
          : `Extraction complete (demo mode)`,
        score:    `Overall confidence: ${currentRecord.overall_confidence}%\nbride match: ${currentRecord.confidence_bride}%\nmarried match: ${currentRecord.confidence_married}%\nauth: ${currentRecord.confidence_auth}%\nforgery: ${currentRecord.forgery_result}`,
        filenet:  `Archived → ${currentRecord.filenet_ref}`,
        summary:  currentRecord.ai_summary,
        staged:   `request_id: ${currentRecord.request_id}\nstatus: AI_VERIFIED_PENDING_HUMAN\nfilenet_ref: ${currentRecord.filenet_ref}`,
      }));
    }
  }, []);

  // Poll for pipeline completion
  usePolling({
    requestId,
    enabled: !!requestId && !record?.overall_confidence,
    intervalMs: 2500,
    onUpdate: (r) => {
      setRecord(r);
      advanceSteps(r);
    },
    onComplete: (r) => {
      setRecord(r);
      advanceSteps(r);
      onRequestComplete?.(r);
      setSubmitting(false);
    },
    onError: () => setSubmitting(false),
  });

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) return setError('Please upload or select a supporting document.');
    setError(null);
    setSubmitting(true);
    setRecord(null);
    setRequestId(null);
    setStepStates({ validate: 'running' });
    setStepOutputs({});

    try {
      const res = await submitRequest({
        customerId: form.customerId,
        oldName:    form.oldName,
        newName:    form.newName,
        changeType: form.changeType,
        fileBase64: file.base64,
        fileType:   file.type,
        fileName:   file.name,
      });
      setRequestId(res.requestId);

      // Animate steps with realistic timing
      const delays = { validate: 800, ocr: 2200, score: 3800, filenet: 5000, summary: 6400 };
      Object.entries(delays).forEach(([step, delay]) => {
        setTimeout(() => setStepStates(prev => ({ ...prev, [step]: 'running' })), delay - 400);
        setTimeout(() => setStepStates(prev => ({ ...prev, [step]: 'done',
          ...( step !== 'staged' ? { [Object.keys(delays)[Object.keys(delays).indexOf(step) + 1]]: 'running' } : {})
        })), delay);
      });
      setTimeout(() => setStepStates(prev => ({ ...prev, staged: 'done' })), 7400);

    } catch (err) {
      setError(err.message);
      setSubmitting(false);
      setStepStates({});
    }
  }

  const isComplete = record?.status === 'AI_VERIFIED_PENDING_HUMAN';
  const scoreCard  = record?.score_card || (record?.score_card_json ? JSON.parse(record.score_card_json) : null);

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* LEFT — Intake form */}
      <div className="w-[420px] shrink-0 border-r border-slate-200 overflow-y-auto p-6 space-y-4">

        {/* Notice */}
        <div className="flex gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 leading-relaxed">
          <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <span><strong>Demo mode</strong> — Uses Claude API for real AI extraction. Upload a real marriage certificate or click "Use demo document".</span>
        </div>

        {/* Change Request form */}
        <div className="card">
          <div className="card-title">Step 1 — Change Request</div>
          <form id="intake-form" onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="field-label">Customer ID</label>
              <input className="field-input" value={form.customerId}
                onChange={e => setForm(f => ({ ...f, customerId: e.target.value }))}
                placeholder="e.g. C001" required />
              <p className="text-xs text-slate-400 mt-1">Valid demo IDs: C001, C002, C003</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">Current / Old Name</label>
                <input className="field-input" value={form.oldName}
                  onChange={e => setForm(f => ({ ...f, oldName: e.target.value }))}
                  placeholder="Current legal name" required />
              </div>
              <div>
                <label className="field-label">New / Requested Name</label>
                <input className="field-input" value={form.newName}
                  onChange={e => setForm(f => ({ ...f, newName: e.target.value }))}
                  placeholder="Requested name" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">Change Type</label>
                <select className="field-input" value={form.changeType}
                  onChange={e => setForm(f => ({ ...f, changeType: e.target.value }))}>
                  <option value="legal_name">Legal Name Change</option>
                </select>
              </div>
              <div>
                <label className="field-label">Document Type</label>
                <select className="field-input" value={form.docType}
                  onChange={e => setForm(f => ({ ...f, docType: e.target.value }))}>
                  <option value="marriage_certificate">Marriage Certificate</option>
                  <option value="deed_poll">Deed Poll</option>
                  <option value="gazette">Gazette Notification</option>
                </select>
              </div>
            </div>
          </form>
        </div>

        {/* Document upload */}
        <div className="card">
          <div className="card-title">Step 2 — Supporting Document</div>
          <FileUpload file={file} onFile={setFile} />
        </div>

        {/* Error */}
        {error && (
          <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          form="intake-form"
          className="btn-primary w-full justify-center py-2.5"
          disabled={submitting || !file}
        >
          {submitting ? (
            <>
              <svg className="w-4 h-4 spin-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              AI Pipeline Running…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
              </svg>
              Submit to AI Pipeline
            </>
          )}
        </button>

        {/* Success banner */}
        {isComplete && (
          <div className="flex items-start gap-2.5 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800">
            <svg className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <div className="font-semibold">Pipeline complete</div>
              <div className="text-xs mt-0.5 text-emerald-700">Switch to <strong>Checker Review</strong> tab to approve or reject.</div>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT — Pipeline trace */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="card">
          <div className="card-title">Agent Pipeline — Live Trace</div>
          {requestId && (
            <div className="mb-4 flex items-center gap-2 text-xs text-slate-500">
              <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">{requestId}</span>
              <span className="status-pill bg-indigo-50 text-indigo-700">
                {isComplete ? 'AI_VERIFIED_PENDING_HUMAN' : 'AI_PROCESSING'}
              </span>
            </div>
          )}
          <PipelineTrace stepStates={stepStates} stepOutputs={stepOutputs} />
          {!requestId && (
            <div className="text-center py-8 text-slate-400">
              <svg className="w-8 h-8 mx-auto mb-2 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
              </svg>
              <p className="text-sm">Submit a request to start the pipeline</p>
            </div>
          )}
        </div>

        {/* Score card (appears after pipeline) */}
        {scoreCard && (
          <div className="card">
            <div className="card-title">Confidence Score Card</div>
            <ConfidenceScoreCard scoreCard={scoreCard} overall={record?.overall_confidence} />
          </div>
        )}
      </div>
    </div>
  );
}
```
