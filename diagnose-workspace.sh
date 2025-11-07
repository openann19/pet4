#!/bin/bash
# Workspace Diagnostic Script

set -e

echo "🔍 PETSPARK Workspace Diagnostic"
echo "=================================="
echo ""

# Check we're in the right place
if [ ! -f "pnpm-workspace.yaml" ]; then
    echo "❌ ERROR: Not in workspace root!"
    echo "   Run: cd /home/ben/Public/PETSPARK"
    exit 1
fi

echo "✅ In workspace root: $(pwd)"
echo ""

# Check package names
echo "📦 Package Names:"
pnpm -r list --depth -1 2>&1 | grep -E "^petspark|^spark-template|^expo-native|^@petspark" | while read line; do
    echo "   $line"
done
echo ""

# Test mobile commands
echo "🧪 Testing Mobile Commands:"
echo -n "   mobile-start: "
if pnpm mobile-start --help > /dev/null 2>&1; then
    echo "✅ Works"
else
    echo "❌ FAILED"
fi

echo -n "   --filter petspark-mobile start: "
if pnpm --filter petspark-mobile start --help > /dev/null 2>&1; then
    echo "✅ Works"
else
    echo "❌ FAILED"
fi
echo ""

# Test web commands
echo "🧪 Testing Web Commands:"
echo -n "   web-dev: "
if pnpm web-dev --help > /dev/null 2>&1; then
    echo "✅ Works"
else
    echo "❌ FAILED"
fi

echo -n "   --filter spark-template dev: "
if pnpm --filter spark-template dev --help > /dev/null 2>&1; then
    echo "✅ Works"
else
    echo "❌ FAILED"
fi
echo ""

# Check mobile app structure
echo "📱 Mobile App Structure:"
if [ -f "apps/mobile/package.json" ]; then
    echo "   ✅ package.json exists"
else
    echo "   ❌ package.json missing"
fi

if [ -f "apps/mobile/app.config.ts" ]; then
    echo "   ✅ app.config.ts exists"
else
    echo "   ❌ app.config.ts missing"
fi

if [ -f "apps/mobile/index.js" ]; then
    echo "   ✅ index.js exists"
else
    echo "   ❌ index.js missing"
fi
echo ""

# Check web app structure
echo "🌐 Web App Structure:"
if [ -f "apps/web/package.json" ]; then
    echo "   ✅ package.json exists"
else
    echo "   ❌ package.json missing"
fi

if [ -f "apps/web/vite.config.ts" ]; then
    echo "   ✅ vite.config.ts exists"
else
    echo "   ❌ vite.config.ts missing"
fi
echo ""

# Check dependencies
echo "📚 Dependency Check:"
echo -n "   Mobile has expo: "
if pnpm --filter petspark-mobile list expo > /dev/null 2>&1; then
    echo "✅ Installed"
else
    echo "❌ Missing"
fi

echo -n "   Mobile has react-native: "
if pnpm --filter petspark-mobile list react-native > /dev/null 2>&1; then
    echo "✅ Installed"
else
    echo "❌ Missing"
fi

echo -n "   Web has vite: "
if pnpm --filter spark-template list vite > /dev/null 2>&1; then
    echo "✅ Installed"
else
    echo "❌ Missing"
fi
echo ""

echo "🚀 Quick Start Commands:"
echo "   Mobile:  pnpm mobile-start"
echo "   Web:    pnpm web-dev"
echo "   Direct: pnpm --filter petspark-mobile start"
echo "           pnpm --filter spark-template dev"
echo ""

echo "=================================="
echo "✅ Diagnostic Complete"

