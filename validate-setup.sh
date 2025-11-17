#!/bin/bash
# Validation script for mobile app setup

set -e

echo "🔍 Validating Pet3 Mobile App Setup..."
echo ""

# Check root files
echo "✓ Checking root configuration files..."
test -f package.json && echo "  ✅ package.json exists"
test -f .npmrc && echo "  ✅ .npmrc exists"
test -f .gitignore && echo "  ✅ .gitignore exists"

# Check shared package
echo ""
echo "✓ Checking shared package..."
test -d packages/shared && echo "  ✅ packages/shared directory exists"
test -f packages/shared/package.json && echo "  ✅ packages/shared/package.json exists"
test -f packages/shared/src/index.ts && echo "  ✅ packages/shared/src/index.ts exists"
test -f packages/shared/tsconfig.json && echo "  ✅ packages/shared/tsconfig.json exists"

# Check mobile app
echo ""
echo "✓ Checking mobile app..."
test -d apps/mobile && echo "  ✅ apps/mobile directory exists"
test -f apps/mobile/package.json && echo "  ✅ apps/mobile/package.json exists"
test -f apps/mobile/app.config.ts && echo "  ✅ apps/mobile/app.config.ts exists"
test -f apps/mobile/eas.json && echo "  ✅ apps/mobile/eas.json exists"
test -f apps/mobile/tsconfig.json && echo "  ✅ apps/mobile/tsconfig.json exists"
test -f apps/mobile/babel.config.js && echo "  ✅ apps/mobile/babel.config.js exists"
test -f apps/mobile/metro.config.cjs && echo "  ✅ apps/mobile/metro.config.cjs exists"
test -f apps/mobile/App.tsx && echo "  ✅ apps/mobile/App.tsx exists"

# Check workflows
echo ""
echo "✓ Checking GitHub workflows..."
test -f .github/workflows/ci.yml && echo "  ✅ .github/workflows/ci.yml exists"
test -f .github/workflows/eas-build.yml && echo "  ✅ .github/workflows/eas-build.yml exists"

# Check documentation
echo ""
echo "✓ Checking documentation..."
test -f docs/MOBILE_README.md && echo "  ✅ docs/MOBILE_README.md exists"
test -f packages/shared/README.md && echo "  ✅ packages/shared/README.md exists"

echo ""
echo "✅ All validation checks passed!"
echo ""
echo "📋 Next steps:"
echo "  1. Install dependencies: npm install"
echo "  2. Build shared package: cd packages/shared && npm run build"
echo "  3. Configure Expo project ID in apps/mobile/app.config.ts"
echo "  4. Set up GitHub secrets for EAS builds (see docs/MOBILE_README.md)"
echo ""
