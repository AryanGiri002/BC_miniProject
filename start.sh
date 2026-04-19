#!/usr/bin/env bash
set -euo pipefail

# ─── Colors ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

log()  { echo -e "${CYAN}[NFT]${RESET} $*"; }
ok()   { echo -e "${GREEN}[OK]${RESET}  $*"; }
warn() { echo -e "${YELLOW}[!!]${RESET}  $*"; }
die()  { echo -e "${RED}[ERR]${RESET} $*"; exit 1; }

# ─── Cleanup on exit ──────────────────────────────────────────────────────────
BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  echo ""
  warn "Shutting down..."
  [[ -n "$BACKEND_PID"  ]] && kill "$BACKEND_PID"  2>/dev/null && ok "Backend stopped"
  [[ -n "$FRONTEND_PID" ]] && kill "$FRONTEND_PID" 2>/dev/null && ok "Frontend stopped"
}
trap cleanup EXIT INT TERM

# ─── Kill stale processes on ports ────────────────────────────────────────────
kill_port() {
  local port=$1
  local pids
  pids=$(lsof -ti tcp:"$port" 2>/dev/null || true)
  if [[ -n "$pids" ]]; then
    warn "Port $port in use (PID $pids) — killing..."
    echo "$pids" | xargs kill -9 2>/dev/null || true
    sleep 0.5
    ok "Port $port is now free"
  fi
}

echo ""
echo -e "${BOLD}╔═══════════════════════════════════════╗${RESET}"
echo -e "${BOLD}║       NFT Marketplace  — START        ║${RESET}"
echo -e "${BOLD}╚═══════════════════════════════════════╝${RESET}"
echo ""

# ─── Pre-flight: check Ganache ────────────────────────────────────────────────
log "Checking Ganache on port 7545..."
if ! lsof -ti tcp:7545 &>/dev/null; then
  die "Ganache is NOT running on port 7545. Open the Ganache app first, then re-run this script."
fi
ok "Ganache is running"

# ─── Free ports ───────────────────────────────────────────────────────────────
kill_port 3001
kill_port 5173

# ─── Backend ──────────────────────────────────────────────────────────────────
log "Starting backend..."
cd "$ROOT/backend"
node server.js &
BACKEND_PID=$!

# Wait until backend is accepting connections (max 15 s)
for i in $(seq 1 30); do
  if lsof -ti tcp:3001 &>/dev/null; then
    ok "Backend ready  → http://localhost:3001"
    break
  fi
  sleep 0.5
  if [[ $i -eq 30 ]]; then
    die "Backend did not start within 15 s — check logs above."
  fi
done

# ─── Frontend ─────────────────────────────────────────────────────────────────
log "Starting frontend..."
cd "$ROOT/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo -e "${GREEN}${BOLD}All services are up!${RESET}"
echo -e "  Backend  → ${CYAN}http://localhost:3001${RESET}"
echo -e "  Frontend → ${CYAN}http://localhost:5173${RESET}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop everything.${RESET}"
echo ""

# ─── Keep script alive ────────────────────────────────────────────────────────
wait
