#!/usr/bin/env bash
set -euo pipefail

# Mobile Parity Check Script
# Ensures web animation hooks have mobile counterparts
# This script enforces the mobile parity requirement from user rules

WEB_DIR="apps/web/src/effects/reanimated"
MOBILE_DIR="apps/mobile/src/effects/reanimated"

echo "🔍 Checking mobile parity for animation hooks..."

missing=0
total_web_hooks=0

# Find all web hook files (excluding index, transitions, and test files)
while IFS= read -r webfile; do
  # Skip non-hook files
  [[ "$webfile" =~ (index\.ts|transitions\.ts|.*\.test\.tsx|.*\.stories\.tsx|animate-presence\.tsx|particle-engine\.ts) ]] && continue

  total_web_hooks=$((total_web_hooks+1))

  # Extract hook name from filename
  filename=$(basename "$webfile" .ts)
  mobile_file="$MOBILE_DIR/$filename.ts"

  if [[ ! -f "$mobile_file" ]]; then
    echo "❌ Missing mobile parity for: $webfile"
    echo "   Expected: $mobile_file"
    missing=$((missing+1))
  fi
done < <(find "$WEB_DIR" -name "use-*.ts" -type f)

# Check for Ultra effects specifically
ultra_effects=(
  "use-ultra-card-reveal"
  "use-magnetic-hover"
  "use-morph-shape"
  "use-3d-flip-card"
  "use-liquid-swipe"
  "use-parallax-scroll"
  "use-kinetic-scroll"
  "use-spring-carousel"
  "use-wave-animation"
  "use-floating-particle"
  "use-sidebar-animation"
  "use-logo-animation"
  "use-page-transition-wrapper"
  "use-shimmer-sweep"
)

# Check for Phase 1 hooks (Pure Animation)
phase1_hooks=(
  "use-bubble-theme"
  "use-bubble-tilt"
  "use-media-bubble"
  "use-reaction-sparkles"
)

# Check for Phase 2 hooks (Gesture/Touch)
phase2_hooks=(
  "use-magnetic-hover"
  "use-drag-gesture"
  "use-swipe-reply"
  "use-pull-to-refresh"
  "use-bubble-gesture"
  "use-liquid-swipe"
  "use-parallax-tilt"
  "use-kinetic-scroll"
  "use-parallax-scroll"
)

# Check for Phase 3 hooks (Migration Layer)
phase3_hooks=(
  "use-motion-div"
  "use-motion-variants"
  "use-animate-presence"
  "use-layout-animation"
)

echo ""
echo "🎯 Checking Ultra effects parity..."

for effect in "${ultra_effects[@]}"; do
  web_file="$WEB_DIR/${effect}.ts"
  mobile_file="$MOBILE_DIR/${effect}.ts"

  if [[ -f "$web_file" && ! -f "$mobile_file" ]]; then
    echo "❌ Missing Ultra mobile parity for: $effect"
    missing=$((missing+1))
  fi
done

echo ""
echo "🎨 Checking Phase 1 hooks (Pure Animation)..."

for hook in "${phase1_hooks[@]}"; do
  web_file="$WEB_DIR/${hook}.ts"
  mobile_file="$MOBILE_DIR/${hook}.ts"

  if [[ -f "$web_file" && ! -f "$mobile_file" ]]; then
    echo "❌ Missing Phase 1 mobile parity for: $hook"
    missing=$((missing+1))
  fi
done

echo ""
echo "👆 Checking Phase 2 hooks (Gesture/Touch)..."

for hook in "${phase2_hooks[@]}"; do
  web_file="$WEB_DIR/${hook}.ts"
  mobile_file="$MOBILE_DIR/${hook}.ts"

  if [[ -f "$web_file" && ! -f "$mobile_file" ]]; then
    echo "❌ Missing Phase 2 mobile parity for: $hook"
    missing=$((missing+1))
  fi
done

echo ""
echo "🔄 Checking Phase 3 hooks (Migration Layer)..."

for hook in "${phase3_hooks[@]}"; do
  web_file="$WEB_DIR/${hook}.ts"
  mobile_file="$MOBILE_DIR/${hook}.ts"

  if [[ -f "$web_file" && ! -f "$mobile_file" ]]; then
    echo "❌ Missing Phase 3 mobile parity for: $hook"
    missing=$((missing+1))
  fi
done

echo ""
if [[ "$missing" -gt 0 ]]; then
  echo "----"
  echo "🚨 Mobile parity check FAILED ($missing missing implementations)"
  echo ""
  echo "📋 Next steps:"
  echo "1. Implement missing mobile hooks in $MOBILE_DIR/"
  echo "2. Add exports to $MOBILE_DIR/index.ts"
  echo "3. Test on iOS Simulator and Android Emulator"
  echo "4. Add RTL tests (*.native.test.tsx)"
  echo "5. Add Expo Stories for visual regression"
  echo ""
  echo "🎨 For platform-specific behavior:"
  echo "- Use PanGestureHandler for touch/drag gestures"
  echo "- Add haptic feedback with @pet3/motion/haptic"
  echo "- Handle reduced motion with useReducedMotion"
  echo ""
  exit 1
else
  echo "✅ Mobile parity OK - All web hooks have mobile counterparts!"
fi
