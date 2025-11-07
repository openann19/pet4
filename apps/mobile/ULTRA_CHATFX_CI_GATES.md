# Ultra Chat FX CI Gates Setup

This document describes the CI gates and linting setup that enforce the ultra effects stack (Skia + Reanimated worklets + Reduced-Motion guards + Haptics) across chat effects.

## Files Created

### 1. ESLint Plugin
**Location**: `apps/mobile/tools/ultra-chatfx/eslint-plugin-ultra-chatfx.js`

Custom ESLint plugin with 4 rules:
- `no-react-native-animated`: Bans classic React Native Animated API
- `require-reduced-motion-guard`: Requires reduced motion checks when using Reanimated animations
- `require-skia-in-effects`: Ensures effects modules use Skia for GPU rendering
- `ban-math-random-in-effects`: Bans Math.random in effects/chat (enforces deterministic physics)

### 2. Verifier Script
**Location**: `apps/mobile/scripts/verify-ultra-chatfx.mjs`

Node.js script that scans the codebase and enforces:
- Required effect files present (reduced-motion.ts)
- Chat components import Skia + Reanimated + Haptics
- Animations have reduced motion guards
- Gesture thresholds have haptic feedback
- Effects use Skia
- No Math.random in effects/chat

### 3. Effects Core Index
**Location**: `apps/mobile/src/effects/core/index.ts`

Central export point for effects core utilities.

## Configuration Updates

### ESLint Config
**File**: `apps/mobile/eslint.config.js`

Added:
- Import of `ultra-chatfx` plugin
- Plugin registration in plugins object
- 4 custom rules with appropriate glob patterns

### Package.json
**File**: `apps/mobile/package.json`

Added:
- `verify:ultra`: Runs the verifier script
- `ci`: Combined typecheck + lint + verify
- `minimatch`: Dev dependency for glob matching

### CI Workflow
**File**: `.github/workflows/mobile-ci.yml`

Added:
- `Verify Ultra Chat FX` step in lint job

## Installation

Run the following to install the new dependency:

```bash
cd apps/mobile
pnpm install
```

## Usage

### Run Verifier Manually
```bash
cd apps/mobile
pnpm verify:ultra
```

### Run Full CI Checks
```bash
cd apps/mobile
pnpm ci
```

### Run ESLint with Custom Rules
```bash
cd apps/mobile
pnpm lint
```

## Current Violations

The verifier is currently catching these violations (these need to be fixed):

1. **Chat Components Missing Imports**:
   - `src/components/chat/ChatList.tsx`: Needs Skia + Haptics
   - `src/components/chat/MediaViewer.tsx`: Needs Skia + Haptics
   - `src/components/chat/MessageBubble.tsx`: Needs Skia + Haptics
   - `src/components/chat/index.ts`: Needs Skia + Reanimated + Haptics
   - `src/screens/ChatScreen.tsx`: Needs Skia + Reanimated + Haptics

2. **Math.random Usage**:
   - `src/effects/chat/bubbles/use-receive-air-cushion.ts`
   - `src/effects/chat/core/telemetry.ts`
   - `src/effects/chat/media/use-glass-morph-zoom.ts`
   - `src/effects/chat/media/use-sticker-physics.ts`

3. **Missing Reduced Motion Guard**:
   - `src/effects/chat/media/use-sticker-physics.ts`

4. **Gesture Threshold Missing Haptics**:
   - `src/effects/chat/gestures/use-swipe-reply-elastic.ts`

## Next Steps

1. **Install Dependencies**:
   ```bash
   cd apps/mobile
   pnpm install
   ```

2. **Fix Violations**:
   - Add Skia/Reanimated/Haptics imports to chat components
   - Replace Math.random with seeded RNG in effects
   - Add reduced motion guards where missing
   - Add haptic feedback to gesture thresholds

3. **Verify Setup**:
   ```bash
   pnpm verify:ultra
   ```

4. **Run CI Locally**:
   ```bash
   pnpm ci
   ```

## How It Works

### ESLint Plugin
The plugin uses AST traversal to detect:
- Import statements from `react-native` containing `Animated`
- Reanimated API usage (`withTiming`, `withSpring`, etc.) without reduced motion guards
- Effect exports (suffix `FX`) without Skia imports
- `Math.random` usage in effects/chat files

### Verifier Script
The script:
- Scans all `.ts`/`.tsx` files in `src/`
- Checks for required files
- Validates imports based on file patterns
- Detects animation usage without reduced motion guards
- Checks for gesture thresholds without haptics
- Validates effects use Skia

### CI Integration
The GitHub Actions workflow runs:
1. Type checking
2. ESLint (including custom rules)
3. Ultra Chat FX verification
4. Tests

If any step fails, CI goes red.

## Customization

### Adjust Glob Patterns
Edit `eslint.config.js` to change which files are checked:

```javascript
'ultra-chatfx/require-reduced-motion-guard': [
  'error',
  {
    globs: [
      'src/**/effects/**/*.{ts,tsx}',
      'src/**/chat/**/*.{ts,tsx}',
      // Add more patterns here
    ],
  },
],
```

### Adjust Verifier Checks
Edit `scripts/verify-ultra-chatfx.mjs` to:
- Change required file paths
- Modify chat component detection patterns
- Adjust effect detection logic

### Override with Environment Variable
Set `ULTRA_CHATFX_GLOBS` (CSV) to override glob patterns:

```bash
ULTRA_CHATFX_GLOBS="src/**/effects/**/*.ts,src/**/custom/**/*.ts" pnpm verify:ultra
```

## Notes

- Test files are automatically excluded from verification
- The verifier is smarter about detecting actual effect implementations vs utilities
- Reduced motion detection works with both `AccessibilityInfo` and custom hooks
- The plugin uses ESM format to match ESLint flat config

