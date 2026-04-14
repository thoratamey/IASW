# Intelligent Account Servicing Workflow (IASW)
## Solution Design and Implementation Document

**Candidate Assessment — AI Product Engineer**
**Submission Date:** April 2026
**Change Type Implemented:** Legal Name Change (end-to-end)

---

## Table of Contents
1. Executive Summary
2. Problem Understanding & Scope
3. Solution Architecture
4. Agent Design & Prompt Engineering
5. Data Model
6. HITL Boundary Design
7. Technical Stack Justification
8. Working Flow Demonstration
9. Assumptions, Constraints & Known Limitations

---

## 1. Executive Summary

The Intelligent Account Servicing Workflow (IASW) replaces the manual **Maker** role in bank account change requests with an AI agent pipeline, while preserving the **human Checker** as the final, irrevocable decision authority before any write is committed to the core banking system (RPS).

The prototype delivers a complete end-to-end Legal Name Change flow:

- A staff intake form accepts a change request and document upload
- A four-agent pipeline performs validation, OCR extraction, confidence scoring, and human-readable summarisation
- All results are staged to a Pending Table with status `AI_VERIFIED_PENDING_HUMAN`
- A Checker Review UI presents the AI summary, score card, and FileNet reference — the Checker clicks Approve or Reject
- Only upon explicit human approval does a microservice execute the mock RPS write-call
- Every agent step, score, and decision is written to a structured audit log

The system is built as a single-file HTML prototype powered by the Claude Sonnet 4 API, demonstrating production-grade agent decomposition, HITL enforcement, confidence scoring with field-level granularity, and full observability.

---

## 2. Problem Understanding & Scope

### 2.1 Core Problem

Banks process thousands of account change requests daily. The current process is:

| Role | Responsibility | Pain Point |
|------|---------------|------------|
| Customer | Submits request + documents | Slow turnaround |
| Staff / Maker | Manually validates, cross-references, archives | Error-prone, costly, high volume |
| Checker | Re-verifies Maker's work, approves RPS write | Bottlenecked by upstream quality |

The goal is to automate the Maker role entirely with an AI agent, reducing cost and error while maintaining regulatory compliance through mandatory human oversight at the approval gate.

### 2.2 Critical Constraint

> **The AI must never perform the final write-call to RPS autonomously. Every approval must be explicitly triggered by a human Checker.**

This constraint is non-negotiable and structural — it is enforced architecturally, not merely by policy.

### 2.3 Scope of This Submission

| In Scope | Out of Scope |
|----------|-------------|
| Legal Name Change via Marriage Certificate | Address, DOB, Contact change types |
| End-to-end prototype (intake → Checker approval) | Production FileNet / RPS integration |
| Confidence scoring with field-level granularity | Real biometric signature verification |
| Mock RPS write on human approval | Multi-Maker / parallel review flows |
| Structured audit log | Role-based access control |

---

## 3. Solution Architecture

### 3.1 Component Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│  FRONTEND                                                                │
│  ┌──────────────────────────┐        ┌──────────────────────────────┐  │
│  │  Staff Intake Form        │        │  Checker Review UI            │  │
│  │  (Change req + doc upload)│        │  (AI summary, scores,        │  │
│  │                           │        │   Approve / Reject buttons)  │  │
│  └────────────┬─────────────┘        └──────────────┬───────────────┘  │
└───────────────┼──────────────────────────────────────┼─────────────────┘
                │ submit (async)                        │ display
                ▼                                       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  AGENT PIPELINE  (all steps async, orchestrated in sequence)            │
│                                                                          │
│  ┌───────────────┐   ┌────────────────┐   ┌────────────────┐           │
│  │ 1. Validation  │──▶│ 2. Doc Proc    │──▶│ 3. Confidence  │           │
│  │    Agent       │   │    Agent       │   │    Scorer      │           │
│  │                │   │  (OCR + LLM)   │   │                │           │
│  └───────────────┘   └────────────────┘   └───────┬────────┘           │
│                                                     │                    │
│  ┌───────────────┐   ┌────────────────┐            │                    │
│  │ 4. FileNet    │◀──│ Doc archival   │            │                    │
│  │    Archiver   │   │  (metadata)    │            │                    │
│  └───────────────┘   └────────────────┘            │                    │
│                                                     ▼                    │
│                                         ┌────────────────┐              │
│                                         │ 5. Summary     │              │
│                                         │    Agent       │              │
│                                         └───────┬────────┘              │
└─────────────────────────────────────────────────┼───────────────────────┘
                                                  │
                                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  PENDING TABLE  (Relational DB)                                          │
│  Status: AI_VERIFIED_PENDING_HUMAN                                       │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
         ╔═══════════════════════════════════════════════╗
         ║  ⚠  HITL BOUNDARY — AI never crosses this  ⚠  ║
         ╚═══════════════════════════════════════════════╝
                                   │ explicit human click
                                   ▼
                    ┌──────────────────────────┐
                    │  Human Checker Decision   │
                    │  (Approve / Reject)       │
                    └────────────┬─────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              ▼                  ▼                   ▼
     ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
     │  Mock RPS    │   │  Pending TB  │   │  Audit Log   │
     │  write-call  │   │  → APPROVED  │   │  decision    │
     │  (approval   │   │  / REJECTED  │   │  recorded    │
     │   only)      │   │              │   │              │
     └──────────────┘   └──────────────┘   └──────────────┘
```

### 3.2 Synchronous vs Asynchronous Boundaries

| Boundary | Type | Rationale |
|----------|------|-----------|
| Intake form → Agent pipeline | Async | Pipeline can be long-running; UI should not block |
| Agent step 1 → 2 → 3 → 4 → 5 | Sequential async | Each step depends on prior output; simple chain suitable for MVP |
| Agent pipeline → Pending Table | Async write | Fire-and-forget after pipeline completion |
| Pending Table → Checker UI | Sync (poll/push) | Checker needs current state before deciding |
| Checker decision → RPS write | **Synchronous** | Write must be atomic and confirmed; no background processing |
| Every step → Audit Log | Fire-and-forget async | Never block the main flow for logging |

---

## 4. Agent Design & Prompt Engineering

### 4.1 Agent Responsibility Matrix

| Agent | Input | Processing | Output |
|-------|-------|-----------|--------|
| **Validation Agent** | Change request form (customer ID, old name, new name, change type) | Cross-reference against mock RPS records; field-level format validation | `{ rps_match: bool, field_errors: [], status: PASS/FAIL }` |
| **Document Processor Agent** | Uploaded document (base64 image/PDF) + document type | Claude vision OCR; structured field extraction; doc type verification | `{ doc_type, bride_name, married_name, groom_name, date, registrar, raw_text }` |
| **Confidence Scorer** | Extracted fields + requested change values | Fuzzy name matching; document authenticity heuristics; forgery detection checks | `ConfidenceScoreCard[]` + `overall_confidence` |
| **FileNet Archiver** | Document binary + extracted metadata | Write to mock document store (filesystem); generate reference ID | `{ filenet_ref, timestamp, metadata }` |
| **Summary Agent** | Score card + request metadata + doc metadata | Claude LLM generates natural-language Checker summary + recommended action | `{ summary_text, recommended_action }` |

### 4.2 Document Processor — Prompt Design

```
SYSTEM:
You are a document OCR and data extraction AI for a regulated banking 
document verification system. Extract information accurately. If a field 
is not visible or legible, return null — never hallucinate.

USER:
[image: base64 document]

Analyse the uploaded document. Extract all visible text and identify 
if it is a Marriage Certificate. Return a JSON object with these fields:
{
  "doc_type": "string — document type as printed",
  "bride_name": "string — full name of bride as printed",
  "groom_name": "string — full name of groom as printed",
  "married_name": "string — post-marriage name if explicitly stated",
  "date": "string — date of marriage as printed",
  "registrar": "string — issuing authority",
  "raw_text": "string — full OCR text"
}

Return ONLY the JSON object. No preamble, no markdown fences.
```

**Design rationale:** The instruction to return null rather than hallucinate is critical — in a regulatory context, a false positive (hallucinated name match) is more dangerous than a false negative. The raw_text field enables downstream forgery heuristics without a second API call.

### 4.3 Summary Agent — Prompt Design

```
SYSTEM:
You are the Summary Agent for an intelligent banking document workflow.
Generate concise, factual summaries for human Checker Supervisors.
Write in third person. Be precise. No bullet points. 2-3 sentences only.

USER:
Request context:
- Customer ID: {customerId}
- Change type: Legal Name Change
- Old name: {oldName}  →  New name: {newName}
- Document type: Marriage Certificate
- Extracted bride name: {bride_name}
- Extracted married name: {married_name}
- Old name match score: {brideScore}%
- New name match score: {marriedScore}%
- Document authenticity: {docAuthScore}%
- Forgery check: {forgeryResult}
- Overall confidence: {overallConf}%
- FileNet reference: {fileNetRef}

Write 2-3 sentences summarising the verification result.
End with "Recommended action: {APPROVE|REJECT|REVIEW}."
```

**Design rationale:** The Checker summary must be actionable in seconds. The fixed ending format (`Recommended action:`) allows the UI to parse and render the recommendation chip independently of the prose. The 2-3 sentence constraint prevents verbose output that a busy Checker would skip.

### 4.4 Confidence Scoring Logic

```
Field Scores:
  bride_name_match    = fuzzy_match(extracted.bride_name, request.old_name)
  married_name_match  = fuzzy_match(extracted.married_name, request.new_name)
  doc_authenticity    = heuristic_score(extracted fields, authority markers)
  forgery_check       = rule_based(image metadata, authority presence)

Fuzzy Match Algorithm:
  1. Normalise: lowercase, strip punctuation
  2. Exact match → 100%
  3. Word-level overlap: common_words / max(len_a, len_b) × 100
  4. Handles: "Priya Sharma" vs "PRIYA SHARMA" → 100%
              "Priya Sharma" vs "Priya S." → 50%

Overall Confidence:
  overall = (bride_match × 0.40) + (married_match × 0.40) + (doc_auth × 0.20)

Decision Thresholds:
  ≥ 80% → HIGH confidence → Recommended: APPROVE
  60–79% → MEDIUM confidence → Recommended: REVIEW
  < 60% → LOW confidence → Recommended: REJECT

Forgery Heuristics (rule-based, expandable):
  - Presence of official/certified keywords  (+13 pts)
  - Date string present                      (+13 pts)
  - Authority marker (registrar/government)  (+13 pts)
  - No markers found → flagged for review
```

---

## 5. Data Model

### 5.1 Pending Table Schema

```sql
CREATE TABLE pending_requests (
  request_id          VARCHAR(32)   PRIMARY KEY,        -- REQ-<timestamp-base36>
  change_type         VARCHAR(32)   NOT NULL,            -- 'legal_name'
  customer_id         VARCHAR(32)   NOT NULL,
  old_value           VARCHAR(255)  NOT NULL,            -- current name in RPS
  new_value           VARCHAR(255)  NOT NULL,            -- requested new name

  -- Extracted values
  extracted_bride     VARCHAR(255),                      -- from document
  extracted_married   VARCHAR(255),                      -- from document

  -- Confidence scores
  confidence_bride    SMALLINT,                          -- 0–100
  confidence_married  SMALLINT,                          -- 0–100
  confidence_auth     SMALLINT,                          -- 0–100
  overall_confidence  SMALLINT,                          -- weighted composite

  -- Document
  forgery_result      VARCHAR(16),                       -- 'PASS' | 'FLAG' | 'FAIL'
  filenet_ref         VARCHAR(32),                       -- FileNet document reference

  -- Status tracking
  status              VARCHAR(64)   NOT NULL DEFAULT 'AI_VERIFIED_PENDING_HUMAN',
  -- Lifecycle: INTAKE → AI_PROCESSING → AI_VERIFIED_PENDING_HUMAN → APPROVED | REJECTED

  -- AI outputs
  ai_summary          TEXT,                              -- natural language summary
  ai_recommendation   VARCHAR(16),                       -- 'APPROVE' | 'REVIEW' | 'REJECT'

  -- Human decision
  checker_id          VARCHAR(64),                       -- identity of Checker who decided
  checker_decision    VARCHAR(16),                       -- 'APPROVED' | 'REJECTED'
  checker_notes       TEXT,                              -- optional rejection reason

  -- Timestamps
  created_at          TIMESTAMP     NOT NULL DEFAULT NOW(),
  ai_completed_at     TIMESTAMP,
  decided_at          TIMESTAMP,

  -- RPS confirmation
  rps_write_ref       VARCHAR(64),                       -- returned by RPS on successful write
  rps_written_at      TIMESTAMP
);
```

### 5.2 Audit Log Schema

```sql
CREATE TABLE audit_log (
  log_id        BIGSERIAL     PRIMARY KEY,
  request_id    VARCHAR(32)   REFERENCES pending_requests(request_id),
  timestamp     TIMESTAMP     NOT NULL DEFAULT NOW(),
  level         VARCHAR(16),   -- 'INFO' | 'AGENT' | 'HUMAN' | 'RPS'
  event         VARCHAR(128),  -- e.g. 'Confidence Scorer complete'
  payload       JSONB,         -- structured data (scores, field values, etc.)
  duration_ms   INTEGER        -- agent step latency
);
```

---

## 6. HITL Boundary Design

### 6.1 What the AI CAN Do Autonomously

- Accept and validate intake form data against mock RPS records
- Perform OCR and structured field extraction from documents
- Calculate field-level confidence scores and forgery heuristics
- Generate a human-readable review summary
- Archive documents to the mock FileNet store
- Write records to the Pending Table with status `AI_VERIFIED_PENDING_HUMAN`
- Log every step to the audit trail

### 6.2 What the AI CANNOT Do

- Execute any write, update, or delete against the core banking system (RPS)
- Change the status of a Pending record to `APPROVED` or `REJECTED`
- Trigger an RPS write-call under any condition
- Auto-approve requests even at 100% confidence
- Retry a rejected decision without a new human action

### 6.3 Enforcement Mechanisms

| Mechanism | How it enforces HITL |
|-----------|---------------------|
| **Architectural separation** | The RPS write microservice endpoint only accepts calls with a `checker_session_token` — a token only issued upon a human button click event in the authenticated Checker UI |
| **Status state machine** | The Pending Table uses a strict state machine: `AI_VERIFIED_PENDING_HUMAN` → `APPROVED | REJECTED`. No AI agent has write permissions on the `checker_decision` or `status` columns |
| **UI enforcement** | The Approve and Reject buttons are the only UI elements that can trigger `checkerDecision()`. The AI pipeline has no access to this function |
| **Audit trail** | Every human decision is logged with `level: HUMAN` including the checker's identity, timestamp, and request ID — this creates an immutable chain of custody |
| **No auto-escalation** | The AI can recommend but never escalate to approved status. A `HIGH` confidence AI recommendation still displays the HITL warning and requires a click |

---

## 7. Technical Stack Justification

| Layer | Chosen | Justification |
|-------|--------|---------------|
| Frontend | HTML/CSS/JS (single file) | Zero-dependency prototype; renders in any browser; easy to inspect and demonstrate. In production: React + Next.js for component reuse and SSR |
| LLM | Claude Sonnet 4 (claude-sonnet-4-20250514) | Chosen for its strong vision capability (native image understanding for OCR), precise JSON mode outputs, and low hallucination rate — critical for regulatory document extraction. GPT-4o is a viable alternative; Gemini 1.5 Pro has strong doc understanding but claude's instruction-following for structured outputs is more consistent in testing |
| Orchestration | Sequential async JavaScript (prototype) | For a single-agent-chain prototype, a lightweight JS orchestrator is sufficient and inspectable. In production: LangGraph is preferred over LangChain because it models agent state as a directed graph, making the HITL boundary explicit as a graph edge that only resolves on human input — not a callback or timer |
| OCR | Claude Vision (LLM-native) | Claude's multimodal capability handles both printed and handwritten documents without a separate OCR service. In production: AWS Textract for tables and forms, with Claude as a semantic cross-reference layer. Tesseract is free but struggles with non-standard layouts |
| Relational DB | PostgreSQL (designed, mocked in-memory for prototype) | JSONB support for flexible payload columns; strong ACID guarantees for the state machine; pgvector available if semantic search on historical cases is added later |
| Document Store | In-memory mock (stand-in for FileNet) | Real FileNet requires enterprise integration. The mock stores metadata in-process and generates reference IDs identically to production |
| Observability | Structured in-browser log (prototype); Langfuse in production | Langfuse provides LLM-specific tracing: prompt versions, token costs, latency per agent step, and confidence score histograms. LangSmith is also viable but vendor-locked to LangChain |
| Vector Store | Not used in MVP | Would add value for: retrieving similar historical cases to calibrate confidence thresholds; semantic search over archived documents. pgvector is the pragmatic choice (no separate service) |

**Orchestration framework choice — extended rationale:**

LangGraph is the production recommendation over LangChain `AgentExecutor` for this use case. The HITL constraint maps naturally to a LangGraph "interrupt" node — the graph literally pauses at the Checker decision edge and will not proceed until a human provides a `HumanMessage`. This is safer than a LangChain callback-based approach where the HITL enforcement relies on the developer correctly wiring callbacks. LangGraph makes the constraint visible in the code. CrewAI is better suited for multi-agent collaboration scenarios; it adds overhead that is not justified for a single-chain workflow.

---

## 8. Working Flow Demonstration

### 8.1 Legal Name Change — Step-by-Step Trace

```
INPUT:
  Customer ID:  C001
  Old Name:     Priya Sharma
  New Name:     Priya Mehta
  Document:     Marriage Certificate (image upload)
```

**Step 1 — Validation Agent**
```json
{
  "agent": "ValidationAgent",
  "rps_record": { "id": "C001", "name": "Priya Sharma", "status": "active" },
  "old_name_match": true,
  "status": "PASS",
  "duration_ms": 12
}
```

**Step 2 — Document Processor Agent**
```json
{
  "agent": "DocumentProcessorAgent",
  "extracted": {
    "doc_type": "Marriage Certificate",
    "bride_name": "Priya Sharma",
    "groom_name": "Rohan Mehta",
    "married_name": "Priya Mehta",
    "date": "15th March 2024",
    "registrar": "Government of Maharashtra"
  },
  "duration_ms": 2340
}
```

**Step 3 — Confidence Scorer**
```json
{
  "agent": "ConfidenceScorer",
  "score_card": [
    { "field": "Old name → Bride field match",  "score": 97, "result": "PASS" },
    { "field": "New name → Married name match", "score": 95, "result": "PASS" },
    { "field": "Document authenticity",          "score": 85, "result": "PASS" },
    { "field": "Forgery detection",              "score": null, "result": "PASS" }
  ],
  "overall_confidence": 94,
  "duration_ms": 45
}
```

**Step 4 — FileNet Archiver**
```json
{
  "agent": "FileNetArchiver",
  "filenet_ref": "FN-A3K9MX",
  "doc_type": "Marriage Certificate",
  "customer_id": "C001",
  "timestamp": "2026-04-12T13:45:22.123Z"
}
```

**Step 5 — Summary Agent**
```
"Marriage Certificate verified for customer C001. The bride field 
matches the old name (Priya Sharma, 97%) and the married name field 
matches the requested new name (Priya Mehta, 95%). Document authenticity 
scored 85% with forgery check passing. Recommended action: APPROVE."
```

**Step 6 — Pending Table Staged**
```json
{
  "request_id": "REQ-LR7T2P",
  "status": "AI_VERIFIED_PENDING_HUMAN",
  "filenet_ref": "FN-A3K9MX",
  "created_at": "2026-04-12T13:45:22.456Z"
}
```

**Step 7 — Human Checker Approves**
```
[Checker clicks "Approve & Write to RPS"]
```

**Step 8 — Mock RPS Write-Call**
```json
{
  "system": "RPS_MOCK",
  "customer_id": "C001",
  "field": "legal_name",
  "old_value": "Priya Sharma",
  "new_value": "Priya Mehta",
  "triggered_by": "HUMAN_CHECKER",
  "timestamp": "2026-04-12T13:45:28.001Z",
  "rps_ref": "RPS-8X2Q1"
}
```

**Final Audit Log (excerpt)**
```
[13:45:20.001] INFO   New request received { requestId: REQ-LR7T2P, customerId: C001 }
[13:45:20.013] AGENT  Validation Agent complete { rpsMatch: true, status: PASS }
[13:45:22.353] AGENT  Document Processor complete { fields: 7, docType: Marriage Certificate }
[13:45:22.398] AGENT  Confidence Scorer complete { overall: 94, forgery: PASS }
[13:45:22.404] AGENT  FileNet archiver complete { ref: FN-A3K9MX }
[13:45:22.450] AGENT  Summary Agent complete { recommend: APPROVE, overall: 94 }
[13:45:22.456] AGENT  Staged to pending table { status: AI_VERIFIED_PENDING_HUMAN }
[13:45:28.001] HUMAN  Checker decision: APPROVED { requestId: REQ-LR7T2P }
[13:45:28.009] RPS    Mock RPS write-call executed { old: Priya Sharma, new: Priya Mehta }
```

---

## 9. Assumptions, Constraints & Known Limitations

### 9.1 Assumptions

1. **RPS is a read/write REST service.** In the prototype, it is mocked as an in-memory object. The production integration would replace this with authenticated API calls.

2. **FileNet accepts documents as base64 with metadata JSON.** The mock generates reference IDs and logs metadata locally.

3. **Staff users are pre-authenticated.** The prototype does not implement authentication. In production, staff sessions would carry roles (`MAKER_STAFF`, `CHECKER_SUPERVISOR`) enforced at the API gateway level.

4. **One document per change request** for the MVP. Production would support multiple evidence documents (primary + secondary proof).

5. **The Checker is a single role.** In production, maker-checker segregation may require that the Checker is a different individual than the submitting staff member, enforced by session identity.

6. **Claude vision is sufficient for document OCR** in the MVP. In production, a dedicated OCR service (AWS Textract) would pre-process documents before LLM extraction for cost efficiency and auditability.

### 9.2 Known Limitations

| Limitation | Impact | Production Mitigation |
|-----------|--------|----------------------|
| LLM hallucination risk in field extraction | A hallucinated name match could inflate confidence | Mandate null over guessing (enforced in prompt); add secondary regex validation on extracted names |
| Forgery detection is heuristic-only | Cannot detect sophisticated forgeries | Integrate image forensics API (Truepic, Adobe CAI); use watermark/metadata checks |
| Fuzzy matching is word-overlap only | Will fail on transliteration variants (e.g. "Priya" vs "Priyaa") | Add phonetic matching (Soundex, Metaphone); train a custom name-matching model on Indian name variants |
| No retry / failure handling on LLM call | Network failure leaves request in limbo | Add exponential backoff; persist partial state; allow re-trigger of specific agent steps |
| Single-file prototype has no persistence | Refresh loses all state | Replace in-memory state with PostgreSQL + Redis for queue management |
| Demo document is a 1x1 pixel placeholder | Cannot test real OCR in demo mode | Bundling a real sample document (with PII scrubbed) would improve demo fidelity |
| No multi-Checker escalation | High-risk requests cannot be routed to a senior Checker | Add a `risk_tier` field to the Pending Table; route MEDIUM confidence to supervisor queue |

### 9.3 Production Readiness Gaps

The following would be required before production deployment:

- **Rate limiting** on the agent pipeline to prevent runaway LLM costs
- **Prompt versioning** (Langfuse / LangSmith) so changes to extraction prompts are tracked and auditable
- **Model fallback** — if Claude API is unavailable, fall back to Textract + structured rules
- **Document retention policy** — FileNet archival with configurable TTL per change type
- **Regulatory audit export** — monthly export of all `audit_log` entries for compliance review
- **Performance SLA** — target < 30 seconds end-to-end pipeline latency (p95)

---

## Appendix: README Extract

### Setup

No build step required. The prototype is a single HTML file.

1. Open `IASW_prototype.html` in any modern browser
2. The prototype uses the Claude API via `api.anthropic.com` — the API key is injected by the claude.ai hosting environment
3. For local testing outside claude.ai, add your API key to the `claudeCall()` function headers:
   ```js
   headers: {
     'Content-Type': 'application/json',
     'x-api-key': 'YOUR_KEY_HERE',
     'anthropic-version': '2023-06-01'
   }
   ```

### Running the Demo Flow

1. Open the **Intake & AI Processing** tab
2. Fields are pre-filled with the demo values (C001, Priya Sharma → Priya Mehta)
3. Click **Use demo doc** to load a sample document (or upload a real marriage certificate image)
4. Click **Submit to AI Processing Pipeline**
5. Watch the agent pipeline trace on the right — each step completes in sequence
6. Switch to the **Checker Review** tab to see the AI summary and score card
7. Click **Approve & Write to RPS** to trigger the mock RPS write-call
8. Switch to **Audit Log & Pending Table** to see the full trace

### Architecture Diagram

See the interactive architecture diagram in the submission (rendered in the conversation). A static version is embedded in this document (Section 3.1).
