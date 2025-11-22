# Cursor IDE Optimization for WindowServer Stability

## Problem
Cursor IDE (Electron-based) can contribute to WindowServer kernel panics, especially with large monorepos. The WindowServer timeout indicates GPU/display subsystem stress.

## Optimizations Applied

### 1. Workspace Settings (`PETSPARK.code-workspace`)
- **File watcher exclusions**: Excluded `node_modules`, `dist`, `build`, `.expo`, `android`, `ios`, and other generated directories
- **TypeScript server limits**: Reduced memory to 4GB and disabled auto-imports
- **Search exclusions**: Prevented indexing of build artifacts
- **Git optimizations**: Disabled auto-refresh and decorations
- **Editor features**: Disabled minimap, code lens, semantic highlighting
- **UI features**: Disabled preview mode and experiments

### 2. VSCode Settings (`.vscode/settings.json`)
- Additional file watcher exclusions
- TypeScript memory limit: 3GB
- Reduced editor features
- Limited workbench editor tabs
- Disabled telemetry

### 3. Cursor Ignore (`.cursorignore`)
- Enhanced with Android/iOS build artifacts
- Database files excluded
- Prisma migrations excluded

## Additional Recommendations

### Immediate Actions

1. **Restart Cursor IDE** after these changes take effect

2. **Close unused tabs** - Limit open editors to 5-10 files

3. **Disable heavy extensions**:
   - Disable extensions you don't actively use
   - Check for extensions that watch files or use GPU

4. **Monitor system resources**:
   ```bash
   # Check CPU/GPU usage
   top -o cpu
   # Or use Activity Monitor
   ```

5. **Close other Electron apps** if possible (Slack, Discord, etc.)

### System-Level Optimizations

1. **Check for external displays**:
   - Disconnect external monitors temporarily
   - Test if issue persists with built-in display only

2. **Monitor temperature**:
   - Use `Macs Fan Control` or `iStat Menus`
   - Ensure MacBook is on hard surface with good ventilation

3. **Reduce transparency effects**:
   - System Settings → Accessibility → Display → Reduce motion
   - System Settings → Desktop & Dock → Reduce transparency

4. **Check for software conflicts**:
   - Boot in Safe Mode to test
   - Disable third-party display/graphics software

### If Issues Persist

1. **Use smaller workspace**:
   - Open only one app at a time (web OR mobile OR backend)
   - Use separate Cursor windows for different parts

2. **Disable Cursor AI features temporarily**:
   - Settings → Features → Disable AI completions
   - This reduces background processing

3. **Consider alternative**:
   - Use VS Code (lighter) for file editing
   - Use Cursor only when AI features needed

## Monitoring

Watch for these signs of WindowServer stress:
- UI lag or freezing
- WindowServer process high CPU (>50%)
- System temperature warnings
- Kernel panics with WindowServer timeout

## File Locations

- Workspace settings: `PETSPARK.code-workspace`
- VSCode settings: `.vscode/settings.json`
- Cursor ignore: `.cursorignore`

## Reverting Changes

If you need to revert:
1. Delete `.vscode/settings.json`
2. Reset `PETSPARK.code-workspace` settings to `{}`
3. Restart Cursor IDE

