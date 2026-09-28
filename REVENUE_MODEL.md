# ReVise Revenue & Monetization Strategy

## Core Philosophy
ReVise is positioned as an enterprise-grade AI Code Reviewer. Our core differentiator is **Hindsight Memory**—the ability to remember organizational context, past incidents, and team standards. Because maintaining this memory requires cloud storage (Vector databases) and executing auto-fixes consumes LLM tokens, our pricing scales with usage and repository complexity.

## Repository Classification
To ensure fair pricing and cover API rate limits (like GitHub's), repositories are classified into three sizes:
- **Small (Indie/Hobby):** < 50k LOC, < 50 commits/month.
- **Medium (Startup/Agency):** 50k - 500k LOC, < 500 commits/month.
- **Large (Enterprise):** 500k+ LOC, Monolithic architecture.

## Pricing Tiers

### 1. Free Tier (Developer Plan)
**Target:** Indie developers, Students, Open Source.
- **Price:**  forever.
- **Limits:** 1 Repository connection.
- **Features:**
  - Up to 30 PR reviews/fixes per month.
  - Hindsight Memory limit: 50MB (Short-term context).
  - Community support.

### 2. Pro Tier (Startup Plan)
**Target:** Small to medium tech teams, fast-moving startups.
- **Price:**  / month per Repository (or  / month per active contributor).
- **Limits:** Up to 10 Repositories.
- **Features:**
  - 500 PR reviews & auto-fixes per month.
  - 1 GB Hindsight Memory (Long-term retention of bugs, post-mortems).
  - Priority GitHub API execution queue.
  - Slack & Microsoft Teams integrations.

### 3. Enterprise Tier
**Target:** Large organizations with strict compliance.
- **Price:** Custom pricing (+/month).
- **Features:**
  - Unlimited Repositories & PRs.
  - Dedicated Hindsight Vector Database instance.
  - Fine-tuned models on the company's codebase.
  - On-Premise / VPC Deployment options.
  - Dedicated support & SLA.

## Additional Monetization Hooks (Upsells)
- **One-Time Deep Sync ():** For large, legacy repositories, analyzing the entire 10-year commit history to build initial Hindsight memory requires massive token usage. We charge a one-time fee to perform this deep baseline scan.
- **Bring Your Own Key (BYOK):** Allow teams to provide their own OpenAI/Anthropic API keys. We charge a flat /month platform fee for UI and Hindsight orchestration while they pay their own inference costs.
