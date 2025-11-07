#!/bin/bash
# Quick test script to verify web-dev works

echo "🧪 Testing pnpm web-dev..."
echo ""

cd /home/ben/Public/PETSPARK || exit 1

echo "Starting web dev server..."
pnpm web-dev > /tmp/vite-test.log 2>&1 &
VITE_PID=$!

echo "Waiting for server to start..."
sleep 3

# Check if server is running
if curl -s http://localhost:5173 > /dev/null 2>&1 || curl -s http://localhost:5174 > /dev/null 2>&1; then
    echo "✅ SUCCESS: Web dev server is running!"
    echo "   Check http://localhost:5173 or http://localhost:5174"
    echo ""
    echo "Logs:"
    tail -5 /tmp/vite-test.log
    echo ""
    echo "Killing server..."
    kill $VITE_PID 2>/dev/null || pkill -f vite
    echo "✅ Test complete - server works!"
else
    echo "❌ FAILED: Server not responding"
    echo ""
    echo "Logs:"
    cat /tmp/vite-test.log
    kill $VITE_PID 2>/dev/null || pkill -f vite
    exit 1
fi

