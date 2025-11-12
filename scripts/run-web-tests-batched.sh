#!/bin/bash
# Runs web tests in batches of 50 and exports failures to a txt file

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
WEB_APP_ROOT="$PROJECT_ROOT/apps/web"
OUTPUT_FILE="$PROJECT_ROOT/web-test-failures.txt"
BATCH_SIZE=50

cd "$PROJECT_ROOT" || exit 1

echo "🔍 Discovering test files..."
TEST_FILES=($(find "$WEB_APP_ROOT/src" -type f \( -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.spec.ts" -o -name "*.spec.tsx" \) 2>/dev/null | sort))

if [ ${#TEST_FILES[@]} -eq 0 ]; then
  echo "⚠️  No test files found!"
  echo "No test files found in apps/web/src" > "$OUTPUT_FILE"
  exit 0
fi

TOTAL_FILES=${#TEST_FILES[@]}
BATCH_COUNT=$(( (TOTAL_FILES + BATCH_SIZE - 1) / BATCH_SIZE ))

echo "Found $TOTAL_FILES test files"
echo "📦 Split into $BATCH_COUNT batches of $BATCH_SIZE tests each"
echo ""

# Initialize failure report
{
  echo "WEB TEST FAILURES REPORT"
  echo "Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  echo "Total Test Files: $TOTAL_FILES"
  echo "Batch Size: $BATCH_SIZE"
  echo "=================================================================================="
  echo ""
} > "$OUTPUT_FILE"

TOTAL_FAILURES=0
FAILED_FILES=()

# Process each batch
for ((batch=0; batch<BATCH_COUNT; batch++)); do
  BATCH_NUM=$((batch + 1))
  START_IDX=$((batch * BATCH_SIZE))
  END_IDX=$((START_IDX + BATCH_SIZE))

  # Get files for this batch
  BATCH_FILES=("${TEST_FILES[@]:$START_IDX:$BATCH_SIZE}")
  BATCH_FILE_COUNT=${#BATCH_FILES[@]}

  echo "[Batch $BATCH_NUM/$BATCH_COUNT] Running $BATCH_FILE_COUNT test files..."

  # Convert absolute paths to relative paths from web app root
  RELATIVE_FILES=()
  for file in "${BATCH_FILES[@]}"; do
    RELATIVE_FILES+=("${file#$WEB_APP_ROOT/}")
  done

  # Run vitest for this batch
  cd "$WEB_APP_ROOT" || exit 1

  # Create temporary output file for this batch
  TEMP_OUTPUT=$(mktemp)

  # Run tests and capture output
  if pnpm vitest run --reporter=verbose "${RELATIVE_FILES[@]}" > "$TEMP_OUTPUT" 2>&1; then
    TEST_EXIT_CODE=0
  else
    TEST_EXIT_CODE=$?
  fi

  # Check for failures in output
  if grep -qE "FAIL|✖|failed|Error:" "$TEMP_OUTPUT" 2>/dev/null || [ $TEST_EXIT_CODE -ne 0 ]; then
    echo "  ❌ Failures detected in batch $BATCH_NUM"

    # Extract failed test files from output
    while IFS= read -r file; do
      # Try to find the file in our batch
      for batch_file in "${BATCH_FILES[@]}"; do
        if [[ "$batch_file" == *"$file"* ]] || [[ "$file" == *"$(basename "$batch_file")"* ]]; then
          if [[ ! " ${FAILED_FILES[*]} " =~ " ${batch_file} " ]]; then
            FAILED_FILES+=("$batch_file")
            TOTAL_FAILURES=$((TOTAL_FAILURES + 1))

            # Add to report
            {
              echo "BATCH $BATCH_NUM - $(basename "$batch_file")"
              echo "--------------------------------------------------------------------------------"
              echo "File: $batch_file"
              echo "Batch: $BATCH_NUM"
              echo "Error Output:"
              grep -A 50 "$file\|$(basename "$batch_file")" "$TEMP_OUTPUT" | head -100
              echo ""
              echo ""
            } >> "$OUTPUT_FILE"
          fi
        fi
      done
    done < <(grep -oE "[^\s]+\.(test|spec)\.(ts|tsx)" "$TEMP_OUTPUT" 2>/dev/null | sort -u)

    # If no specific files identified but there are failures, add batch summary
    if [ ${#FAILED_FILES[@]} -eq $TOTAL_FAILURES ]; then
      {
        echo "BATCH $BATCH_NUM - Unknown test files"
        echo "--------------------------------------------------------------------------------"
        echo "Batch contained failures but specific files could not be identified."
        echo "Batch files:"
        printf '  - %s\n' "${BATCH_FILES[@]}"
        echo ""
        echo "Error Output (last 200 lines):"
        tail -200 "$TEMP_OUTPUT"
        echo ""
        echo ""
      } >> "$OUTPUT_FILE"
    fi
  else
    echo "  ✅ Batch $BATCH_NUM passed"
  fi

  rm -f "$TEMP_OUTPUT"

  # Small delay between batches
  if [ $BATCH_NUM -lt $BATCH_COUNT ]; then
    sleep 1
  fi
done

# Add summary to report
{
  echo "=================================================================================="
  echo "SUMMARY"
  echo "=================================================================================="
  echo "Total Batches: $BATCH_COUNT"
  echo "Total Failures: $TOTAL_FAILURES"
  echo ""
  if [ $TOTAL_FAILURES -gt 0 ]; then
    echo "Failed Test Files:"
    printf '  - %s\n' "${FAILED_FILES[@]}"
  else
    echo "✅ No test failures found!"
  fi
} >> "$OUTPUT_FILE"

echo ""
echo "📝 Report written to: $OUTPUT_FILE"
echo "   Total failures: $TOTAL_FAILURES"

if [ $TOTAL_FAILURES -gt 0 ]; then
  echo ""
  echo "❌ Some tests failed. Check $OUTPUT_FILE for details."
  exit 1
else
  echo ""
  echo "✅ All tests passed!"
  exit 0
fi



