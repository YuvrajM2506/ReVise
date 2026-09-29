# ReVise — Agent Engineering & Activity Log

This log chronicles all engineering milestones, architectural decisions, and agent operations performed during the development of **ReVise** — an AI-powered code review and autonomous pair programming agent with persistent causal memory.

---

## 📅 Timeline & Milestone Summary

| Milestone | Area | Description | Status |
| :--- | :--- | :--- | :--- |
| **M1: Memory Client & Graph Engine** | Backend / Core | Integration of Hindsight multi-strategy recall, temporal graph traversal, and token budget pruning. | `COMPLETED` |
| **M2: Synthesis Pipeline & LLM Routing** | Intelligence | Groq LPU integration with structured JSON outputs and fallback heuristic resilience. | `COMPLETED` |
| **M3: Autonomous Pair Programmer** | Microservice / UI | Aider background service (`port 8001`), server proxy routes, and streaming interactive terminal UI. | `COMPLETED` |
| **M4: Route Decoupling & Shell Layout** | UX Architecture | `AppLayout` wrapper separating standalone public landing page from workspace navigation. | `COMPLETED` |
| **M5: Reflect-Inspired Landing Page** | Frontend / Product | Full conversion-focused landing experience with live interactive Memory Studio and evidence cards. | `COMPLETED` |
| **M6: 3D WebGL Hyperspeed Engine** | Graphics / WebGL | React Bits Hyperspeed 3D canvas with brand palette, context attribute guards, and graceful fallbacks. | `COMPLETED` |
| **M7: Frontend Layout Stabilisation** | Build / DevEx | Next.js app moved to `frontend/`, UTF-8 build blocker removed, seed script rewired, env/runtime data relocated. | `COMPLETED` |
| **M8: GitHub Analyzer Integrity** | Correctness / Security | Real PR-URL parsing, anonymous GitHub access, and a hard stop instead of scoring an unread diff. | `COMPLETED` |

> **Superseded in M7:** the `AppLayout` shell (M4) and the Hyperspeed canvas (M6) belong to the
> earlier `frontend/src/components/` UI, which the `frontend/src/revise-ui/` workspace replaced.
> Those files remain in the tree but nothing imports them.

---

## 🛠️ Detailed Chronological Log

### [2026-09-27 18:30:00 - 20:15:00] — Phase 1: Core Foundation & Memory Integration
- **Hindsight Memory Layer**: Built multi-strategy recall clients (`semantic`, `entity`, `temporal`, and `composite`) to fetch historic PR regressions and incident reports (`INC-024`, `INC-089`).
- **Groq Synthesis Engine**: Configured high-throughput synthesis models (`llama-3.3-70b-versatile` / `mixtral-8x7b-32768`) with exponential backoff and schema validation.
- **Risk Assessment & Timeline**: Implemented risk scoring algorithms combining blast radius, epistemic uncertainty, and architectural drift metrics.

### [2026-09-27 20:30:00 - 21:45:00] — Phase 2: Autonomous Pair Programmer & Aider Integration
- **Aider Python Microservice (`aider-service`)**:
  - Implemented FastAPI server on `http://127.0.0.1:8001` with `/health` probe and `/run` streaming execution endpoints.
  - Patched LiteLLM token overflow handlers in `aider-source/aider/exceptions.py` to prevent crash loops on large repository contexts.
- **Next.js API Proxies**:
  - Added [`src/app/api/aider/health/route.ts`](file:///c:/Users/Kunal/OneDrive/Desktop/test/ReVise/src/app/api/aider/health/route.ts) for real-time daemon liveness tracking.
  - Added [`src/app/api/aider/run/route.ts`](file:///c:/Users/Kunal/OneDrive/Desktop/test/ReVise/src/app/api/aider/run/route.ts) with `ReadableStream` chunk forwarding to UI.
- **Pair Programmer Workspace (`/pair-programmer`)**:
  - Built full terminal streaming console, auto-scrolling log inspector, diff inspector, and contextual quick-action presets.
  - Connected direct handoff from Risk Report (`/report/[id]`) to jump straight into pair programming with loaded incident context.

### [2026-09-27 22:00:00 - 23:30:00] — Phase 3: Route Decoupling & Reflect-Style Landing Page
- **Shell Decoupling**:
  - Created [`src/components/layout/AppLayout.tsx`](file:///c:/Users/Kunal/OneDrive/Desktop/test/ReVise/src/components/layout/AppLayout.tsx) to conditionally render full-width landing layout on `/` and dashboard layout (sidebar + topbar) on internal routes (`/analyze`, `/pair-programmer`, etc.).
  - Updated [`src/components/layout/Sidebar.tsx`](file:///c:/Users/Kunal/OneDrive/Desktop/test/ReVise/src/components/layout/Sidebar.tsx) and [`Header.tsx`](file:///c:/Users/Kunal/OneDrive/Desktop/test/ReVise/src/components/layout/Header.tsx) with direct links to the new Pair Programmer workspace and home route.
- **Reflect-Inspired Landing Page (`src/app/page.tsx`)**:
  - **Hero**: Thesis statement *"Memory is the missing half of code review"* with live metric pills and dual CTAs.
  - **Interactive Memory Studio**: Toggle comparison between *Memory ON* (ReVise with incident lineage and regression blockers) vs *Memory OFF* (stateless generic reviewer).
  - **Pair Programmer Showcase**: Featured prompt suggestions and launchpad into autonomous code editing.
  - **Capability Grid & Evidence**: 6 deep architectural capabilities, real PR cards (`PR #142`, `INC-024`), and a 3-stage memory pipeline walk.

### [2026-09-28 03:00:00 - 04:05:00] — Phase 4: React Bits 3D Hyperspeed & WebGL Resilience
- **3D Canvas Integration**:
  - Installed `three`, `postprocessing`, and `@types/three`.
  - Created [`src/components/ui/Hyperspeed.tsx`](file:///c:/Users/Kunal/OneDrive/Desktop/test/ReVise/src/components/ui/Hyperspeed.tsx) and [`Hyperspeed.css`](file:///c:/Users/Kunal/OneDrive/Desktop/test/ReVise/src/components/ui/Hyperspeed.css) using `REVISE_HYPERSPEED_PRESET` (Dark Navy `#080911`, Indigo `#6C5CE7`, Electric Purple `#A855F7`, Cyan `#00F0FF`).
- **Client-Side Exception Resolution**:
  - **Issue Diagnosed**: `TypeError: Cannot read properties of null (reading 'alpha')` in `EffectComposer.prototype.addPass` caused by uninitialized/null WebGL context attributes on certain GPUs.
  - **Fix Implemented**: Polyfilled `gl.getContextAttributes()` safely and wrapped postprocessing pass initializers in resilient `try/catch` fallbacks to standard Three.js rendering.
- **Production Build & Health Checks**:
  - `npm run build` verified: 20/20 static and dynamic routes compiled with **0 errors**.
  - Verified live `HTTP 200` responses across `/`, `/pair-programmer`, `/analyze`, and `/api/aider/health`.

### [2026-09-29] — Phase 5: Frontend Layout Stabilisation, Analyzer Integrity & Documentation

- **Repository layout**: the Next.js app now lives in `frontend/`; the root `node_modules/` and `.next/` are stale artifacts of the previous root-level layout. Node dependencies installed under `frontend/`, environment moved to `frontend/.env.local` (Next only reads the file beside the app), runtime state to `frontend/data/`.
- **UTF-8 build blocker**: `frontend/src/app/pricing/page.tsx` contained 14 stray `0x95` bytes (cp1252 bullets). The loader error poisoned the entire dev build, so **every** route returned `500`. Bytes normalised to `•`; the same class of defect was found in `REVENUE_MODEL.md` (one `0x97`) and fixed.
- **Pricing page**: an import from the non-existent `@/revise-ui/components/layout` was corrected to the shared UI kit, and `"use client"` added because that kit uses hooks.
- **GitHub reference parsing**: the previous regex required a literal `PR` or `#`, so a real `https://github.com/owner/repo/pull/391` URL threw before any request was sent (the button failed with no server-side trace). Replaced with `parseGitHubReference()` supporting `/pull/N` URLs, `owner/repo PR #12`, `owner/repo · PR 12` and `owner/repo#12`, with owner/repo character sets constrained so the number can never be absorbed into the repo name.
- **Unread-diff integrity fix**: `/api/github/analyze` used to swallow GitHub fetch failures and evaluate an empty diff, returning a confident score (e.g. `risk 10/100, Low`) for a pull request it never read. It now returns `502` with the real reason and persists **no** run, and reports partial failures through a `warnings[]` response field.
- **Anonymous GitHub access**: the `GITHUB_TOKEN` requirement was removed by decision; errors now distinguish 404 (private or missing repository), 403/429 (anonymous 60 requests/hour) and 401, and `postPullReview` fails with an explicit message instead of attempting an impossible authenticated write.
- **Memory bank scoping**: PR reviews resolve the bank as explicit `bankId` → `HINDSIGHT_BANK_ID` → `"<owner>/<repository>"`, so a real repository retrieves organizational memory instead of querying an empty per-repo bank.
- **Error surfacing**: the API client now throws the handler's `error` field and `ErrorState` renders it (with a retry action) instead of a generic message.
- **Seed wiring**: `frontend/package.json` now runs `tsx ../scripts/seed.ts`, so the documented `cd frontend && npm run seed` works; it previously referenced a non-existent `frontend/scripts/`.
- **Seed duplication fixed**: `retainMemory()` gained a `sync_only` option that writes to Hindsight without inserting a second local copy. `POST /api/seed` uses it and re-reads the store for its counts, so a reset stays at 12 memories instead of growing to 17 with duplicate titles.
- **Retired model filtering**: `lib/groq.ts` now filters a `DECOMMISSIONED_MODELS` set out of the candidate chain and defaults to models Groq actually serves (`openai/gpt-oss-20b`, `qwen/qwen3.8-27b`). A stale `GROQ_FALLBACK_MODEL` is skipped for free rather than costing three timed-out retries per review.
- **Verification**: all 14 routes/endpoints return `200`; `npx tsc --noEmit` clean (a pre-existing `aria-label` type error that blocked `next build` was fixed); a live public PR (`physicshub/physicshub.github.io#391`) produced a genuine diff-backed review (25,047-char truncated diff, `Risk 79 / HIGH`, 4 memory citations), while a bogus repository returned `502` with no run stored.
- **Documentation**: `README.md` rewritten as the architecture/route/API/configuration reference, `SETUP.md` as the operational and troubleshooting guide, `aider-service/README.md` added for the pairing service, and `REVENUE_MODEL.md` aligned with shipped capabilities (undecided price points marked `TBD` rather than invented).
- **Open issues found while verifying the documentation (documented, not yet fixed)**:
  - `/api/analyze` accepts an empty `code_snippet` and will return a risk score for a review of nothing, unlike `/api/github/analyze` which now refuses to score an unread diff.
  - The sidebar counters (`847 memories indexed`, `Memory online`) are static constants and do not reflect `/api/health`.
  - Undecided price points are blank in both `frontend/src/app/pricing/page.tsx` and `REVENUE_MODEL.md`.

---

## 🔒 Verification & Health Status

Last full check: **2026-09-29**, dev server started from `frontend/` with an explicit port
(`npm run dev -- -p 3000`) because the harness exports `PORT=0`.

| Component | Port | Endpoint | Verification |
| :--- | :--- | :--- | :--- |
| **Landing / workspace shell** | `3000` | `GET /` | `HTTP 200` |
| **Dashboard** | `3000` | `GET /dashboard` | `HTTP 200` |
| **Pull Request Review** | `3000` | `GET /github-review` | `HTTP 200` |
| **Code analysis** | `3000` | `GET /analyze` | `HTTP 200` |
| **Pair Programmer** | `3000` | `GET /pair-programmer` | `HTTP 200` |
| **Memory / Timeline / Standards** | `3000` | `GET /memory`, `/timeline`, `/standards` | `HTTP 200` |
| **Teach / Reports / Settings / Pricing** | `3000` | `GET /teach`, `/report/[id]`, `/settings`, `/pricing` | `HTTP 200` |
| **Analysis APIs** | `3000` | `POST /api/analyze`, `/api/github/analyze` | Live diff-backed review; unread diff → `502`, no run persisted |
| **Status APIs** | `3000` | `GET /api/health`, `/api/runs`, `/api/memory` | `HTTP 200` |
| **Aider Microservice** | `8001` | `GET /health`, `POST /health`, `POST /run` | Reachable via `/api/aider/health` (`HTTP 200`) |
| **Type check** | N/A | `npx tsc --noEmit` (from `frontend/`) | Clean |
| **Seed** | N/A | `cd frontend && npm run seed` | 12 memories · 3 runs · 5 timeline nodes · 5 standards |

---

*Log maintained across ReVise agent sessions; each entry records the phase that produced it.*
