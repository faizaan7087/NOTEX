#!/bin/bash
# ==============================================================================
# NOTEX + AGENT AREX — UNIFIED ONE-CLICK SYSTEM LAUNCHER
# Starts NOTEX Backend, React Client, Agent Arex LiveKit Worker & Arex Frontend
# ==============================================================================

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR" || exit 1

# Colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${BOLD}${CYAN}======================================================${NC}"
echo -e "${BOLD}${CYAN}🚀 NOTEX + AGENT AREX UNIFIED PLATFORM LAUNCHER${NC}"
echo -e "${BOLD}${CYAN}======================================================${NC}"

# Check single .env
if [ ! -f "$ROOT_DIR/.env" ]; then
  echo -e "${YELLOW}⚠️  Root .env not found. Creating from existing configurations...${NC}"
fi

# Ensure symlinks to single .env
ln -sf "$ROOT_DIR/.env" "$ROOT_DIR/server/.env" 2>/dev/null
ln -sf "$ROOT_DIR/.env" "$ROOT_DIR/Arex/.env" 2>/dev/null
ln -sf "$ROOT_DIR/.env" "$ROOT_DIR/Arex/backend/.env.local" 2>/dev/null
ln -sf "$ROOT_DIR/.env" "$ROOT_DIR/Arex/frontend/.env.local" 2>/dev/null

# Clean up any leftover processes on NOTEX & Arex ports
for port in 3000 5001 5173; do
  pids=$(lsof -ti :"$port" 2>/dev/null)
  if [ -n "$pids" ]; then
    echo -e "${YELLOW}Freeing port $port...${NC}"
    kill -9 $pids 2>/dev/null
  fi
done

PIDS=()

cleanup() {
  echo ""
  echo -e "${YELLOW}🛑 Shutting down all NOTEX & Agent Arex processes...${NC}"
  for pid in "${PIDS[@]}"; do
    if kill -0 "$pid" 2>/dev/null; then
      kill -TERM "$pid" 2>/dev/null
    fi
  done
  sleep 1
  for pid in "${PIDS[@]}"; do
    if kill -0 "$pid" 2>/dev/null; then
      kill -KILL "$pid" 2>/dev/null
    fi
  done
  echo -e "${GREEN}✅ All services stopped successfully.${NC}"
  exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# 1. Start NOTEX Backend (Express :5001)
echo -e "${BLUE}▶ Starting NOTEX Backend (Port 5001)...${NC}"
(
  cd "$ROOT_DIR/server" || exit 1
  node server.js 2>&1 | sed "s/^/$(printf "${BLUE}[NOTEX SERVER]${NC} ")/"
) &
PIDS+=($!)

# 2. Start Agent Arex Backend Worker (LiveKit Python Agent)
echo -e "${PURPLE}▶ Starting Agent Arex Worker (LiveKit + Gemini 3.8 Live)...${NC}"
(
  cd "$ROOT_DIR/Arex/backend" || exit 1
  if [ -x ".venv/bin/python" ]; then
    .venv/bin/python src/agent.py dev 2>&1 | sed "s/^/$(printf "${PURPLE}[AREX AGENT ]${NC} ")/"
  elif command -v uv >/dev/null 2>&1; then
    uv run python src/agent.py dev 2>&1 | sed "s/^/$(printf "${PURPLE}[AREX AGENT ]${NC} ")/"
  else
    python3 src/agent.py dev 2>&1 | sed "s/^/$(printf "${PURPLE}[AREX AGENT ]${NC} ")/"
  fi
) &
PIDS+=($!)

# 3. Start Agent Arex Next.js Frontend (:3000)
echo -e "${YELLOW}▶ Starting Agent Arex Whiteboard UI (Port 3000)...${NC}"
(
  cd "$ROOT_DIR/Arex/frontend" || exit 1
  rm -rf .next 2>/dev/null
  if command -v pnpm >/dev/null 2>&1; then
    pnpm dev 2>&1 | sed "s/^/$(printf "${YELLOW}[AREX NEXT  ]${NC} ")/"
  else
    npm run dev 2>&1 | sed "s/^/$(printf "${YELLOW}[AREX NEXT  ]${NC} ")/"
  fi
) &
PIDS+=($!)

# Give backend services a brief moment to initialize before opening client
sleep 2

# 4. Start NOTEX Frontend Client (:5173)
echo -e "${GREEN}▶ Starting NOTEX React Client (Port 5173)...${NC}"
(
  cd "$ROOT_DIR/client" || exit 1
  npm run dev 2>&1 | sed "s/^/$(printf "${GREEN}[NOTEX CLIENT]${NC} ")/"
) &
PIDS+=($!)

echo -e "${BOLD}${GREEN}================================================================${NC}"
echo -e "${BOLD}${GREEN}🌟 NOTEX IS READY! OPEN THE MAIN APPLICATION HERE:${NC}"
echo -e "${BOLD}${CYAN}👉 http://localhost:5173  (NOTEX Dashboard & Workspace)${NC}"
echo -e "${BOLD}${GREEN}================================================================${NC}"
echo -e "${BOLD}• Main Web App:       ${CYAN}http://localhost:5173${NC} (Dashboard, Notes, Arex Feature)"
echo -e "${BOLD}• Backend REST API:   ${CYAN}http://localhost:5001${NC}"
echo -e "${BOLD}• Arex Live Engine:   ${CYAN}http://localhost:3000${NC} (Internal service powering Arex)"
echo -e "${BOLD}• Unified Config:     ${CYAN}$ROOT_DIR/.env${NC}"
echo -e "${BOLD}${GREEN}================================================================${NC}"
echo -e "${YELLOW}Press [Ctrl+C] anytime to stop all services.${NC}"

# Automatically open NOTEX in the default browser on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
  (sleep 3 && open "http://localhost:5173") &
fi

# Wait for background processes
wait

