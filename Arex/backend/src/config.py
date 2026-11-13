"""Environment and configuration validation for Telugu-Nova backend."""

from __future__ import annotations

import logging
import os
import sys
from pathlib import Path

logger = logging.getLogger("agent.config")
_parents = Path(__file__).resolve().parents
LOCAL_ENV_FILE = _parents[1] / ".env.local" if len(_parents) > 1 else Path(".env.local")
ROOT_ENV_FILE = _parents[3] / ".env" if len(_parents) > 3 else Path(".env")

REQUIRED_ENV_VARS = [
    ("GOOGLE_API_KEY", "Google Gemini API key running real-time voice, vision & reasoning."),
]

RECOMMENDED_ENV_VARS = [
    ("CLOUDFLARE_ACCOUNT_ID", "Cloudflare account ID for optional topic images."),
    ("CLOUDFLARE_API_TOKEN", "Workers AI token for optional topic images."),
    ("SERPAPI_API_KEY", "SerpApi API key required for source-backed live research."),
    ("LIVEKIT_URL", "LiveKit Server WebSocket URL (e.g. wss://your-project.livekit.cloud)."),
    ("LIVEKIT_API_KEY", "LiveKit API Key."),
    ("LIVEKIT_API_SECRET", "LiveKit API Secret."),
    ("DATABASE_URL", "Neon Serverless Postgres URL for persistent student memory & call analytics."),
]


def validate_environment() -> None:
    """Validate environment variables and issue clear startup diagnostics."""
    if not os.environ.get("GOOGLE_API_KEY") and os.environ.get("GEMINI_API_KEY"):
        os.environ["GOOGLE_API_KEY"] = os.environ["GEMINI_API_KEY"]

    missing_required = []
    for var, desc in REQUIRED_ENV_VARS:
        if not os.environ.get(var, "").strip():
            missing_required.append((var, desc))

    if missing_required:
        logger.error("=" * 60)
        logger.error("MISSING CRITICAL CONFIGURATION:")
        for var, desc in missing_required:
            logger.error("  - %s: %s", var, desc)
        logger.error("Please add missing variables to backend/.env.local and restart.")
        logger.error("=" * 60)

    missing_recommended = []
    for var, desc in RECOMMENDED_ENV_VARS:
        if not os.environ.get(var, "").strip():
            missing_recommended.append((var, desc))

    if missing_recommended:
        for var, desc in missing_recommended:
            logger.info("Optional setting [%s] is not set (%s).", var, desc)
