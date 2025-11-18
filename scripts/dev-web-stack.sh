#!/usr/bin/env bash

set -euo pipefail

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR" || exit 1

FRONTEND_PORT=5173
BACKEND_PORT=3000
FRONTEND_FILTER="spark-template"
BACKEND_FILTER="@petspark/backend"

PIDS=()

log() {
  local color=$1
  shift
  echo -e "${color}$*${NC}"
}

ensure_command() {
  local cmd=$1
  local install_hint=$2
  if ! command -v "$cmd" >/dev/null 2>&1; then
    log "$RED" "✗ Missing required command: $cmd"
    log "$YELLOW" "   Install hint: $install_hint"
    exit 1
  fi
}

kill_port() {
  local port=$1
  if lsof -ti:"$port" >/dev/null 2>&1; then
    log "$YELLOW" "↪ Killing process on port $port"
    lsof -ti:"$port" | xargs kill -9 2>/dev/null || fuser -k "$port"/tcp 2>/dev/null || true
    sleep 1
  fi
}

cleanup() {
  local status=$?
  trap - EXIT INT TERM
  if [[ ${#PIDS[@]} -gt 0 ]]; then
    log "$YELLOW" "↪ Cleaning up running services"
    for pid in "${PIDS[@]}"; do
      if kill -0 "$pid" >/dev/null 2>&1; then
        kill "$pid" 2>/dev/null || true
      fi
    done
    wait "${PIDS[@]}" 2>/dev/null || true
  fi
  exit "$status"
}

trap cleanup EXIT INT TERM

log "$BLUE" "🚀 Booting PetSpark web stack"

ensure_command pnpm "Visit https://pnpm.io/installation"
ensure_command lsof "macOS: brew install lsof"

if [[ ! -f pnpm-lock.yaml ]]; then
  log "$YELLOW" "⚠️  pnpm-lock.yaml not found. Are you at the repo root?"
fi

if [[ ! -d node_modules ]]; then
  log "$YELLOW" "📦 Installing workspace dependencies (pnpm install)"
  pnpm install
fi

kill_port "$FRONTEND_PORT"
kill_port "$BACKEND_PORT"

start_service() {
  local label=$1
  shift
  log "$GREEN" "▶ Starting $label"
  "$@" &
  local pid=$!
  PIDS+=("$pid")
  log "$BLUE" "   $label PID: $pid"
}

start_service "backend" pnpm --filter "$BACKEND_FILTER" dev
sleep 2
start_service "frontend" pnpm --filter "$FRONTEND_FILTER" dev

log "$GREEN" "✨ Backend: http://localhost:$BACKEND_PORT"
log "$GREEN" "✨ Frontend: http://localhost:$FRONTEND_PORT"
log "$BLUE" "Press Ctrl+C to stop both services"

exit_code=0
for pid in "${PIDS[@]}"; do
  if ! wait "$pid"; then
    exit_code=$?
    break
  fi
done

exit "$exit_code"
