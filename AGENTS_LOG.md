# ReVise — Agent Engineering & Activity Log

This log chronicles all engineering milestones, architectural decisions, and agent operations performed during the development of **ReVise** — an AI-powered code review and autonomous pair programming agent with persistent causal memory.

---

## 📅 Timeline & Milestone Summary

| Milestone | Area | Description | Status |
| :--- | :--- | :--- | :--- |
| **M1: Memory Client & Graph Engine** | Backend / Core | Integration of Hindsight multi-strategy recall, temporal graph traversal, and token budget pruning. | `COMPLETED` |
| **M2: Synthesis Pipeline & LLM Routing** | Intelligence | Groq LPU integration with structured JSON outputs and fallback heuristic resilience. | `COMPLETED` |
| **M3: Autonomous Pair Programmer** | Microservice / UI | Aider background service (`port 8001`), server proxy routes, and streaming interactive terminal UI. | `COMPLETED` |
| **M4: Route Decoupling & Shell Layout** | UX Architecture | `AppLayout` wrapper separating standalone public landing page from workspace navigation. | `REMOVED` (Phase 6) |
| **M5: Reflect-Inspired Landing Page** | Frontend / Product | Full conversion-focused landing experience with live interactive Memory Studio and evidence cards. | `COMPLETED` |
| **M6: 3D WebGL Hyperspeed Engine** | Graphics / WebGL | React Bits Hyperspeed 3D canvas with brand palette, context attribute guards, and graceful fallbacks. | `REMOVED` (Phase 6) |
| **M7: Frontend Layout Stabilisation** | Build / DevEx | Next.js app moved to `frontend/`, UTF-8 build blocker removed, seed script rewired, env/runtime data relocated. | `COMPLETED` |
| **M8: GitHub Analyzer Integrity** | Correctness / Security | Real PR-URL parsing, anonymous GitHub access, and a hard stop instead of scoring an unread diff. | `COMPLETED` |
| **M9: Evidence Integrity** | Correctness / Data | No endpoint scores what it did not read, reported counters are computed from real data, and user-visible status is observed rather than assumed. | `COMPLETED` |
| **M10: Honest Interfaces** | UX / Data | Settings actually persist, the report page reads real runs, and the dashboard computes its metrics instead of displaying constants. | `COMPLETED` |
| **M11: Production Hardening** | Security / UX | Rate-limited, size-capped write APIs, fabricated panels replaced with observed state, dead CTAs repaired, and the Aider service locked to loopback. | `COMPLETED` |

> **Removed in Phase 6:** the `AppLayout` shell (M4) and the Hyperspeed canvas (M6) belonged to the
> earlier `frontend/src/components/` UI, which the `frontend/src/revise-ui/` workspace replaced. They
> sat unreferenced until Phase 6 deleted the tree and the `three` / `postprocessing` dependencies
> that only existed to support it. The phase entries below are kept as a record of what was built.

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

> *Superseded:* this work belongs to the retired `frontend/src/components/` UI. The files and the
> `three` / `postprocessing` dependencies were deleted in Phase 6; the entries below are kept as a
> record of what was built and why.
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
### Phase 6 — Correctness sweep (2026-09-29)

Fixing the visible lies rather than adding surface area: every change below removes a place where the
product asserted something it had not verified.

- **`/api/analyze` refuses an empty snippet.** It defaulted `code_snippet` to `''` and returned a
  confident risk score for a review of nothing, while also defaulting the title, service and file name
  to a fabricated orders migration that made an empty request look real. It now returns `400`
  (`code_snippet is required`) and the defaults are neutral (`Code analysis`, `local-code`, `snippet.ts`).
- **Real change counters.** New `lib/diff-stats.ts` derives changed files and added/removed lines from
  the text actually reviewed, excluding `+++`/`---` headers. Both analyze routes persist the numbers on
  the run, and `mapRunToReview` surfaces them, replacing the hardcoded `0 files · 0 lines changed` in
  the review header. Runs stored before the counters existed are derived from their snippet instead.
- **`/api/pulse` no longer embellishes.** `total_memories` was `store.memories.length + 30`,
  `remediation_patterns_count` was `+ 6`, `repeated_risks_count` was the constant `3`, the sparkline was
  a literal array, and `hindsight_connected` was hardcoded `true`. All five now come from the store —
  repeated risks are focus areas carried by more than one memory, the sparkline is sampled from real
  memory timestamps, and the route overlays a live Hindsight health check.
- **Live sidebar pills.** `Shell.tsx` read `Memory online` / `Connected` / `847 memories indexed` from
  string constants on every page. It now fetches `/api/pulse` once and distinguishes checking,
  connected, local-only and unknown, so it never claims a status it has not observed.
- **Durable storage.** `saveStore` writes to a sibling temp file and renames, so a crash mid-write can
  no longer truncate the store and cost the whole bank on next boot. Unreadable files are quarantined
  as `app_state.json.corrupt-<ts>` instead of being overwritten, and `normalizeStore` fills absent
  collections so a file from an older build cannot throw inside a request handler.
- **Dead code removed.** `frontend/src/components/` (AppLayout, Sidebar, Header, Hyperspeed plus its
  CSS) had no inbound imports outside itself, and `three`, `@types/three` and `postprocessing` existed
  only for its unused WebGL component. All removed, lockfile re-synced.
- **Tests added.** `cd frontend && npm test` runs 27 assertions on Node's built-in test runner via
  `tsx`, covering the diff/snippet counters and the pull request reference parser (accepted URL forms,
  shorthand forms, and the inputs that must be rejected).
- **Open issues (intentionally untouched)**:
  - Undecided price points are blank in both `frontend/src/app/pricing/page.tsx` and `REVENUE_MODEL.md`;
    inventing numbers would misrepresent the product, so they await a decision.
  - `data/app_state.json` is still last-writer-wins with no locking across concurrent requests.

### Phase 7 — Interfaces that reported work they never did (2026-09-29)

The Phase 6 sweep fixed endpoints. This one fixed the two screens users actually interact with: both
were rendering invented data on top of real APIs, and one was confirming saves that never happened.

- **Settings persist.** `PUT /api/settings` echoed the request body back with `success: true` and
  discarded it, so the page showed "Settings saved." for values that were thrown away. The store now
  holds a `settings` map, the endpoint reads and writes it (`GET` added), and each tab is saved under
  its own key so saving one tab cannot erase another's fields. An empty payload is a `400` rather
  than a false success. The form loads what is stored, prefills from it, and reports the server's
  real outcome — including failures, which it previously could not express.
- **Report page reads real runs.** `ReportPage` ignored the URL entirely and rendered `demoReview`
  with literal `24 / 100`, `3`, `4`, `12`, a `PR #42` badge and a fabricated findings list, so
  `/report/<anything>` produced a confident report for a run that did not exist. It now loads
  `/api/runs/[id]`, renders real values, surfaces the model's actual `safer_rollout` and `ci_checks`
  (previously dropped by the mapper), and shows an explicit not-found state for an unknown id.
- **Dashboard stopped inventing its own metrics.** `HomePage` advertised `847 indexed memories`,
  `+12 this week`, `+18% / -12% / 92%` signals, `18 / 86% / 31` repository activity and a concrete
  `PR #42` review — none of it measured. Every panel now reads the real APIs (strictly, so an
  unreachable endpoint shows as empty rather than substituting bundled demo data), and the aggregates
  (high-risk count, mean risk, findings raised) are computed from stored reviews.
- **Dead report links removed.** The sidebar's Reports item and two landing-page links pointed at a
  hardcoded `/report/42` that no run ever matched. Reports now resolves to the newest stored run and
  falls back to the dashboard only when the store genuinely holds none.
- **Writer hardening.** `retainMemory` captured the store before awaiting Hindsight and wrote that
  reference back afterwards, so a concurrent `POST /api/seed` could be silently undone. Writers now
  re-read the store immediately before mutating it.
- **Verification**: `tsc` clean, 27/27 tests, `next build` compiles, all 21 routes and endpoints
  return `200`. A settings save round-trips from the browser to `app_state.json`; a real run renders
  `physicshub.github.io #391 review` with `RISK 79 / 100`, `1 file · 399 lines`; `/report/42` now
  reports "Review not found".
- **Still fabricated, not yet fixed**: `ReviewResults` renders a bundled mock timeline in the review
  view's Timeline tab, and the pair-programmer panel shows three static "relevant memories" chips.

### Phase 8 — Production-hardening audit (2026-09-29)

**Goal:** the full-project audit pass — every screen, button, API route, service and dependency —
fixing critical bugs first (unauthenticated write endpoints, fabricated UI), then broken
functionality, security, UX, and code quality, without regressing Phases 6–7.

- **API abuse resistance (`lib/rate-limit.ts`, new).** A per-client sliding-window limiter plus a
  size-capped JSON body reader is now the entry gate for the write routes: `/api/analyze` (20/min,
  25k-char snippet ceiling, `413` instead of silent truncation), `/api/github/analyze` (20/min,
  owner/repo URL-syntax rejection), `/api/teach` (10/min), `/api/aider/chat` (30/min),
  `/api/github/backfill` (5/min — anonymous GitHub budget), `/api/aider/run` (5/min),
  `/api/settings` (30/min), `/api/github/outcome` (30/min) and `/api/seed` (3/min — it is
destructive). Verified live: request 11 to `/api/teach` within a minute returns `429` with
  `Retry-After`; malformed JSON returns a JSON `400` instead of a stack-trace `500`.
- **Teach endpoint no longer invents history.** Missing `related_change_title`/`service`/`outcome`
  used to fall back to a fabricated "PR #167 — Add customer-region analytics" story that polluted
  the bank; they are now required, `outcome` is enum-checked, and the bogus hardcoded
  `Unsafe DB migration` focus area (which corrupted pulse repeated-risk counts) is gone. Payloads
  are length-clamped at the boundary.
- **Run-id and list hygiene.** `/api/runs` accepts a validated `?limit=1..100` (the shell only
  needs the newest run, not every stored diff), and `/api/runs/[id]` matches exact full ids.
- **Pricing page repaired and connected.** `/pricing` existed as a Next route but the client router
  had no case for it, so the sidebar could never reach it; its three CTAs (`Get Started`,
  `Start Free Trial`, `Contact Sales`) did nothing and the price cells were empty. The page is now
  routed and linked in the shell nav, CTAs navigate to real product pages, and absent amounts are
  stated openly as a pending business decision rather than rendered as blank strings.
- **ReviewResults de-fabricated.** The review view's Timeline tab rendered the bundled demo
  timeline; it now loads the workspace timeline on demand with loading/empty states and an honest
  caption. The hardcoded `"Low overall risk…"` sentence, invented `4 / 3 / 92%` metric card and
  fixed safer-rollout paragraph are replaced by values derived from the actual run (severity
  breakdown, real memory/finding counts, the model's own rollout and CI steps). The Changed Files
  tab lists files actually named by findings (or says so) instead of three fixed paths with made-up
  `+34/−8` counters. The analyze loading label no longer says "Analyzing Pull Request…" on the
  code page.
- **Pair-programmer panel tells the truth.** The hardcoded "Aider connected" badge now reflects
  `/api/aider/health` (Connected / offline / Checking…), the "3 relevant memories" fiction is
  replaced by the real bank listing, and the sample editor is explicitly labelled as a sample.
  Empty sends are disabled and errors render inline.
- **Memory page grounded in real data.** The six-node knowledge graph with a scripted "Auth
  standard" detail panel was pure fiction; the graph is now derived from the live bank (repo node +
  one node per memory, deterministic layout, keyboard-selectable) and declines to draw below two
  memories. Library and graph reads are strict with real error states + retry; the drawer names
  missing reinforcement history instead of leaving it blank.
- **Standards page strict.** Dead endpoint ⇒ demo cards is now a real error state with retry.
- **App shell integrity.** Notifications button removed (it never did anything), run-list fetch
  trimmed to the newest run, page-level render crashes are caught by an error boundary with retry,
  and the not-found state gained a "Go to dashboard" action.
- **Accessibility.** Modal/Drawer close on Escape and backdrop click, lock body scroll, expose
  `aria-label`s from their titles; Toast is a polite live region; graph nodes respond to Enter and
  Space.
- **Demo data deleted.** `revise-ui/mocks/data.ts` (demoReview/memories/timeline/standards) had no
  remaining importers after the strict-read migration and is removed; the service client keeps
  only strict reads.
- **Aider service hardened (aider-service/main.py).** CORS narrowed from `*` to the localhost dev
  origins, the server binds loopback instead of `0.0.0.0` (it executes subprocesses with no
  auth), `/run` validates payload shape (max task 4000 chars, ≤20 targets, ≤10 memory entries) and
  size, and local `repo_url` paths are restricted to the project checkout.
- **Backfill bank scoping.** `/api/github/backfill` required the client to supply the bank id,
  letting any caller write into an arbitrary cloud bank; it now prefers `HINDSIGHT_BANK_ID`.
- **TeachPage error handling.** A failed teach used to flip the button back and show nothing (or a
  stale success toast); failures now render an `ErrorState` with the server's reason.

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
| **Analysis APIs** | `3000` | `POST /api/analyze`, `/api/github/analyze` | Live diff-backed review; unread diff → `502`, blank snippet → `400`, oversized snippet → `413`, invalid JSON → `400` |
| **Abuse resistance** | `3000` | All write endpoints | Per-client rate limits active; `/api/teach` returns `429` + `Retry-After` on request 11/minute (verified live) |
| **Change counters** | `3000` | Both analyze routes | Real values persisted and rendered — live PR #391 reports `1 file · 399 lines changed` |
| **Status APIs** | `3000` | `GET /api/health`, `/api/runs`, `/api/memory`, `/api/pulse` | `HTTP 200`; pulse returns real store counts plus a live Hindsight check |
| **Settings** | `3000` | `GET`/`PUT /api/settings` | Round-trips through the browser into `app_state.json`; per-tab merge verified; empty payload → `400` |
| **Report route** | `3000` | `GET /report/[id]` | Real run renders `RISK 79 / 100 · 1 file · 399 lines`; unknown id renders "Review not found" |
| **Dashboard** | `3000` | `GET /dashboard` | Every metric derived from `/api/pulse`, `/api/runs`, `/api/memory`, `/api/timeline` |
| **Sidebar status** | `3000` | `GET /` and `/dashboard` | Renders observed state (`12 memories indexed`, `Memory online`) instead of constants |
| **Aider Microservice** | `8001` | `GET /health`, `POST /health`, `POST /run` | Reachable via `/api/aider/health` (`HTTP 200`) |
| **Type check** | N/A | `npx tsc --noEmit` (from `frontend/`) | Clean |
| **Unit tests** | N/A | `cd frontend && npm test` | 27 pass, 0 fail (Node test runner via `tsx`) |
| **Production build** | N/A | `npx next build` (from `frontend/`) | All 31 routes compiled, 0 errors |
| **Seed** | N/A | `cd frontend && npm run seed` | 12 memories · 3 runs · 5 timeline nodes · 5 standards |

---

*Log maintained across ReVise agent sessions; each entry records the phase that produced it.*
