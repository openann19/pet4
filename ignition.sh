#!/bin/bash

# Enhanced Ignition Script - Starts All Services with Bypass Options
# Starts all services, seed data, and dev environment with login bypass

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# We're already in the project root, no need to go up
PROJECT_ROOT="$SCRIPT_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
BYPASS_LOGIN=${BYPASS_LOGIN:-true}
SKIP_TYPECHECK=${SKIP_TYPECHECK:-false}
SKIP_LINT=${SKIP_LINT:-false}
START_BACKEND=${START_BACKEND:-true}
START_WEB=${START_WEB:-true}
START_MOBILE=${START_MOBILE:-true}

echo -e "${PURPLE}🚀 PetSpark Enhanced Ignition Script${NC}"
echo -e "${CYAN}=============================================${NC}"
echo ""

# Help menu
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    echo -e "${BLUE}Usage: $0 [options]${NC}"
    echo ""
    echo -e "${YELLOW}Options:${NC}"
    echo "  --help, -h          Show this help message"
    echo "  --no-bypass         Disable login bypass"
    echo "  --skip-typecheck    Skip TypeScript type checking"
    echo "  --skip-lint         Skip ESLint checking"
    echo "  --web-only          Start only web services"
    echo "  --mobile-only       Start only mobile services"
    echo "  --backend-only      Start only backend services"
    echo ""
    echo -e "${YELLOW}Environment Variables:${NC}"
    echo "  BYPASS_LOGIN=true|false        Enable/disable login bypass (default: true)"
    echo "  SKIP_TYPECHECK=true|false      Skip typecheck (default: false)"
    echo "  SKIP_LINT=true|false           Skip linting (default: false)"
    echo "  START_BACKEND=true|false       Start backend services (default: true)"
    echo "  START_WEB=true|false            Start web app (default: true)"
    echo "  START_MOBILE=true|false         Start mobile app (default: true)"
    exit 0
fi

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --no-bypass)
            BYPASS_LOGIN=false
            shift
            ;;
        --skip-typecheck)
            SKIP_TYPECHECK=true
            shift
            ;;
        --skip-lint)
            SKIP_LINT=true
            shift
            ;;
        --web-only)
            START_BACKEND=false
            START_MOBILE=false
            shift
            ;;
        --mobile-only)
            START_BACKEND=false
            START_WEB=false
            shift
            ;;
        --backend-only)
            START_WEB=false
            START_MOBILE=false
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Use --help for available options"
            exit 1
            ;;
    esac
done

# Display configuration
echo -e "${CYAN}Configuration:${NC}"
echo -e "  Login Bypass: ${GREEN}$BYPASS_LOGIN${NC}"
echo -e "  Skip Typecheck: ${YELLOW}$SKIP_TYPECHECK${NC}"
echo -e "  Skip Lint: ${YELLOW}$SKIP_LINT${NC}"
echo -e "  Start Backend: ${GREEN}$START_BACKEND${NC}"
echo -e "  Start Web: ${GREEN}$START_WEB${NC}"
echo -e "  Start Mobile: ${GREEN}$START_MOBILE${NC}"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js not found. Please install Node.js 18+${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}✗ Node.js 18+ required. Found: $(node -v)${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js $(node -v)${NC}"

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}✗ pnpm not found. Please install pnpm${NC}"
    exit 1
fi

echo -e "${GREEN}✓ pnpm $(pnpm -v)${NC}"

# Install dependencies
if [ ! -d "node_modules" ] || [ ! -d "apps/web/node_modules" ] || [ ! -d "apps/mobile/node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"

    # Install root dependencies
    pnpm install
    # Install web app dependencies
    cd apps/web && pnpm install && cd ../..
    # Install mobile app dependencies
    cd apps/mobile && pnpm install --frozen-lockfile && cd ../..
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Dependencies already installed${NC}"
fi

# Kill existing processes
echo -e "${YELLOW}🔍 Checking for existing servers...${NC}"
PORTS=(5173 3000 8081 19002)
for port in "${PORTS[@]}"; do
    if lsof -ti:$port > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Killing process on port $port...${NC}"
        lsof -ti:$port | xargs kill -9 2>/dev/null || fuser -k $port/tcp 2>/dev/null
        sleep 1
    fi
done
echo -e "${GREEN}✓ Ports cleared${NC}"

# Create environment files with bypass settings
if [ "$BYPASS_LOGIN" = true ]; then
    echo -e "${PURPLE}🔓 Setting up login bypass...${NC}"

    # Web app environment
    cat > apps/web/.env.local << EOF
# Login Bypass Configuration
VITE_BYPASS_LOGIN=true
VITE_AUTO_LOGIN_USER=admin
VITE_DEV_MODE=true
VITE_SKIP_AUTH=true
VITE_MOCK_API=true
EOF

    # Mobile app environment
    cat > apps/mobile/.env << EOF
# Login Bypass Configuration
EXPO_PUBLIC_BYPASS_LOGIN=true
EXPO_PUBLIC_AUTO_LOGIN_USER=admin
EXPO_PUBLIC_DEV_MODE=true
EXPO_PUBLIC_SKIP_AUTH=true
EXPO_PUBLIC_MOCK_API=true
EOF

    echo -e "${GREEN}✓ Login bypass configured${NC}"
fi

# Run typecheck (if not skipped)
if [ "$SKIP_TYPECHECK" = false ]; then
    echo -e "${YELLOW}🔍 Running typecheck...${NC}"
    if pnpm typecheck > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Typecheck passed${NC}"
    else
        echo -e "${RED}✗ Typecheck failed${NC}"
        if [ "$BYPASS_LOGIN" = true ]; then
            echo -e "${YELLOW}⚠️  Continuing anyway (bypass mode enabled)${NC}"
        else
            echo -e "${RED}❌ Fix type errors before continuing${NC}"
            exit 1
        fi
    fi
else
    echo -e "${YELLOW}⏭️  Skipping typecheck${NC}"
fi

# Run lint (if not skipped)
if [ "$SKIP_LINT" = false ]; then
    echo -e "${YELLOW}🔍 Running ESLint...${NC}"
    if pnpm lint > /dev/null 2>&1; then
        echo -e "${GREEN}✓ ESLint passed${NC}"
    else
        echo -e "${RED}✗ ESLint failed${NC}"
        if [ "$BYPASS_LOGIN" = true ]; then
            echo -e "${YELLOW}⚠️  Continuing anyway (bypass mode enabled)${NC}"
        else
            echo -e "${RED}❌ Fix lint errors before continuing${NC}"
            exit 1
        fi
    fi
else
    echo -e "${YELLOW}⏭️  Skipping ESLint${NC}"
fi

# Seed data setup
echo -e "${YELLOW}📊 Setting up seed data...${NC}"
if [ -f "apps/web/src/lib/seedData.ts" ]; then
    echo -e "${GREEN}✓ Seed data will be generated on first run${NC}"
fi

# Function to start service in background
start_service() {
    local service_name=$1
    local command=$2
    local port=$3

    echo -e "${BLUE}🚀 Starting $service_name on port $port...${NC}"
    $command > logs/$service_name.log 2>&1 &
    local pid=$!
    echo $pid > logs/$service_name.pid

    # Wait a moment and check if service started
    sleep 3
    if kill -0 $pid 2>/dev/null; then
        echo -e "${GREEN}✓ $service_name started (PID: $pid)${NC}"
        return 0
    else
        echo -e "${RED}✗ $service_name failed to start${NC}"
        return 1
    fi
}

# Create logs directory
mkdir -p logs

# Start services based on configuration
echo ""
echo -e "${PURPLE}🎯 Starting Services...${NC}"
echo ""

if [ "$START_BACKEND" = true ]; then
    echo -e "${CYAN}Backend Services:${NC}"
    # Add backend startup logic here when backend is implemented
    echo -e "${YELLOW}⚠️  Backend services not yet implemented${NC}"
    echo ""
fi

if [ "$START_WEB" = true ]; then
    echo -e "${CYAN}Web Application:${NC}"
    cd apps/web
    start_service "web" "pnpm dev" "5173"
    cd "$PROJECT_ROOT"
    echo -e "${BLUE}📍 Web App: http://localhost:5173${NC}"
    echo -e "${BLUE}📍 Admin: http://localhost:5173/admin${NC}"
    echo ""
fi

if [ "$START_MOBILE" = true ]; then
    echo -e "${CYAN}Mobile Application:${NC}"
    cd apps/mobile
    start_service "mobile" "pnpm start" "8081"
    cd "$PROJECT_ROOT"
    echo -e "${BLUE}📍 Mobile Expo: http://localhost:8081${NC}"
    echo ""
fi

# Final summary
echo -e "${PURPLE}=============================================${NC}"
echo -e "${GREEN}✨ PetSpark Environment Ready!${NC}"
echo ""

if [ "$BYPASS_LOGIN" = true ]; then
    echo -e "${PURPLE}🔓 Login Bypass Active:${NC}"
    echo -e "  • Auto-login as admin user"
    echo -e "  • Authentication disabled"
    echo -e "  • Mock API enabled"
    echo ""
fi

echo -e "${CYAN}Service URLs:${NC}"
if [ "$START_WEB" = true ]; then
    echo -e "  🌐 Web App: ${BLUE}http://localhost:5173${NC}"
fi
if [ "$START_MOBILE" = true ]; then
    echo -e "  📱 Mobile Expo: ${BLUE}http://localhost:8081${NC}"
fi
echo ""

echo -e "${CYAN}Management Commands:${NC}"
echo -e "  🛑 Stop all: ${YELLOW}pkill -f 'pnpm.*dev|pnpm.*start'${NC}"
echo -e "  📊 View logs: ${YELLOW}tail -f logs/web.log${NC}"
echo -e "  🔄 Restart: ${YELLOW}$0${NC}"
echo ""

echo -e "${GREEN}🎉 Happy coding!${NC}"

# Keep script running to show logs if in interactive mode
if [[ -t 0 ]]; then
    echo -e "${CYAN}Press Ctrl+C to stop monitoring logs...${NC}"
    echo ""

    # Show combined logs
    tail -f logs/*.log 2>/dev/null || {
        echo -e "${YELLOW}No log files available yet${NC}"
        echo -e "${CYAN}Services are running in the background${NC}"
    }
fi
