import os
import sys
import shutil
import tempfile
import subprocess
from pathlib import Path
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import requests
from dotenv import load_dotenv

# Load environment variables from local .env and parent .env.local if present
current_dir = Path(__file__).resolve().parent
load_dotenv(current_dir / ".env")
load_dotenv(current_dir.parent / ".env.local")
load_dotenv(current_dir.parent / ".env")

# Path to vendored aider source
AIDER_SOURCE_PATH = (current_dir.parent / "aider-source").resolve()

app = FastAPI(
    title="ReVise Aider Backend Service",
    description="Isolated FastAPI service executing Aider pairing sessions grounded in Hindsight memory.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class RunRequest(BaseModel):
    repo_url: str = Field(..., description="Git URL or local file path to the repository")
    task: str = Field(..., description="The coding task or instructions for Aider")
    target_files: List[str] = Field(default_factory=list, description="Target files to edit")
    memory_context: Optional[List[str]] = Field(
        default_factory=list,
        description="Organizational memories retrieved from Hindsight to guide Aider",
    )


class RunResponse(BaseModel):
    success: bool
    diff: str
    files_changed: List[str]
    log: str
    error: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    valid: bool
    provider: Optional[str] = None
    model: Optional[str] = None
    message: Optional[str] = None
    error: Optional[str] = None


def detect_and_validate_llm_key() -> Dict[str, Any]:
    """
    Actively tests whether the configured LLM API key in the environment is present and valid.
    Never returns hardcoded or fabricated health responses.
    """
    openai_key = os.environ.get("OPENAI_API_KEY", "").strip()
    anthropic_key = os.environ.get("ANTHROPIC_API_KEY", "").strip()
    groq_key = os.environ.get("GROQ_API_KEY", "").strip()
    gemini_key = os.environ.get("GEMINI_API_KEY", "").strip()
    openrouter_key = os.environ.get("OPENROUTER_API_KEY", "").strip()
    deepseek_key = os.environ.get("DEEPSEEK_API_KEY", "").strip()

    if not any([openai_key, anthropic_key, groq_key, gemini_key, openrouter_key, deepseek_key]):
        return {
            "status": "unconfigured",
            "valid": False,
            "provider": None,
            "model": None,
            "error": "No LLM API key found in environment. Please configure OPENAI_API_KEY, GROQ_API_KEY, ANTHROPIC_API_KEY, or GEMINI_API_KEY.",
        }

    # 1. Test OpenAI key if provided
    if openai_key:
        try:
            res = requests.get(
                "https://api.openai.com/v1/models",
                headers={"Authorization": f"Bearer {openai_key}"},
                timeout=6.0,
            )
            if res.status_code == 200:
                return {
                    "status": "healthy",
                    "valid": True,
                    "provider": "OpenAI",
                    "model": os.environ.get("AIDER_MODEL", "gpt-4o"),
                    "message": "OpenAI API key validated successfully.",
                }
            else:
                return {
                    "status": "invalid_key",
                    "valid": False,
                    "provider": "OpenAI",
                    "error": f"OpenAI rejected API key with HTTP {res.status_code}: {res.text[:200]}",
                }
        except requests.RequestException as e:
            return {
                "status": "connection_error",
                "valid": False,
                "provider": "OpenAI",
                "error": f"Failed to connect to OpenAI API: {str(e)}",
            }

    # 2. Test Groq key if provided
    if groq_key:
        try:
            res = requests.get(
                "https://api.groq.com/openai/v1/models",
                headers={"Authorization": f"Bearer {groq_key}"},
                timeout=6.0,
            )
            if res.status_code == 200:
                data = res.json()
                model_ids = [m.get("id") for m in data.get("data", []) if isinstance(m, dict)]
                chosen = None
                for candidate in ["openai/gpt-oss-120b", "llama-3.3-70b-versatile", "llama-3.1-70b-versatile", "qwen/qwen3.8-27b", "openai/gpt-oss-20b"]:
                    if candidate in model_ids:
                        chosen = f"groq/{candidate}"
                        break
                if not chosen and model_ids:
                    chosen = f"groq/{model_ids[0]}"
                elif not chosen:
                    chosen = "groq/openai/gpt-oss-120b"

                return {
                    "status": "healthy",
                    "valid": True,
                    "provider": "Groq",
                    "model": os.environ.get("AIDER_MODEL", chosen),
                    "message": "Groq API key validated successfully.",
                }
            else:
                return {
                    "status": "invalid_key",
                    "valid": False,
                    "provider": "Groq",
                    "error": f"Groq rejected API key with HTTP {res.status_code}: {res.text[:200]}",
                }
        except requests.RequestException as e:
            return {
                "status": "connection_error",
                "valid": False,
                "provider": "Groq",
                "error": f"Failed to connect to Groq API: {str(e)}",
            }

    # 3. Test Anthropic key if provided
    if anthropic_key:
        try:
            res = requests.get(
                "https://api.anthropic.com/v1/models",
                headers={
                    "x-api-key": anthropic_key,
                    "anthropic-version": "2023-06-01",
                },
                timeout=6.0,
            )
            if res.status_code in (200, 400):  # 200 or successful endpoint reach
                return {
                    "status": "healthy",
                    "valid": True,
                    "provider": "Anthropic",
                    "model": os.environ.get("AIDER_MODEL", "claude-3-5-sonnet-20241022"),
                    "message": "Anthropic API key validated successfully.",
                }
            elif res.status_code == 401:
                return {
                    "status": "invalid_key",
                    "valid": False,
                    "provider": "Anthropic",
                    "error": "Anthropic rejected API key (401 Unauthorized).",
                }
            else:
                return {
                    "status": "warning",
                    "valid": False,
                    "provider": "Anthropic",
                    "error": f"Anthropic API returned HTTP {res.status_code}: {res.text[:200]}",
                }
        except requests.RequestException as e:
            return {
                "status": "connection_error",
                "valid": False,
                "provider": "Anthropic",
                "error": f"Failed to connect to Anthropic API: {str(e)}",
            }

    # 4. Test Gemini key if provided
    if gemini_key:
        try:
            res = requests.get(
                f"https://generativelanguage.googleapis.com/v1beta/models?key={gemini_key}",
                timeout=6.0,
            )
            if res.status_code == 200:
                return {
                    "status": "healthy",
                    "valid": True,
                    "provider": "Gemini",
                    "model": os.environ.get("AIDER_MODEL", "gemini/gemini-2.0-flash"),
                    "message": "Gemini API key validated successfully.",
                }
            else:
                return {
                    "status": "invalid_key",
                    "valid": False,
                    "provider": "Gemini",
                    "error": f"Gemini rejected API key with HTTP {res.status_code}: {res.text[:200]}",
                }
        except requests.RequestException as e:
            return {
                "status": "connection_error",
                "valid": False,
                "provider": "Gemini",
                "error": f"Failed to connect to Gemini API: {str(e)}",
            }

    # 5. Test OpenRouter key if provided
    if openrouter_key:
        try:
            res = requests.get(
                "https://openrouter.ai/api/v1/auth/key",
                headers={"Authorization": f"Bearer {openrouter_key}"},
                timeout=6.0,
            )
            if res.status_code == 200:
                return {
                    "status": "healthy",
                    "valid": True,
                    "provider": "OpenRouter",
                    "model": os.environ.get("AIDER_MODEL", "openrouter/anthropic/claude-3.5-sonnet"),
                    "message": "OpenRouter API key validated successfully.",
                }
            else:
                return {
                    "status": "invalid_key",
                    "valid": False,
                    "provider": "OpenRouter",
                    "error": f"OpenRouter rejected API key with HTTP {res.status_code}: {res.text[:200]}",
                }
        except requests.RequestException as e:
            return {
                "status": "connection_error",
                "valid": False,
                "provider": "OpenRouter",
                "error": f"Failed to connect to OpenRouter API: {str(e)}",
            }

    return {
        "status": "unknown",
        "valid": False,
        "error": "No verified LLM provider configured.",
    }


@app.post("/health", response_model=HealthResponse)
@app.get("/health", response_model=HealthResponse)
def health_check():
    """
    Active health check verifying LLM API credentials against upstream providers.
    """
    result = detect_and_validate_llm_key()
    return HealthResponse(**result)


@app.post("/run", response_model=RunResponse)
def run_aider(req: RunRequest):
    """
    Execute Aider non-interactively on a cloned repository with Hindsight organizational memory context.
    """
    if not req.repo_url or not req.repo_url.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Repository URL or path is required.",
        )

    if not req.task or not req.task.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Task instruction is required.",
        )

    # Check LLM key health before starting run
    health = detect_and_validate_llm_key()
    if not health.get("valid"):
        return RunResponse(
            success=False,
            diff="",
            files_changed=[],
            log="",
            error=f"Cannot execute Aider: {health.get('error', 'No valid LLM key found in environment.')}",
        )

    # Prepare temp directory
    temp_dir = tempfile.mkdtemp(prefix="revise_aider_")
    try:
        # Clone repository
        repo_url = req.repo_url.strip()
        is_local_path = os.path.exists(repo_url)

        try:
            if is_local_path:
                local_path = Path(repo_url).resolve()
                # Check if it's a git repo or directory
                git_dir = local_path / ".git"
                if git_dir.exists():
                    clone_cmd = ["git", "clone", str(local_path), temp_dir]
                    clone_res = subprocess.run(clone_cmd, capture_output=True, text=True, timeout=60)
                    if clone_res.returncode != 0:
                        # Fallback: copy tree and init git
                        shutil.rmtree(temp_dir, ignore_errors=True)
                        shutil.copytree(str(local_path), temp_dir, dirs_exist_ok=True)
                        subprocess.run(["git", "init"], cwd=temp_dir, check=True)
                        subprocess.run(["git", "add", "."], cwd=temp_dir, check=True)
                        subprocess.run(
                            ["git", "commit", "-m", "Initial baseline"],
                            cwd=temp_dir,
                            check=True,
                        )
                else:
                    shutil.copytree(str(local_path), temp_dir, dirs_exist_ok=True)
                    subprocess.run(["git", "init"], cwd=temp_dir, check=True)
                    subprocess.run(["git", "add", "."], cwd=temp_dir, check=True)
                    subprocess.run(
                        ["git", "commit", "-m", "Initial baseline"],
                        cwd=temp_dir,
                        check=True,
                    )
            else:
                clone_cmd = ["git", "clone", "--depth", "1", repo_url, temp_dir]
                clone_res = subprocess.run(clone_cmd, capture_output=True, text=True, timeout=90)
                if clone_res.returncode != 0:
                    return RunResponse(
                        success=False,
                        diff="",
                        files_changed=[],
                        log=f"Git clone stderr:\n{clone_res.stderr}\nGit clone stdout:\n{clone_res.stdout}",
                        error=f"Failed to clone git repository from {repo_url}: {clone_res.stderr.strip() or 'Unknown git error'}",
                    )
        except Exception as e:
            return RunResponse(
                success=False,
                diff="",
                files_changed=[],
                log="",
                error=f"Repository preparation failed: {str(e)}",
            )

        # Set temporary git user identity so git commands succeed unconditionally
        subprocess.run(["git", "config", "user.name", "ReVise Pair Programmer"], cwd=temp_dir)
        subprocess.run(["git", "config", "user.email", "pair-programmer@revise.local"], cwd=temp_dir)

        # Record initial commit SHA
        sha_res = subprocess.run(
            ["git", "rev-parse", "HEAD"],
            cwd=temp_dir,
            capture_output=True,
            text=True,
        )
        initial_sha = sha_res.stdout.strip() if sha_res.returncode == 0 else "HEAD"

        # Build prompt with Hindsight memory context
        prompt_parts = [req.task.strip()]

        if req.memory_context and len(req.memory_context) > 0:
            prompt_parts.append("\n\n### ORGANIZATIONAL MEMORY & ARCHITECTURAL GUIDANCE FROM REVISE HINDSIGHT:")
            prompt_parts.append(
                "The following historical incidents, post-mortems, and team standards must be strictly satisfied in your code solution:"
            )
            for idx, memory in enumerate(req.memory_context, 1):
                prompt_parts.append(f"{idx}. {memory.strip()}")
            prompt_parts.append(
                "\nPlease implement the exact safe changes requested, avoiding any historical anti-patterns identified above."
            )

        combined_message = "\n".join(prompt_parts)

        # Build Aider CLI command
        aider_env = os.environ.copy()
        aider_env["PYTHONPATH"] = str(AIDER_SOURCE_PATH) + os.pathsep + aider_env.get("PYTHONPATH", "")

        selected_model = health.get("model") or os.environ.get("AIDER_MODEL")

        cmd = [
            sys.executable,
            "-m",
            "aider",
            "--yes-always",
            "--no-auto-commits",
            "--no-check-update",
            "--no-show-release-notes",
            "--analytics-disable",
            "--no-show-model-warnings",
            "--map-tokens",
            "0",
        ]

        if selected_model:
            cmd.extend(["--model", selected_model])

        cmd.extend([
            "--message",
            combined_message,
        ])

        if req.target_files and len(req.target_files) > 0:
            # Filter and add target files
            valid_targets = [f.strip() for f in req.target_files if f.strip()]
            cmd.extend(valid_targets)

        # Execute Aider subprocess non-interactively
        try:
            proc = subprocess.run(
                cmd,
                cwd=temp_dir,
                env=aider_env,
                stdin=subprocess.DEVNULL,
                capture_output=True,
                text=True,
                timeout=240,  # 4-minute maximum execution timeout
            )
            stdout = proc.stdout or ""
            stderr = proc.stderr or ""
            combined_log = (stdout + ("\n" + stderr if stderr else "")).strip()

        except subprocess.TimeoutExpired as e:
            stdout = e.stdout.decode() if isinstance(e.stdout, bytes) else (e.stdout or "")
            stderr = e.stderr.decode() if isinstance(e.stderr, bytes) else (e.stderr or "")
            return RunResponse(
                success=False,
                diff="",
                files_changed=[],
                log=f"Execution timed out after 240 seconds.\n{stdout}\n{stderr}",
                error="Aider session timed out while generating the code diff.",
            )
        except Exception as e:
            return RunResponse(
                success=False,
                diff="",
                files_changed=[],
                log="",
                error=f"Failed to execute Aider subprocess: {str(e)}",
            )

        # Intent-to-add all new files so git diff captures newly created files as well as edits
        subprocess.run(["git", "add", "-N", "."], cwd=temp_dir)

        # Capture git diff against initial baseline
        diff_res = subprocess.run(
            ["git", "diff", initial_sha],
            cwd=temp_dir,
            capture_output=True,
            text=True,
        )
        git_diff = diff_res.stdout.strip() if diff_res.returncode == 0 else ""

        # Identify all changed files
        files_res = subprocess.run(
            ["git", "diff", "--name-only", initial_sha],
            cwd=temp_dir,
            capture_output=True,
            text=True,
        )
        changed_files = [f.strip() for f in files_res.stdout.splitlines() if f.strip() and not f.strip().endswith(".aider*")]

        # Check success criteria
        is_success = (proc.returncode == 0) and (bool(git_diff) or len(changed_files) > 0)
        error_msg = None

        if proc.returncode != 0:
            error_msg = f"Aider exited with code {proc.returncode}. Inspect the raw log for details."
        elif not git_diff and len(changed_files) == 0:
            error_msg = "Aider completed execution but produced no changes in the repository diff."

        return RunResponse(
            success=is_success,
            diff=git_diff,
            files_changed=changed_files,
            log=combined_log,
            error=error_msg,
        )

    finally:
        # Cleanup temporary directory
        shutil.rmtree(temp_dir, ignore_errors=True)


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("AIDER_SERVICE_PORT", "8001"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
