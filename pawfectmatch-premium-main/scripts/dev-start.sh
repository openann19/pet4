#!/bin/bash

# One-Command Dev Startup Script
# Starts all services, seed data, and dev environment

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT" || exit 1

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Starting PetSpark Development Environment${NC}"
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

# Check dependencies
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
fi

echo -e "${GREEN}✓ Dependencies installed${NC}"

# Kill existing processes
echo -e "${YELLOW}🔍 Checking for existing servers...${NC}"
if lsof -ti:5173 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Killing process on port 5173...${NC}"
    lsof -ti:5173 | xargs kill -9 2>/dev/null || fuser -k 5173/tcp 2>/dev/null
    sleep 1
fi

if lsof -ti:3000 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Killing process on port 3000...${NC}"
    lsof -ti:3000 | xargs kill -9 2>/dev/null || fuser -k 3000/tcp 2>/dev/null
    sleep 1
fi

echo -e "${GREEN}✓ Ports cleared${NC}"

# Run typecheck
echo -e "${YELLOW}🔍 Running typecheck...${NC}"
if npm run typecheck > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Typecheck passed${NC}"
else
    echo -e "${RED}✗ Typecheck failed${NC}"
    echo -e "${YELLOW}⚠️  Continuing anyway...${NC}"
fi

# Seed data (if seed script exists)
if [ -f "src/lib/seedData.ts" ]; then
    echo -e "${YELLOW}📊 Seed data will be generated on first run${NC}"
fi

# Start dev server
echo ""
echo -e "${BLUE}🎯 Starting development server...${NC}"
echo -e "${BLUE}📍 Frontend: http://localhost:5173${NC}"
echo -e "${BLUE}📍 Admin: http://localhost:5173/admin${NC}"
echo ""
echo -e "${GREEN}✨ Environment ready!${NC}"
echo ""

npm run dev

