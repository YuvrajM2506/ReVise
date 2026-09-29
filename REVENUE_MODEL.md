# ReVise — Revenue & Monetization Strategy

> **Status:** draft for the hackathon. Costs and constraints below are grounded in what the
> product actually does today; price figures are not yet decided and are marked `TBD` rather than
> invented. The page at `/pricing` renders the same tiers and states the omission openly instead
> of drawing empty price cells.

## Core philosophy

ReVise is positioned as an enterprise-grade AI code reviewer whose differentiator is **Hindsight
memory** — the ability to remember organizational context, past incidents and team standards.
Unlike a stateless reviewer, that memory has hard running costs: vector storage that must be
retained indefinitely, retrieval on every review, and LLM tokens for both the review and any
auto-fix. Pricing therefore scales with **usage** and **repository complexity**, not seats alone.

## What the tiers are actually selling

The cost drivers are per-review and per-repository, which is why both appear in the model:

| Cost driver | Why it scales |
| :--- | :--- |
| Review inference | One schema-constrained LLM call per review (with retries), proportional to diff size. |
| Memory retrieval | A recall query per review per bank, plus embedding storage that grows monotonically. |
| Auto-fix sessions | Aider runs consume far more tokens than a review and hold a sandbox for up to 4 minutes. |
| Repository breadth | Backfill (`/api/github/backfill`) prices the *entire* PR history of a repository, the most expensive single operation in the product. |

## Repository classification

| Size | Definition | Consequence |
| :--- | :--- | :--- |
| Small (Indie / Hobby) | < 50k LOC, < 50 commits/month | Fits comfortably in a shared bank; diffs rarely hit the 25k-character review cap. |
| Medium (Startup / Agency) | 50k – 500k LOC, < 500 commits/month | Needs multiple banks and backfill; retrieval latency becomes the UX constraint. |
| Large (Enterprise) | 500k+ LOC, monolith | Needs a dedicated bank, scheduled backfill and raised rate limits. |

## Tiers

### 1. Free — Developer

**Target:** indie developers, students, open source.
**Price:** `TBD` (currently drafted as free) · **Repositories:** 1

- Up to 30 reviews per month.
- Short-retention memory (~50 MB budget).
- Community support.
- **Honest caveat:** the shipped build reads GitHub anonymously, capping every install at ~60
  requests/hour (≈30 reviews/hour). A paid tier is what would justify authenticated, higher-rate
  GitHub access.

### 2. Pro — Startup

**Target:** small to medium engineering teams.
**Price:** `TBD` (per repository per month, or per active contributor) · **Repositories:** up to 10

- 500 reviews and auto-fixes per month.
- Long-retention memory (~1 GB): incidents, post-mortems and outcome feedback are kept indefinitely
  so the causal chain survives.
- Priority GitHub API queue.
- Slack / Microsoft Teams integrations.
- Pair-programming sessions (the `aider-service` path) included in the token allowance.

### 3. Enterprise

**Target:** large organizations with compliance requirements.
**Price:** custom · **Repositories:** unlimited

- Unlimited reviews, PRs and backfills.
- Dedicated memory bank / vector database.
- Models fine-tuned on the customer's codebase.
- On-premise or VPC deployment of both services.
- Support and SLA.

## Upsells

- **One-time deep sync.** Backfilling a decade of PR history to bootstrap memory is the largest
  token spend in the product; priced as a one-off per repository.
- **Bring your own key (BYOK).** Teams supply their own Groq/OpenAI/Anthropic key; the platform fee
  covers UI, memory orchestration and the sandbox. This also removes the inference-margin risk from
  the subscription, and it is already technically supported (see the configuration table in
  [README.md](README.md)).

## Decisions still open

1. **Free-tier and Pro price points** — `TBD` here and rendered as an explicit "pricing not final"
   notice in `frontend/src/app/pricing/page.tsx`.
2. **Metering unit** — per review, per repository, or per memory-query. Reviews and auto-fixes have
   very different unit costs, so a single counter may misprice both.
3. **Memory retention as the paywall** — retention duration (not review count) is the axis that
   maps most directly to cost, and the axis a competitor cannot copy quickly.
4. **Whether an unauthenticated build can be sold at all** — anonymous GitHub access is
   rate-limited and cannot post review comments back, so any paid tier needs authenticated access.

## Unit economics to watch

- **Retries are real money.** Retired Groq model IDs are filtered out of the chain before any
  request is sent, but every *live* fallback retry still bills tokens — so the number of models in
  the chain is a direct cost multiplier worth keeping tight.
- **Sandbox time is wall-clock cost.** Pair-programming sessions are capped at 240 seconds plus a
  clone; a session that produces no useful diff still bills tokens.
- **Retrieval is on the critical path.** Hindsight recall is bounded at 4 seconds before the local
  fallback engages, which bounds worst-case review latency but also bounds how much retrieval
  quality can be sold.
