#!/bin/bash
# Verify React version isolation is properly configured
# This script checks that the Metro config and .npmrc are correctly set up

set -e

WORKSPACE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$WORKSPACE_ROOT"

echo "🔍 Verifying React version isolation configuration..."
echo ""

# Check 1: Metro config should NOT reference web's node_modules
echo "✓ Checking Metro config..."
if grep -q "apps/web/node_modules" apps/mobile/metro.config.js 2>/dev/null; then
  echo "❌ ERROR: Metro config still references apps/web/node_modules"
  exit 1
else
  echo "  ✓ Metro config does NOT reference web's node_modules"
fi

# Check 2: .npmrc should have shamefully-hoist=false
echo "✓ Checking .npmrc configuration..."
if grep -q "shamefully-hoist=false" .npmrc 2>/dev/null; then
  echo "  ✓ .npmrc has shamefully-hoist=false"
else
  echo "  ⚠️  WARNING: .npmrc does not have shamefully-hoist=false"
fi

# Check 3: Verify React versions in package.json files
echo "✓ Checking React versions..."
WEB_REACT=$(grep -o '"react": "[^"]*"' apps/web/package.json | head -1 | cut -d'"' -f4)
MOBILE_REACT=$(grep -o '"react": "[^"]*"' apps/mobile/package.json | head -1 | cut -d'"' -f4)

echo "  Web app React version: $WEB_REACT"
echo "  Mobile app React version: $MOBILE_REACT"

if [[ "$WEB_REACT" =~ ^[\^~]?19 ]] && [[ "$MOBILE_REACT" =~ ^[\^~]?18 ]]; then
  echo "  ✓ Version split confirmed (Web: React 19, Mobile: React 18)"
else
  echo "  ⚠️  WARNING: Unexpected React version configuration"
  echo "     Expected: Web ~19.x, Mobile ~18.x"
fi

# Check 4: If node_modules exist, verify React installations
if [ -d "apps/web/node_modules/react" ] && [ -d "apps/mobile/node_modules/react" ]; then
  echo ""
  echo "✓ Checking installed React versions..."
  if [ -f "apps/web/node_modules/react/package.json" ]; then
    WEB_INSTALLED=$(grep -o '"version": "[^"]*"' apps/web/node_modules/react/package.json | head -1 | cut -d'"' -f4)
    echo "  Web installed React: $WEB_INSTALLED"
  fi
  if [ -f "apps/mobile/node_modules/react/package.json" ]; then
    MOBILE_INSTALLED=$(grep -o '"version": "[^"]*"' apps/mobile/node_modules/react/package.json | head -1 | cut -d'"' -f4)
    echo "  Mobile installed React: $MOBILE_INSTALLED"
  fi
  
  # Check if React is hoisted to root (should NOT be)
  if [ -d "node_modules/react" ]; then
    ROOT_REACT=$(grep -o '"version": "[^"]*"' node_modules/react/package.json 2>/dev/null | head -1 | cut -d'"' -f4 || echo "unknown")
    echo "  ⚠️  WARNING: React is hoisted to root (version: $ROOT_REACT)"
    echo "     This may cause conflicts. Consider running: rm -rf node_modules && pnpm install"
  else
    echo "  ✓ React is NOT hoisted to root (good!)"
  fi
fi

echo ""
echo "✅ Verification complete!"
echo ""
echo "📝 Next steps:"
echo "   1. If you haven't already, reinstall dependencies:"
echo "      rm -rf node_modules apps/*/node_modules packages/*/node_modules && pnpm install"
echo "   2. Test both dev servers can run simultaneously:"
echo "      Terminal 1: cd apps/web && pnpm dev"
echo "      Terminal 2: cd apps/mobile && pnpm start"

