# ReVise — Setup & Demo Guide

Everything needed to run ReVise locally and present it. For the architecture, route and API
reference see [README.md](README.md).

---

## 1. Prerequisites

| Requirement | Version | Needed for |
| :--- | :--- | :--- |
| Node.js | 18.17+ or 20+ | The Next.js app |
| npm | 9+ or 10+ | Dependency install (a `package-lock.json` is committed, `npm ci` also works) |
| Python | 3.11+ | The Aider pair-programming service only — the web app does not need it |
| Git | any recent | The Aider sandbox clones repositories |

> **The app is not at the repository root.** The Next.js project lives in [`frontend/`](frontend);
> `npm` commands run from that directory and Next.js only reads `frontend/.env.local`. A
> `.env.local` at the repository root is ignored by the web app.

---

## 2. Configuration

There are two environment files, read by two different processes:

| File | Read by |
| :--- | :--- |
| `frontend/.env.local` | Next.js — analysis, memory, GitHub |
| `.env.local` (repository root) | `aider-service/main.py`, which explicitly loads `../.env.local` |

To use the web app *and* the pair programmer, put your LLM key in both.

### Minimum configuration for the web app

```env
# frontend/.env.local
GROQ_API_KEY=gsk_your_groq_api_key          # https://console.groq.com/keys
HINDSIGHT_API_KEY=hsk_your_hindsight_key    # https://hindsight.vectorize.io/
HINDSIGHT_BANK_ID=acme-platform
HINDSIGHT_BASE_URL=https://api.hindsight.vectorize.io
AIDER_SERVICE_URL=http://localhost:8001
```

Both keys are optional: with no `GROQ_API_KEY` the evaluator uses its deterministic simulator, and
with no `hsk_`-prefixed Hindsight key retrieval uses the local memory engine over
`frontend/data/app_state.json`. The full demo runs out of the box, just not against the live
services — see [Live vs simulated behaviour](README.md#live-vs-simulated-behaviour).

### GitHub

**No configuration required.** ReVise reads GitHub anonymously and never sends a token:

- Public repositories only — private ones return 404/403, and the UI now reports that reason
  instead of a generic failure.
- Roughly 60 requests/hour per IP; each pull request review costs two (changed files + diff).
- Review comments are never posted back to GitHub.
- `GITHUB_TOKEN` is deliberately ignored even if you set it.

Accepted reference formats are listed in
[README → UI routes](README.md#ui-routes). If the diff cannot be read, the API returns an error
rather than scoring a change it never fetched.

### Pair programmer

The service needs one valid LLM key visible to it (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`,
`GROQ_API_KEY`, `GEMINI_API_KEY`, `OPENROUTER_API_KEY` or `DEEPSEEK_API_KEY`), optionally
`AIDER_MODEL` to pin a model. It validates that key against the provider before every run and
refuses to start a session with an unconfigured or invalid credential. See
[aider-service/README.md](aider-service/README.md).

---

## 3. Install & start

### Step A — Node dependencies

```bash
cd frontend
npm install
```

### Step B — Python dependencies (pair programmer only)

```bash
pip install -r aider-service/requirements.txt
pip install -r aider-source/requirements.txt
```

### Step C — Aider service (port 8001)

```bash
cd aider-service
uvicorn main:app --port 8001 --reload
```

> Uvicorn binds `127.0.0.1` by default, which is what the service expects: it executes
> subprocesses with host privileges and has no authentication. Do not expose it with
> `--host 0.0.0.0`.

### Step D — Seed local demo state

```bash
cd frontend
npm run seed
```

Expect:

```
🌱 Seeding Acme Platform memorybank and initial runs...
✅ Loaded 12 historical memories.
✅ Loaded 3 evaluation runs.
✅ Loaded 5 causal timeline nodes.
✅ Loaded 5 team standards.
🎉 Seed complete!
```

This resets `frontend/data/app_state.json` to the seeded dataset. **Restart the dev server after
seeding** — the store is cached in module memory for the lifetime of the process, so a running
server keeps serving the old state.

### Step E — Run the unit tests (no credentials needed)

```bash
cd frontend
npm test
```

Expect `# tests 27` · `# pass 27` · `# fail 0`. These run on Node's built-in test runner via `tsx`,
so there is nothing extra to install and no server has to be running. They cover the diff/line
counters and the pull request reference parser — the two pieces of pure logic that decide how much a
review claims to have read and whether a pasted PR URL is accepted at all.

### Step F — Development server (port 3000)

```bash
cd frontend
npm run dev -- -p 3000
```

Open [http://localhost:3000](http://localhost:3000).

> Pass `-p 3000` explicitly. If your shell already defines `PORT` (some agent harnesses set
> `PORT=0`), `next dev` binds a random ephemeral port instead of 3000.

---

## 4. Verify the install

```bash
# Core pages return 200
for r in / /dashboard /github-review /analyze /memory /timeline /standards /teach \
         /pair-programmer /report/42 /settings; do
  printf "%-18s " "$r"; curl -s -o /dev/null -w "%{http_code}\n" "http://127.0.0.1:3000$r"
done

# Live status of the memory + model providers
curl -s http://127.0.0.1:3000/api/health

# Real memory-bank totals + a live Hindsight connection check (this is what the sidebar shows)
curl -s http://127.0.0.1:3000/api/pulse

# Seeded runs are readable
curl -s http://127.0.0.1:3000/api/runs

# A blank snippet is refused rather than scored (expect HTTP 400)
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://127.0.0.1:3000/api/analyze \
  -H 'content-type: application/json' -d '{}'

# Settings round-trip: save the General tab, then read it back
curl -s -X PUT http://127.0.0.1:3000/api/settings -H 'content-type: application/json' \
  -d '{"tab":"General","values":{"primary":"ReVise Engineering"}}'
curl -s http://127.0.0.1:3000/api/settings

# A report id that does not exist is reported as such (expect HTTP 404)
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/api/runs/does-not-exist

# Pair-programming service reachability (port 8001)
curl -s http://127.0.0.1:3000/api/aider/health
```

`/api/health` reports the truth about your configuration: `hindsight` shows whether the Hindsight
bank answered (with latency), and `groq.configured` distinguishes "Live Groq LPU" from
"Active (Simulator Fallback Ready)".

The sidebar reads `/api/pulse` for its counter and connection pill, so what it shows is the real
state of the local bank. If it reads *local only*, the Hindsight cloud did not answer and recall is
being served from the local store — see the troubleshooting table below.

---

## 5. Demo flow

The verified step-by-step table lives in [README → Demo walkthrough](README.md#demo-walkthrough-verified).
For presenting, walk these five beats in order:

1. **Frame it at `/`** — "memory is the missing half of code review": a stateless reviewer sees a
   lock; ReVise sees the incident that lock caused.
2. **Prove it at `/github-review`** — paste a real public PR URL and let it fetch the live diff.
   Point at the risk score, the named files, and the memory citations; then paste a bogus PR number
   to show it *refuses* to score a change it could not read (`502` + the real reason).
3. **Show the chain at `/timeline`** — `PR #142 warning → RUN-889 rollback → INC-024 SEV-2 → PM-024
   playbook → PR #167 prevented`, then `/standards` for the rule derived from it.
4. **Close the loop at `/teach`** — record an outcome and show it being retained/reinforced, so the
   next review recalls it.
5. **Optionally `/pair-programmer`** — a memory-grounded Aider session returning a real unified
   diff, if the Python service is running.

---

## 6. Reset the demo state

```bash
cd frontend && npm run seed     # reset to the seeded dataset
```

Expect `12 historical memories · 3 evaluation runs · 5 timeline nodes · 5 standards`, then
**restart the dev server** (see Step D) so the cached store matches the freshly written file.
`frontend/data/app_state.json` is git-ignored and safe to delete — the app re-initialises from
`frontend/src/lib/seed-data.ts` on next start.

> **`POST /api/seed` is the programmatic equivalent.** When an `hsk_` Hindsight key is configured it
> mirrors the baseline memories into Hindsight as well, using a sync-only write that cannot duplicate
> local entries — a reset stays at 12 memories either way.

---

## 7. Troubleshooting

| Symptom | Cause | Fix |
| :--- | :--- | :--- |
| Every route returns `500`; server log says *"stream did not contain valid UTF-8"* | A source file was saved with a non-UTF-8 encoding — one bad route poisons the whole dev build | Re-save the file as UTF-8. This happened once via stray `0x95` bytes in `frontend/src/app/pricing/page.tsx`. |
| `next dev` starts on a random port | `PORT` is exported in your shell (commonly `PORT=0` in agent harnesses) | `npm run dev -- -p 3000` |
| Env vars appear ignored | `.env.local` sits at the repository root | Move it to `frontend/.env.local` |
| Pair programmer reports *"No LLM API key found in environment"* | Keys are only in `frontend/.env.local`, but the service reads the **root** `.env.local` | Put the key in the root `.env.local` too |
| `npm run seed` has no visible effect | The server caches the store in memory for its lifetime | Restart the dev server |
| `400` from `/api/analyze` with *"code_snippet is required"* | The request contained no code. The endpoint refuses to score a change it never read | Send the snippet or diff in `code_snippet` |
| `502` from `/api/github/analyze` with *"GitHub resource not found"* | The repository is private, or the number does not exist | Use a public pull request; no run is persisted on this path |
| `500` on `/api/github/analyze`, *"rate limit"* in the message | Anonymous GitHub allows ~60 requests/hour per IP | Wait for the reset time in the error message |
| `404` for a repository that exists | The repository is private; anonymous access cannot see it | Use a public repository |
| `Aider backend service is unreachable at http://localhost:8001` | The FastAPI service is not running | Start it (Step C) or fix `AIDER_SERVICE_URL` |
| Reviews take ~18s | `GROQ_FALLBACK_MODEL` names a model Groq has retired; the app skips it, but a live model may still be missing from your key's allowance | Check the configured model against the list the Groq console shows for your key; `openai/gpt-oss-120b` is the default primary. |
| Stale behaviour after editing shared code | A previous layout left build artifacts at the repository root | Ignore/remove root `node_modules/` and `.next/`; the live app is `frontend/` |
