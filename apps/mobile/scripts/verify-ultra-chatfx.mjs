#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from 'fs';
import { dirname, extname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const SRC = join(ROOT, 'src');
const okExt = new Set(['.ts', '.tsx', '.js', '.jsx']);

const mustHave = [
  'src/effects/chat/core/reduced-motion.ts',
  // Reduced motion guard hook
];

const chatHints = [
  '/chat/',
  '/features/chat/',
  '/screens/Chat',
  '/components/chat/',
  '/modules/chat/',
];

let ERROR = 0;

function die(msg) {
  process.stderr.write(`❌ ${msg}\n`);
  ERROR = 1;
}

function walk(dir, out = []) {
  let ents = [];
  try {
    ents = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of ents) {
    const p = join(dir, e.name);
    try {
      const st = statSync(p);
      if (st.isDirectory()) {
        walk(p, out);
      } else if (okExt.has(extname(p))) {
        out.push(p);
      }
    } catch {
      // Ignore errors
    }
  }
  return out;
}

function hasFile(path) {
  try {
    readFileSync(join(ROOT, path));
    return true;
  } catch {
    return false;
  }
}

// 1) Required effect files present
for (const f of mustHave) {
  if (!hasFile(f)) {
    die(`Missing required effect file: ${f}`);
  }
}

// 2) Scan files for compliance
const files = walk(SRC);

for (const f of files) {
  let src = '';
  try {
    src = readFileSync(f, 'utf8');
  } catch {
    continue;
  }

  const relPath = f.replace(ROOT + '/', '');
  const isChat = chatHints.some((h) => relPath.includes(h));
  const isEffects = relPath.includes('/effects/');
  const isTest = relPath.includes('/__tests__/') || relPath.includes('.test.') || relPath.includes('.spec.');

  // Skip test files
  if (isTest) {
    continue;
  }

  // Chat must import Skia + Reanimated + Haptics at least once
  // Only check actual chat components/screens, not test files or utility files
  if (isChat && !isTest && (relPath.includes('/components/chat/') || relPath.includes('/screens/') || relPath.includes('/features/chat/'))) {
    if (!/from ['"]@shopify\/react-native-skia['"]/.test(src)) {
      die(`${relPath}: Chat file must import Skia.`);
    }
    if (!/from ['"]react-native-reanimated['"]/.test(src)) {
      die(`${relPath}: Chat file must import Reanimated.`);
    }
    if (!/from ['"]expo-haptics['"]/.test(src)) {
      die(`${relPath}: Chat file must import expo-haptics for tactile thresholds.`);
    }
  }

  // Any withTiming/withSpring requires reduced-motion symbol or AccessibilityInfo
  // Only check effects and components that use animations
  if ((isEffects || isChat) && /withTiming\(|withSpring\(|withDecay\(/.test(src)) {
    const hasReducedMotionImport = /from ['"].*reduced-motion['"]/.test(src);
    const hasAccessibilityInfo = /AccessibilityInfo/.test(src);
    const hasReducedMotionHook = /useReducedMotion/i.test(src);
    const hasReducedMotionUtil = /getReducedMotionDuration|useReducedMotionSV|reducedMotion/.test(src);

    if (!hasAccessibilityInfo && !hasReducedMotionHook && !hasReducedMotionImport && !hasReducedMotionUtil) {
      die(
        `${relPath}: Animation detected without Reduced Motion guard (AccessibilityInfo or useReducedMotion*).`,
      );
    }
  }

  // Any Gesture.Pan threshold logic must import Haptics
  // Only check if it's actually using gesture thresholds
  if ((isEffects || (isChat && !isTest)) && /Gesture\s*\.\s*Pan\s*\(/.test(src) && />\s*=?\s*\d+/.test(src)) {
    if (!/from ['"]expo-haptics['"]/.test(src)) {
      die(`${relPath}: Gesture threshold crossing requires expo-haptics feedback.`);
    }
  }

  // Effects must use Skia (only for actual effect implementations, not utilities)
  if (isEffects && !isTest && !relPath.includes('/core/') && !relPath.includes('/shaders/')) {
    // Only require Skia if the file exports effect hooks or components
    const exportsEffects = /export\s+(function|const|class)\s+\w*(FX|Effect|Animation|Hook)/i.test(src) ||
                          /export\s*\{[^}]*\w*(FX|use.*Effect|use.*Animation)/i.test(src);

    if (exportsEffects && !/from ['"]@shopify\/react-native-skia['"]/.test(src)) {
      die(`${relPath}: Effects module without Skia import.`);
    }
  }

  // Ban Math.random in effects/chat
  if ((isEffects || isChat) && /Math\s*\.\s*random\s*\(/.test(src)) {
    // Allow Math.random in seeded-rng.ts (it's the implementation)
    if (!relPath.includes('seeded-rng.ts')) {
      die(`${relPath}: Math.random is banned in effects/chat. Use seeded RNG.`);
    }
  }

  // Ban classic Animated
  if ((isEffects || isChat) && /from ['"]react-native['"].*Animated/.test(src)) {
    die(`${relPath}: Classic React Native Animated is banned. Use react-native-reanimated worklets.`);
  }
}

if (ERROR) {
  process.stderr.write('\n❌ ULTRA chat FX verification failed.\n');
  process.exit(1);
} else {
  process.stdout.write('✅ ULTRA chat FX verification passed.\n');
}
