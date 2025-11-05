#!/bin/bash
# Validation script for native app setup

set -e

echo "🔍 Validating Pet3 Native App Setup..."
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

# Check native app
echo ""
echo "✓ Checking native app..."
test -d apps/native && echo "  ✅ apps/native directory exists"
test -f apps/native/package.json && echo "  ✅ apps/native/package.json exists"
test -f apps/native/app.json && echo "  ✅ apps/native/app.json exists"
test -f apps/native/eas.json && echo "  ✅ apps/native/eas.json exists"
test -f apps/native/tsconfig.json && echo "  ✅ apps/native/tsconfig.json exists"
test -f apps/native/babel.config.js && echo "  ✅ apps/native/babel.config.js exists"
test -f apps/native/metro.config.js && echo "  ✅ apps/native/metro.config.js exists"
test -f apps/native/App.tsx && echo "  ✅ apps/native/App.tsx exists"
test -f apps/native/src/screens/HomeScreen.tsx && echo "  ✅ apps/native/src/screens/HomeScreen.tsx exists"

# Check workflows
echo ""
echo "✓ Checking GitHub workflows..."
test -f .github/workflows/ci.yml && echo "  ✅ .github/workflows/ci.yml exists"
test -f .github/workflows/eas-build.yml && echo "  ✅ .github/workflows/eas-build.yml exists"

# Check documentation
echo ""
echo "✓ Checking documentation..."
test -f docs/MOBILE_README.md && echo "  ✅ docs/MOBILE_README.md exists"
test -f apps/native/README.md && echo "  ✅ apps/native/README.md exists"
test -f packages/shared/README.md && echo "  ✅ packages/shared/README.md exists"

echo ""
echo "✅ All validation checks passed!"
echo ""
echo "📋 Next steps:"
echo "  1. Install dependencies: npm install"
echo "  2. Build shared package: cd packages/shared && npm run build"
echo "  3. Configure Expo project ID in apps/native/app.json"
echo "  4. Set up GitHub secrets for EAS builds (see docs/MOBILE_README.md)"
echo ""
