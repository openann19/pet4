#!/usr/bin/env bash
set -euo pipefail

# Cursor IDE Performance Optimization Script for Ubuntu
# Run this script to diagnose and fix performance issues

echo "🔍 Cursor IDE Performance Diagnostic & Fix Script"
echo "=================================================="
echo ""

# Check current state
echo "📊 Current System State:"
echo "----------------------"
free -h | grep -E "Mem|Swap"
echo ""
df -h /home | tail -1
echo ""

# 1. Clean Cursor cache and logs
echo "🧹 Step 1: Cleaning Cursor cache and logs..."
CURSOR_CONFIG="$HOME/.config/Cursor"
if [ -d "$CURSOR_CONFIG" ]; then
    # Clean logs (keep last 7 days)
    find "$CURSOR_CONFIG/logs" -type f -mtime +7 -delete 2>/dev/null || true
    
    # Clean old cache
    rm -rf "$CURSOR_CONFIG/Cache"/* 2>/dev/null || true
    rm -rf "$CURSOR_CONFIG/CachedData"/* 2>/dev/null || true
    rm -rf "$CURSOR_CONFIG/GPUCache"/* 2>/dev/null || true
    
    echo "✅ Cache cleaned"
else
    echo "⚠️  Cursor config directory not found"
fi
echo ""

# 2. Optimize Cursor settings
echo "⚙️  Step 2: Optimizing Cursor settings..."
CURSOR_SETTINGS="$HOME/.config/Cursor/User/settings.json"

if [ -f "$CURSOR_SETTINGS" ]; then
    # Backup settings
    cp "$CURSOR_SETTINGS" "${CURSOR_SETTINGS}.backup.$(date +%Y%m%d_%H%M%S)"
    
    # Create optimized settings (using jq if available, otherwise manual)
    if command -v jq &> /dev/null; then
        jq '
        .["files.watcherExclude"] = {
            "**/.git/objects/**": true,
            "**/.git/subtree-cache/**": true,
            "**/node_modules/**": true,
            "**/dist/**": true,
            "**/build/**": true,
            "**/.next/**": true,
            "**/.turbo/**": true,
            "**/coverage/**": true,
            "**/.pnpm-store/**": true,
            "**/pnpm-lock.yaml": true,
            "**/package-lock.json": true,
            "**/yarn.lock": true
        } |
        .["search.exclude"] = {
            "**/node_modules": true,
            "**/dist": true,
            "**/build": true,
            "**/.next": true,
            "**/.turbo": true,
            "**/coverage": true,
            "**/.pnpm-store": true,
            "**/*.log": true
        } |
        .["typescript.preferences.includePackageJsonAutoImports"] = "off" |
        .["typescript.suggest.autoImports"] = false |
        .["typescript.tsserver.maxTsServerMemory"] = 4096 |
        .["javascript.preferences.includePackageJsonAutoImports"] = "off" |
        .["files.maxMemoryForLargeFilesMB"] = 4096 |
        .["files.exclude"] = {
            "**/.git": true,
            "**/node_modules": true,
            "**/dist": true,
            "**/build": true,
            "**/.next": true,
            "**/.turbo": true
        } |
        .["extensions.autoCheckUpdates"] = false |
        .["extensions.autoUpdate"] = false |
        .["telemetry.telemetryLevel"] = "off"
        ' "$CURSOR_SETTINGS" > "${CURSOR_SETTINGS}.tmp" && mv "${CURSOR_SETTINGS}.tmp" "$CURSOR_SETTINGS"
        
        echo "✅ Settings optimized with jq"
    else
        echo "⚠️  jq not found. Please manually update settings.json with:"
        echo ""
        cat << 'EOF'
{
  "files.watcherExclude": {
    "**/.git/objects/**": true,
    "**/node_modules/**": true,
    "**/dist/**": true,
    "**/build/**": true,
    "**/.next/**": true,
    "**/.turbo/**": true,
    "**/coverage/**": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/build": true,
    "**/.next": true,
    "**/.turbo": true
  },
  "typescript.preferences.includePackageJsonAutoImports": "off",
  "typescript.suggest.autoImports": false,
  "typescript.tsserver.maxTsServerMemory": 4096,
  "files.maxMemoryForLargeFilesMB": 4096,
  "extensions.autoCheckUpdates": false,
  "extensions.autoUpdate": false,
  "telemetry.telemetryLevel": "off"
}
EOF
    fi
else
    echo "⚠️  Settings file not found at $CURSOR_SETTINGS"
fi
echo ""

# 3. Disable unnecessary extensions
echo "🔌 Step 3: Checking extensions..."
echo "Consider disabling these heavy extensions if not needed:"
echo "  - Java/Gradle (if not working on Java projects)"
echo "  - Angular Language Service (if not using Angular)"
echo "  - GraphQL (if not actively using)"
echo ""
echo "To disable: Extensions → Search extension → Disable"
echo ""

# 4. Check for large files consuming disk
echo "💾 Step 4: Finding large files..."
echo "Top 10 largest directories in home:"
du -h --max-depth=1 "$HOME" 2>/dev/null | sort -hr | head -10
echo ""

# 5. System recommendations
echo "📋 Step 5: System Recommendations"
echo "=================================="
echo ""
echo "IMMEDIATE ACTIONS:"
echo "1. Close Cursor and restart it (will free up memory)"
echo "2. Disable unused language server extensions"
echo "3. Free up disk space (currently 99% full)"
echo "4. Consider increasing swap if memory is consistently low"
echo ""
echo "LONG-TERM FIXES:"
echo "1. Add more RAM (currently maxed out)"
echo "2. Use .cursorignore to exclude large directories"
echo "3. Close other memory-intensive applications"
echo "4. Consider using a lighter editor for large projects"
echo ""

# 6. Create .cursorignore
echo "📝 Step 6: Creating .cursorignore..."
CURSORIGNORE="$HOME/Public/PETSPARK/.cursorignore"
if [ ! -f "$CURSORIGNORE" ]; then
    cat > "$CURSORIGNORE" << 'EOF'
# Dependencies
node_modules/
.pnpm-store/
.pnpm-debug.log*

# Build outputs
dist/
build/
.next/
.turbo/
out/
coverage/

# Lock files
pnpm-lock.yaml
package-lock.json
yarn.lock

# Logs
*.log
logs/

# Cache
.cache/
.temp/
tmp/

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Large data files
*.db
*.sqlite
*.sqlite3
EOF
    echo "✅ Created .cursorignore"
else
    echo "✅ .cursorignore already exists"
fi
echo ""

echo "✨ Optimization complete!"
echo ""
echo "⚠️  IMPORTANT: Restart Cursor IDE for changes to take effect"
echo ""

