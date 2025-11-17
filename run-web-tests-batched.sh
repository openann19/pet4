#!/bin/bash
# Wrapper script to run web tests in batches of 50 and export failures

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

echo "🚀 Starting batched web test run..."
echo ""

# Run the bash script directly (more reliable than tsx)
bash scripts/run-web-tests-batched.sh

EXIT_CODE=$?
exit $EXIT_CODE
