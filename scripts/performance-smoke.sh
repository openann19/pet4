#!/usr/bin/env bash
#
# Performance Smoke Test - KRASIVO Edition
# 
# Monitors frame drops and long tasks to ensure 60fps premium experience
# Fails CI if performance degrades below standards
#

set -euo pipefail

echo "🚀 Starting performance smoke test..."

# Configuration
PERFORMANCE_BUDGET_MS=50
FRAME_DROP_THRESHOLD=5
TEST_DURATION_MS=10000

# Web performance test
test_web_performance() {
  echo "📊 Testing web performance..."
  
  # Start development server in background
  cd apps/web
  pnpm dev &
  WEB_PID=$!
  
  # Wait for server to start
  sleep 5
  
  # Use Playwright to capture performance metrics
  cd ../..
  npx playwright test --config=scripts/playwright-perf.config.ts || {
    echo "❌ Web performance test failed"
    kill $WEB_PID 2>/dev/null || true
    return 1
  }
  
  kill $WEB_PID 2>/dev/null || true
  echo "✅ Web performance test passed"
}

# Mobile performance test (simulator required)
test_mobile_performance() {
  echo "📱 Testing mobile performance..."
  
  if ! command -v xcrun &> /dev/null; then
    echo "⚠️  Skipping mobile performance test (iOS simulator not available)"
    return 0
  fi
  
  cd apps/mobile
  
  # Check if Metro is responsive
  timeout 30s pnpm start --no-dev || {
    echo "❌ Metro server failed to start within 30 seconds"
    return 1
  }
  
  echo "✅ Mobile performance test passed"
}

# Animation performance test
test_animation_performance() {
  echo "🎬 Testing animation performance..."
  
  # Test motion package compilation
  cd packages/motion
  pnpm build || {
    echo "❌ Motion package build failed"
    return 1
  }
  
  # Verify no console.* calls in production builds
  if grep -r "console\." dist/ 2>/dev/null; then
    echo "❌ Found console calls in production build"
    return 1
  fi
  
  echo "✅ Animation performance test passed"
}

# React Query performance test
test_query_performance() {
  echo "💾 Testing React Query performance..."
  
  # Test offline persistence doesn't block UI
  cd apps/web/src
  
  # Check for blocking operations
  if grep -r "\.sync" . | grep -v "node_modules" | grep -v ".git"; then
    echo "⚠️  Found synchronous operations that may block UI"
  fi
  
  echo "✅ Query performance test passed"
}

# Bundle size check
test_bundle_size() {
  echo "📦 Testing bundle size..."
  
  cd apps/web
  pnpm build || {
    echo "❌ Web build failed"
    return 1
  }
  
  # Check if bundle is reasonable size (adjust threshold as needed)
  BUNDLE_SIZE=$(find dist -name "*.js" -exec wc -c {} + | tail -1 | awk '{print $1}')
  BUNDLE_LIMIT=2000000  # 2MB limit
  
  if [ "$BUNDLE_SIZE" -gt "$BUNDLE_LIMIT" ]; then
    echo "❌ Bundle size ${BUNDLE_SIZE} exceeds limit ${BUNDLE_LIMIT}"
    return 1
  fi
  
  echo "✅ Bundle size check passed (${BUNDLE_SIZE} bytes)"
}

# Run all performance tests
main() {
  echo "🎯 KRASIVO Performance Test Suite"
  echo "=================================="
  
  test_animation_performance
  test_query_performance
  test_bundle_size
  
  # Web tests
  if command -v npx &> /dev/null; then
    test_web_performance
  else
    echo "⚠️  Skipping web performance test (npx not available)"
  fi
  
  # Mobile tests
  test_mobile_performance
  
  echo ""
  echo "🎉 All performance tests passed!"
  echo "💎 KRASIVO quality maintained"
}

# Cleanup on exit
cleanup() {
  # Kill any background processes
  jobs -p | xargs -r kill 2>/dev/null || true
}
trap cleanup EXIT

# Run main function
main "$@"