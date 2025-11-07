#!/bin/bash

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Change to the project root (parent of scripts directory)
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT" || exit 1

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔍 Checking for existing servers...${NC}"
echo -e "${YELLOW}📁 Working directory: ${PROJECT_ROOT}${NC}"

# Kill processes on port 5173 (default Vite port)
if lsof -ti:5173 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Killing process on port 5173...${NC}"
    lsof -ti:5173 | xargs kill -9 2>/dev/null || fuser -k 5173/tcp 2>/dev/null
    sleep 1
fi

# Kill processes on port 5000 (existing kill script target)
if lsof -ti:5000 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Killing process on port 5000...${NC}"
    lsof -ti:5000 | xargs kill -9 2>/dev/null || fuser -k 5000/tcp 2>/dev/null
    sleep 1
fi

# Try alternative method with fuser if lsof doesn't work
if command -v fuser > /dev/null 2>&1; then
    fuser -k 5173/tcp 2>/dev/null
    fuser -k 5000/tcp 2>/dev/null
    sleep 1
fi

echo -e "${GREEN}✅ Ports freed${NC}"
echo -e "${GREEN}🚀 Starting development server...${NC}"

# Start the dev server
npm run dev

