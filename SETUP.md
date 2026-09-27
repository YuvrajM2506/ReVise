# ReVise — Setup & Demo Guide

## 1. Prerequisites
- **Node.js**: v18.17.0+ or v20+
- **npm**: v9+ or v10+
- **Python**: 3.11+ (for Aider backend service)
- **Git**: Installed and available in PATH

---

## 2. API Keys & Configuration

Create a `.env.local` file in the root directory:

```env
# Groq API Key for Ultra-Fast LLM Inference
# Obtain at: https://console.groq.com/keys
GROQ_API_KEY=gsk_your_groq_api_key

# Preferred models on Groq
GROQ_PRIMARY_MODEL=openai/gpt-oss-120b
GROQ_FALLBACK_MODEL=qwen-2.5-32b

# Hindsight Cloud API Key for Persistent Long-term Agent Memory
# Obtain at: https://hindsight.vectorize.io/ or https://ui.hindsight.vectorize.io
HINDSIGHT_API_KEY=hsk_your_hindsight_api_key

# Hindsight Memory Bank ID
HINDSIGHT_BANK_ID=acme-platform
HINDSIGHT_BASE_URL=https://api.hindsight.vectorize.io

# Aider Backend Service Configuration
AIDER_SERVICE_URL=http://localhost:8001

# Optional LLM Key for Aider Agent (OpenAI, Groq, Anthropic, or Gemini)
OPENAI_API_KEY=sk-...
```

> **Note on Offline / Simulator Mode**: ReVise is built to be resilient. If `HINDSIGHT_API_KEY` or `GROQ_API_KEY` are not set, ReVise automatically uses its high-fidelity local memory bank and deterministic simulation engine. You can run the full demo immediately out of the box.

---

## 3. Install Dependencies & Start Services

### Step A: Install Node dependencies
```bash
npm install
```

### Step B: Install Python dependencies for Aider Service
```bash
pip install -r aider-service/requirements.txt
```

### Step C: Start Aider Backend Service (Port 8001)
```bash
cd aider-service
uvicorn main:app --port 8001 --reload
```

### Step D: Populate Seed Data
```bash
npm run seed
```

### Step E: Start Next.js Development Server (Port 3000)
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 4. Walkthrough for the Full Demo

1. **Dashboard Overview (`/`)**:
   - Notice the persistent `Hindsight Memory Active •` badge with real connection status.
   - Click on the quick-start scenario card: **"Unsafe DB migration"**.

2. **Analyze Change (`/analyze`) - Memory OFF vs. ON**:
   - First, switch the top-right toggle to **"Hindsight Memory OFF"**.
   - Click **"Analyze without memory"**.
   - Observe: Risk score is **Low (35/100)**, no memory evidence, and a banner highlighting that generic LLMs miss historical outages.
   - Click the link to re-run with **"Hindsight Memory ON"**.
   - Observe: Risk score leaps to **High (82/100)**. The **Memory Evidence** card reveals **4 real memories from Hindsight** (`PR #142`, `RUN-889`, `INC-024`, `PM-024`). The **Safer Rollout** provides the 5-step concurrent indexing playbook.

3. **Memory Timeline (`/timeline`)**:
   - Inspect the causal graph connecting the initial warning on Aug 10 to the staging rollback (RUN-889), the SEV-2 checkout outage (INC-024), the validated post-mortem (PM-024), and today's prevented risk (PR #167).
   - Click **"View prevention policy"** to inspect the compiled zero-downtime rules.

4. **AI Pair Programmer (`/pair-programmer`)**:
   - Click **"Pair Programmer"** in the sidebar or click **"Fix with Aider"** on any risk report.
   - Select the preset **"PostgreSQL Migration Fix"** with **Hindsight Memory ON**.
   - Click **"Run Aider Pair Session"**.
   - Observe: Aider is supplied with the exact organizational memories from Hindsight (e.g. avoiding exclusive table locks, using `CREATE INDEX CONCURRENTLY`).
   - Inspect the generated unified git diff and collapsible execution log.
   - Click **"Re-analyze this diff"** to immediately verify in ReVise that the risk score drops to Safe/Resolved.

5. **Teach ReVise Write-Back (`/teach`)**:
   - Select PR #167, choose outcome **"Failed in staging"**, and click **"Save outcome to Hindsight"**.
   - See the live success banner: *"Outcome added to organizational memory (Reinforced existing pattern)"*.

6. **Team Standards (`/standards`)**:
   - Review living standards inferred directly from incident memories (e.g., PostgreSQL Concurrent Index standard sourced from `PM-024`).
