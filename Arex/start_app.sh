#!/bin/bash

# Start all services in background
if command -v livekit-server >/dev/null 2>&1; then
  livekit-server --dev &
else
  echo "Warning: livekit-server not found. Skipping local LiveKit startup and using your configured LIVEKIT_URL instead."
fi

if command -v uv >/dev/null 2>&1; then
  (cd backend && uv run python src/agent.py dev) &
elif [ -x "backend/.venv/bin/python" ]; then
  (cd backend && .venv/bin/python src/agent.py dev) &
else
  (cd backend && python3 src/agent.py dev) &
fi
(cd frontend && pnpm dev) &

# Wait for all background jobs
wait
