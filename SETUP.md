# ReVise — Setup & Demo Guide

## 1. Prerequisites
- **Node.js**: v18.17.0+ or v20+
- **npm**: v9+ or v10+

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
```

> **Note on Offline / Simulator Mode**: ReVise is built to be resilient. If `HINDSIGHT_API_KEY` or `GROQ_API_KEY` are not set, ReVise automatically uses its high-fidelity local memory bank and deterministic simulation engine. You can run the full demo immediately out of the box.

---

## 3. Populate Seed Data

Run the idempotent seed script to load Acme Platform's 15 historical incident memories, post-mortems, and baseline runs:

```bash
npm run seed
```

Alternatively, you can click the **"Seed Demo Memories"** button on the **Settings** page in the web app.

---

## 4. Run the Web Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 5. Walkthrough for the 90-Second Demo

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

4. **Teach ReVise Write-Back (`/teach`)**:
   - Select PR #167, choose outcome **"Failed in staging"**, and click **"Save outcome to Hindsight"**.
   - See the live success banner: *"Outcome added to organizational memory (Reinforced existing pattern)"*.

5. **Team Standards (`/standards`)**:
   - Review living standards inferred directly from incident memories (e.g., PostgreSQL Concurrent Index standard sourced from `PM-024`).
