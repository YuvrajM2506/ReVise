# ReVise Aider Service

A small FastAPI service (port `8001`) that runs [Aider](https://aider.chat) pairing sessions
non-interactively inside a throwaway sandbox, with organizational memories injected into the prompt.

See also: [ReVise README](../README.md) · [Setup & demo guide](../SETUP.md).

It is the backend for the **AI Pair Programmer** workspace (`/pair-programmer`) and the
`/pair-programmer` hand-off from a review report. The Next.js app never talks to Aider directly; it
proxies through `/api/aider/health`, `/api/aider/run` and `/api/aider/chat`.

```
/pair-programmer  ──►  /api/aider/run (Next.js)  ──►  POST /run (this service)
                                                        │
                                                        ├─ validate LLM credential against the provider
                                                        ├─ clone repo into temp dir
                                                        ├─ append retrieved memories to the task
                                                        └─ run `python -m aider --yes-always …`, return the diff
```

## Requirements

- Python 3.11+
- `pip install -r requirements.txt` (FastAPI, Uvicorn, Pydantic, requests, python-dotenv, GitPython)
- `pip install -r ../aider-source/requirements.txt` for the vendored Aider engine itself
- `git` on `PATH` (the sandbox clones the target repository)

## Running

```bash
cd aider-service
uvicorn main:app --port 8001 --reload
```

Interactive API docs are served at <http://localhost:8001/docs>.

## Configuration

`main.py` loads environment files in this order, and `python-dotenv` does **not** overwrite values
that are already set — so the first file that defines a key wins:

1. `aider-service/.env`
2. `.env.local` at the repository root
3. `.env` at the repository root

> Note the asymmetry with the web app, which reads only `frontend/.env.local`. If the pair
> programmer reports *"No LLM API key found in environment"* while reviews work, your key is in
> `frontend/.env.local` and needs to be in the root `.env.local` as well.

| Variable | Purpose |
| :--- | :--- |
| `OPENAI_API_KEY` | Provider credential (checked first) |
| `GROQ_API_KEY` | Provider credential (checked second) |
| `ANTHROPIC_API_KEY` | Provider credential (third) |
| `GEMINI_API_KEY` | Provider credential (fourth) |
| `OPENROUTER_API_KEY` | Provider credential (fifth) |
| `DEEPSEEK_API_KEY` | Provider credential (sixth) |
| `AIDER_MODEL` | Optional. Passed to Aider as `--model`; otherwise the provider default is used (`gpt-4o` for OpenAI, etc.) |

At least one credential must be present. The first one that validates against its provider is used;
all others are ignored.

## Endpoints

### `GET /health`, `POST /health`

Both verbs map to the same handler. Performs a **live** credential check against the provider
(`GET /v1/models` for OpenAI, an equivalent probe for each other provider) with a 6-second timeout.
It never returns a canned "healthy".

```json
{
  "status": "healthy",
  "valid": true,
  "provider": "Groq",
  "model": "gpt-4o",
  "message": "Groq API key validated successfully."
}
```

Possible `status` values: `healthy`, `unconfigured`, `invalid_key`, `connection_error`.

### `POST /run`

Request body:

| Field | Type | Required | Meaning |
| :--- | :--- | :--- | :--- |
| `repo_url` | string | yes | Git URL, or a path to a local repository/directory |
| `task` | string | yes | The instruction handed to Aider |
| `target_files` | string[] | no | Files passed to Aider as edit targets |
| `memory_context` | string[] | no | Retrieved memories, appended to the prompt as hard requirements |

Response body:

| Field | Type | Meaning |
| :--- | :--- | :--- |
| `success` | boolean | `false` for credential, clone, timeout or execution failures |
| `diff` | string | Real unified diff produced in the sandbox |
| `files_changed` | string[] | Files touched by the session |
| `log` | string | Combined stdout/stderr from Aider (shown in the UI's log panel) |
| `error` | string \| null | Populated when `success` is `false` |

```bash
curl -s localhost:8001/run -H 'content-type: application/json' -d '{
  "repo_url": "https://github.com/owner/repo",
  "task": "Use CREATE INDEX CONCURRENTLY for the new orders index.",
  "target_files": ["migrations/0012_orders_index.sql"],
  "memory_context": ["PM-024: zero-downtime PostgreSQL migration playbook — never take an exclusive lock on orders."]
}'
```

## What a run does

1. **Validate the credential** — if no valid key is found, the request returns
   `success: false` immediately without touching the repository.
2. **Create a sandbox** — `tempfile.mkdtemp(prefix="revise_aider_")`. Remote URLs are cloned with
   `git clone --depth 1` (90s timeout); local paths are cloned when they are git repositories,
   otherwise copied and re-initialised with `git init` + baseline commit (60s timeout).
3. **Set a git identity** in the sandbox (`ReVise Pair Programmer <pair-programmer@revise.local>`)
   so the diff can be generated.
4. **Build the prompt** — your `task`, followed by a section titled
   *"ORGANIZATIONAL MEMORY & ARCHITECTURAL GUIDANCE FROM REVISE HINDSIGHT"* listing each memory as a
   numbered requirement the solution must satisfy.
5. **Execute Aider** with `PYTHONPATH` pointing at the vendored `../aider-source`:

   ```
   python -m aider --yes-always --no-auto-commits --no-check-update \
     --no-show-release-notes --analytics-disable --no-show-model-warnings \
     --map-tokens 0 [--model MODEL] --message "<task + memories>" [target files…]
   ```

   with a **240-second** wall-clock timeout and stdin closed, so it cannot block on a prompt.
6. **Return** the resulting diff, changed files and the raw log.

## Security and operational notes

- **The sandbox is a temp directory, not a container.** Aider runs with the service's own
  filesystem and network privileges; the clone is isolated, the process is not.
- **CORS is fully open** (`allow_origins=["*"]`) — appropriate for local development, not for
  exposing this service beyond localhost.
- **Nothing is persisted here.** Each run clones fresh; the returned diff is handed back to the
  Next.js app, which owns all state.
- Aider's own config files (`.aider*`) and caches are git-ignored at the repository root.

## Troubleshooting

| Symptom | Cause | Fix |
| :--- | :--- | :--- |
| `{"status": "unconfigured"}` from `/health` | No provider key visible to this process | Add a key to `aider-service/.env` or the **root** `.env.local` |
| `{"status": "invalid_key"}` | The provider rejected the credential | Check the key, and note the first configured provider wins — an invalid `OPENAI_API_KEY` will shadow a valid `GROQ_API_KEY` |
| `success: false`, *"Aider session timed out after 240 seconds"* | Task too large for one shot | Narrow `target_files` or simplify the task |
| `Failed to clone git repository` | Bad URL, private repo, or no network | Verify the URL is publicly cloneable; `git` must be on `PATH` |
| `ModuleNotFoundError: aider` | Vendored source not installed | `pip install -r ../aider-source/requirements.txt` |
| Connection refused from the web app | Service not running, or a different port | Start Uvicorn on 8001 and check `AIDER_SERVICE_URL` in `frontend/.env.local` |
