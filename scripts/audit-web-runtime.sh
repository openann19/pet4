#!/usr/bin/env bash
set -euo pipefail

# Web Runtime Audit Script
# Checks for runtime issues: undefined handlers, missing error handling, signal cleanup, etc.

echo "🔍 Web Runtime Audit Starting..."

AUDIT_DIR="logs/web-audit-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$AUDIT_DIR"

WEB_SRC="apps/web/src"

echo "📋 Audit Report: $(date)" > "$AUDIT_DIR/audit-report.txt"

# 1. Check for undefined event handlers
echo ""
echo "1. Checking for potentially undefined event handlers..."
UNDEFINED_HANDLERS=$(grep -rn "onClick={.*\|onPress={.*\|onSubmit={.*" "$WEB_SRC/components" --include="*.tsx" | grep -v "undefined" | grep -E "onClick=\{[^}]*\?\|onPress=\{[^}]*\?\|onSubmit=\{[^}]*\?" || true)
if [ -n "$UNDEFINED_HANDLERS" ]; then
  echo "❌ Found potentially undefined handlers:" >> "$AUDIT_DIR/audit-report.txt"
  echo "$UNDEFINED_HANDLERS" >> "$AUDIT_DIR/audit-report.txt"
  echo "$UNDEFINED_HANDLERS"
else
  echo "✅ No obvious undefined handler patterns found"
fi

# 2. Check for missing error handling in async functions
echo ""
echo "2. Checking for missing error handling in async functions..."
MISSING_ERROR_HANDLING=$(grep -rn "async.*=>" "$WEB_SRC/components" --include="*.tsx" | grep -v "catch\|\.catch\|try" | head -20 || true)
if [ -n "$MISSING_ERROR_HANDLING" ]; then
  echo "⚠️  Found async functions that may lack error handling:" >> "$AUDIT_DIR/audit-report.txt"
  echo "$MISSING_ERROR_HANDLING" >> "$AUDIT_DIR/audit-report.txt"
fi

# 3. Check for AbortController signal cleanup
echo ""
echo "3. Checking for AbortController signal cleanup..."
SIGNAL_ISSUES=$(grep -rn "AbortController\|controller\.signal" "$WEB_SRC" --include="*.ts" --include="*.tsx" | grep -v "abort()\|cleanup\|finally" | head -20 || true)
if [ -n "$SIGNAL_ISSUES" ]; then
  echo "⚠️  Found AbortController usage that may need cleanup:" >> "$AUDIT_DIR/audit-report.txt"
  echo "$SIGNAL_ISSUES" >> "$AUDIT_DIR/audit-report.txt"
fi

# 4. Check for non-null assertions
echo ""
echo "4. Checking for non-null assertions (!.)..."
NON_NULL_ASSERTIONS=$(grep -rn "!\.\|!\s" "$WEB_SRC/components" --include="*.tsx" | head -30 || true)
if [ -n "$NON_NULL_ASSERTIONS" ]; then
  echo "⚠️  Found non-null assertions (potential runtime errors):" >> "$AUDIT_DIR/audit-report.txt"
  echo "$NON_NULL_ASSERTIONS" >> "$AUDIT_DIR/audit-report.txt"
  echo "$NON_NULL_ASSERTIONS"
fi

# 5. Check for type assertions that might fail
echo ""
echo "5. Checking for unsafe type assertions..."
UNSAFE_ASSERTIONS=$(grep -rn "as any\|as unknown" "$WEB_SRC/components" --include="*.tsx" | head -30 || true)
if [ -n "$UNSAFE_ASSERTIONS" ]; then
  echo "⚠️  Found unsafe type assertions:" >> "$AUDIT_DIR/audit-report.txt"
  echo "$UNSAFE_ASSERTIONS" >> "$AUDIT_DIR/audit-report.txt"
fi

# 6. Check for missing null/undefined checks before method calls
echo ""
echo "6. Checking for missing null/undefined checks..."
MISSING_CHECKS=$(grep -rn "\.(focus|click|submit|send|call|emit|trigger)" "$WEB_SRC/components" --include="*.tsx" | grep -v "if\|&&\|?\.\|??" | head -20 || true)
if [ -n "$MISSING_CHECKS" ]; then
  echo "⚠️  Found method calls that may need null checks:" >> "$AUDIT_DIR/audit-report.txt"
  echo "$MISSING_CHECKS" >> "$AUDIT_DIR/audit-report.txt"
fi

# 7. Check for Promise handling without error handling
echo ""
echo "7. Checking for unhandled promises..."
UNHANDLED_PROMISES=$(grep -rn "Promise\.\|\.then\|\.catch" "$WEB_SRC/components" --include="*.tsx" | grep -v "\.catch\|await\|void\|try" | head -20 || true)
if [ -n "$UNHANDLED_PROMISES" ]; then
  echo "⚠️  Found promises that may need error handling:" >> "$AUDIT_DIR/audit-report.txt"
  echo "$UNHANDLED_PROMISES" >> "$AUDIT_DIR/audit-report.txt"
fi

# 8. Check for event listener cleanup
echo ""
echo "8. Checking for event listener cleanup..."
EVENT_LISTENERS=$(grep -rn "addEventListener" "$WEB_SRC/components" --include="*.tsx" | grep -v "removeEventListener\|useEffect.*return" | head -20 || true)
if [ -n "$EVENT_LISTENERS" ]; then
  echo "⚠️  Found event listeners that may need cleanup:" >> "$AUDIT_DIR/audit-report.txt"
  echo "$EVENT_LISTENERS" >> "$AUDIT_DIR/audit-report.txt"
fi

echo ""
echo "✅ Audit complete. Report saved to: $AUDIT_DIR/audit-report.txt"
cat "$AUDIT_DIR/audit-report.txt"
