# ReVise — AI Code Review Agent with Hindsight Memory

> **Memory is not a feature bolted onto an LLM wrapper — it is the product.**
> ReVise is an AI code review agent that gets measurably smarter over time by remembering every past PR review, pipeline failure, incident, and post-mortem your engineering team has ever logged using [Hindsight](https://hindsight.vectorize.io/).

---

## 🚀 90-Second Demo Script for Judges

| Step | Action | What to Observe |
| :--- | :--- | :--- |
| **1. Memory OFF Baseline** | Go to **Analyze Change**, select *"Unsafe DB migration"*, toggle **Hindsight Memory OFF**, click **Analyze without memory**. | Risk Score is **Low (35/100)** with generic static syntax advice. Banner warns: *"This analysis used no historical memory"*. Zero memories retrieved. |
| **2. Memory ON Grounded Review** | Toggle **Hindsight Memory ON**, re-submit the same PR (#167 on `orders-service`). | Risk Score jumps to **High (82/100)**. **Memory Evidence panel shows 4 real retrieved memories** (`PR #142`, `RUN-889`, `INC-024`, `PM-024`). Findings cite specific 42M row locks, and **Safer Rollout** provides the 5-step zero-downtime playbook. |
| **3. Causal Story Chain** | Navigate to **Memory Timeline**. | Walk the causal graph: `PR #142 Warning` ➔ `RUN-889 Pipeline Rollback` ➔ `INC-024 SEV-2 Incident` ➔ `PM-024 Validated Playbook` ➔ `PR #167 Prevented Risk`. |
| **4. Teach ReVise Write-Back** | Click **Teach ReVise**, select PR #167 outcome *"Failed in staging"*, enter root cause, and click **Save outcome to Hindsight**. | Success banner: *"Outcome added to organizational memory"*. Live write-back to Hindsight reinforces the causal model. |
| **5. Measurably Smarter** | Run a new change on `orders-service`. | ReVise immediately recalls the newly learned outcome and prevents the recurrence. |

---

## 🧠 How Hindsight Memory Works Here

```
                     ┌────────────────────────────────────────────────────────┐
                     │                   Client Interaction                   │
                     └───────────────────────────┬────────────────────────────┘
                                                 │
                                        1. Submit Code Change
                                                 │
                                                 ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ 1. RETRIEVAL PHASE (src/lib/hindsight.ts -> recallMemories)                                │
│                                                                                             │
│  • Namespaced queries: Scoped by {bank_id} -> {service} -> {focus_area}                     │
│  • Multi-Strategy Parallel Search: Semantic Similarity + BM25 Keywords + Causal Graph +      │
│    Temporal Context combined via Reciprocal Rank Fusion (RRF).                              │
│  • Endpoint: POST https://api.hindsight.vectorize.io/v1/default/banks/{bank_id}/recall     │
│  • Returns: Real retrieved memory count, dated evidence cards, and relevance scores.        │
└────────────────────────────────────────┬────────────────────────────────────────────────────┘
                                         │
                         2. Retrieved Memories Injected
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ 2. REASONING & STRUCTURED SYNTHESIS (src/lib/groq.ts -> evaluateCodeChange)                 │
│                                                                                             │
│  • Model: Groq LPU Inference (openai/gpt-oss-120b with fallback to qwen-2.5-32b)           │
│  • System Prompt: Injects labeled historical memories as dated ground-truth evidence.       │
│  • Schema Enforcement: Strict JSON Schema with exponential-backoff retry on failure.        │
│  • Evidence Traceability: Output explicitly maps memory IDs (e.g. RUN-889) to findings.    │
└────────────────────────────────────────┬────────────────────────────────────────────────────┘
                                         │
                                3. Persisted Run Saved
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ 3. WRITE-BACK LOOP (src/lib/hindsight.ts -> retainMemory & src/app/api/teach)               │
│                                                                                             │
│  • Captures post-deploy outcomes (staging failures, rollbacks, resolutions).               │
│  • Endpoint: POST https://api.hindsight.vectorize.io/v1/default/banks/{bank_id}/memories    │
│  • Reinforcement Detection: Increments pattern confidence if matching signature exists;     │
│    otherwise builds a new causal node in the knowledge graph.                               │
│  • Living Standards: Automatically derives enforceable rules into Team Standards board.     │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

### File-by-File Memory Architecture Breakdown:

1. **`src/lib/hindsight.ts`**:
   - `recallMemories(query, filters, bankId)`: Performs multi-strategy retrieval against Hindsight Cloud / Bank. Scopes queries by service and focus area (`Unsafe DB migration`, `Missing secret`, `Dependency upgrade`).
   - `retainMemory(params)`: Retains new incident, PR review, or outcome memories. Detects if an incoming outcome strongly matches an existing pattern to increment pattern confidence (`"Reinforced existing pattern"` vs. `"New pattern detected"`).
   - `checkHindsightHealth()`: Probes the live Hindsight REST endpoint (`/v1/default/banks/{bank_id}/config`) and measures roundtrip latency.

2. **`src/lib/groq.ts`**:
   - Implements structured JSON schema enforcement for review outputs.
   - Enforces exponential backoff retry with jitter on function/tool failures.
   - Constructs evidentiary prompts that explicitly mandate citing Hindsight memory IDs in `why_recommendation` and `memory_citations`.
   - Supports the **Memory ON/OFF comparison toggle**, switching between memory-grounded evaluation and zero-memory generic analysis.

3. **`src/app/api/analyze/route.ts`**:
   - Orchestrates the full pipeline: extracts signals from PR diff ➔ recalls top-k memories from Hindsight ➔ evaluates via Groq LPU ➔ persists run to timeline and recent intelligence.

4. **`src/app/api/teach/route.ts`**:
   - Writes outcome feedback into Hindsight, attaches causal links, appends new timeline nodes, and adjusts future retrieval weighting.

5. **`src/lib/storage.ts`**:
   - Thread-safe local cache and persistent state store for Acme Platform demo runs, active guardrails, and living team standards.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14+ (App Router) + React 18 + TypeScript
- **Styling**: Tailwind CSS (Dark Navy `#080911`, Indigo `#6C5CE7`, glowing badges)
- **LLM Provider**: Groq Cloud LPU API (`openai/gpt-oss-120b`, `qwen-2.5-32b`, `llama-3.3-70b-versatile`)
- **Memory Engine**: Hindsight Cloud REST API / SDK (`https://api.hindsight.vectorize.io`)
- **Icons**: Lucide React
- **Syntax**: Monospaced code viewer with custom themes & line numbers

---

## 📦 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Add your Groq and Hindsight API keys (or run immediately in high-fidelity offline mode):
```env
GROQ_API_KEY=gsk_your_groq_key
HINDSIGHT_API_KEY=hsk_your_hindsight_key
HINDSIGHT_BANK_ID=acme-platform
```

### 3. Seed Demo Memories
```bash
npm run seed
```

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
