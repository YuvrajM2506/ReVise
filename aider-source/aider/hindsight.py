import os
import requests
from dotenv import load_dotenv

load_dotenv()
load_dotenv("../.env")


HINDSIGHT_BASE_URL = os.environ.get(
    "HINDSIGHT_BASE_URL",
    "https://api.hindsight.vectorize.io",
)

HINDSIGHT_API_KEY = os.environ.get("HINDSIGHT_API_KEY", "")

DEFAULT_BANK_ID = os.environ.get(
    "HINDSIGHT_BANK_ID",
    os.environ.get("HINDSIGHT_PROJECT_ID", "acme-platform"),
)


def recall_memories(query, service="code-review", top_k=4):
    """Recall relevant memories from Hindsight."""

    if not HINDSIGHT_API_KEY:
        return []

    if not HINDSIGHT_API_KEY.startswith("hsk_"):
        return []

    url = (
        f"{HINDSIGHT_BASE_URL}/v1/default/banks/"
        f"{DEFAULT_BANK_ID}/memories/recall"
    )

    headers = {
        "Authorization": f"Bearer {HINDSIGHT_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "query": f"{query} {service}",
        "budget": "mid",
        "max_tokens": 1500,
        "types": [
            "experience",
            "observation",
            "world",
        ],
    }

    try:
        response = requests.post(
            url,
            headers=headers,
            json=payload,
            timeout=15,
        )

        if not response.ok:
            return []

        data = response.json()
        memories = data.get("results", [])

        return memories[:top_k]

    except requests.RequestException:
        return []


def retain_memory(
    title,
    content,
    service="code-review",
    memory_type="experience",
    tags=None,
    metadata=None,
):
    """Store a new code-review memory in Hindsight."""

    if not HINDSIGHT_API_KEY:
        return None

    if not HINDSIGHT_API_KEY.startswith("hsk_"):
        return None

    url = (
        f"{HINDSIGHT_BASE_URL}/v1/default/banks/"
        f"{DEFAULT_BANK_ID}/memories"
    )

    headers = {
        "Authorization": f"Bearer {HINDSIGHT_API_KEY}",
        "Content-Type": "application/json",
    }

    tags = tags or []
    metadata = metadata or {}

    payload = {
        "items": [
            {
                "content": f"{title}\n\n{content}",
                "context": f"Service: {service}, Type: {memory_type}",
                "tags": [service, memory_type, *tags],
                "metadata": {
                    **metadata,
                    "title": title,
                    "service": service,
                    "type": memory_type,
                },
            }
        ]
    }
    try:
        response = requests.post(
            url,
            headers=headers,
            json=payload,
            timeout=15,
        )

        if not response.ok:
            return None

        return response.json()

    except requests.RequestException:
        return None