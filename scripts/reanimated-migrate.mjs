#!/usr/bin/env node
/**
 * React Native Reanimated Migration Script
 *
 * Replaces react-native-reanimated imports with @petspark/motion equivalents
 * to fix ESLint violations and use the unified motion facade.
 *
 * Usage:
 *   node scripts/reanimated-migrate.mjs [--write]
 *
 * Without --write: dry-run, reports changes
 * With --write: applies changes
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '..');

const WRITE = process.argv.includes('--write');

// Paths to scan (focus on mobile app where reanimated is used)
const SCAN_PATHS = [
  'apps/mobile/src/components',
  'apps/mobile/src/screens',
  'apps/mobile/src/hooks',
  'apps/mobile/src/effects',
];

// Replacement mappings for react-native-reanimated imports
const REPLACEMENTS = [
  {
    from: /import Animated, {([^}]+)} from ['"]react-native-reanimated['"]/g,
    to: (match, imports) => {
      // Map reanimated imports to @petspark/motion equivalents
      const mappedImports = mapReanimatedImports(imports);
      return `import { Animated, ${mappedImports} } from '@petspark/motion'`;
    },
    isFunction: true,
    description: 'Animated with named imports from react-native-reanimated',
  },
  {
    from: /import {([^}]+)} from ['"]react-native-reanimated['"]/g,
    to: (match, imports) => {
      // Map reanimated imports to @petspark/motion equivalents
      const mappedImports = mapReanimatedImports(imports);
      return `import { ${mappedImports} } from '@petspark/motion'`;
    },
    isFunction: true,
    description: 'Named imports from react-native-reanimated',
  },
  {
    from: /import Animated from ['"]react-native-reanimated['"]/g,
    to: "import { Animated } from '@petspark/motion'",
    description: 'Default Animated import from react-native-reanimated',
  },
];

// Map specific reanimated imports to motion package equivalents
function mapReanimatedImports(imports) {
  const importMap = {
    // Core hooks that are directly available
    'useSharedValue': 'useSharedValue',
    'useAnimatedStyle': 'useAnimatedStyle',
    'useDerivedValue': 'useDerivedValue',
    'withSpring': 'withSpring',
    'withTiming': 'withTiming',
    'withRepeat': 'withRepeat',
    'withSequence': 'withSequence',
    'withDelay': 'withDelay',
    'withDecay': 'withDecay',

    // Animation presets - map to custom implementations
    'FadeIn': 'FadeIn',
    'FadeInUp': 'FadeInUp',
    'FadeInDown': 'FadeInDown',
    'FadeOut': 'FadeOut',
    'FadeOutUp': 'FadeOutUp',
    'FadeOutDown': 'FadeOutDown',
    'SlideInRight': 'SlideInRight',
    'SlideInLeft': 'SlideInLeft',
    'SlideInUp': 'SlideInUp',
    'SlideInDown': 'SlideInDown',
    'SlideOutRight': 'SlideOutRight',
    'SlideOutLeft': 'SlideOutLeft',
    'SlideOutUp': 'SlideOutUp',
    'SlideOutDown': 'SlideOutDown',
    'Layout': 'Layout',

    // Utilities
    'interpolate': 'interpolate',
    'Extrapolation': 'Extrapolation',
    'Easing': 'Easing',

    // Stub implementations (not yet implemented in motion package)
    'useAnimatedProps': 'useAnimatedProps',
    'useAnimatedReaction': 'useAnimatedReaction',
    'useAnimatedGestureHandler': 'useAnimatedGestureHandler',
    'useAnimatedRef': 'useAnimatedRef',
    'cancelAnimation': 'cancelAnimation',
    'runOnJS': 'runOnJS',
    'runOnUI': 'runOnUI',
  };

  // Clean and split imports
  const cleanImports = imports
    .replace(/\s+/g, ' ')
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  // Map each import
  const mappedImports = cleanImports.map(imp => {
    return importMap[imp] || imp;
  });

  return mappedImports.join(', ');
}

function shouldScanFile(filePath) {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) {
    return false;
  }

  // Skip test files, stories, configs
  if (
    filePath.includes('.test.') ||
    filePath.includes('.spec.') ||
    filePath.includes('.stories.') ||
    filePath.includes('.config.')
  ) {
    return false;
  }

  return true;
}

function scanFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const changes = [];
  let newContent = content;

  // Check for react-native-reanimated usage
  const hasReanimated = /react-native-reanimated/.test(content);
  if (!hasReanimated) {
    return null; // No issues found
  }

  // Apply replacements
  for (const replacement of REPLACEMENTS) {
    if (replacement.isFunction) {
      const matches = [...content.matchAll(replacement.from)];
      if (matches.length > 0) {
        matches.forEach((match) => {
          const imports = match[1];
          const replacementText = replacement.to(match[0], imports);
          newContent = newContent.replace(match[0], replacementText);
          changes.push(`${replacement.description}: ${match[0]} → ${replacementText}`);
        });
      }
    } else {
      if (replacement.from.test(content)) {
        newContent = newContent.replace(replacement.from, replacement.to);
        changes.push(replacement.description);
      }
    }
  }

  if (changes.length === 0) {
    return null;
  }

  return {
    file: relative(ROOT, filePath),
    changes,
    needsManualReview: true, // All changes should be reviewed
  };
}

function scanDirectory(dirPath) {
  const reports = [];

  try {
    const entries = readdirSync(dirPath);

    for (const entry of entries) {
      const fullPath = join(dirPath, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        reports.push(...scanDirectory(fullPath));
      } else if (stat.isFile() && shouldScanFile(fullPath)) {
        const report = scanFile(fullPath);
        if (report) {
          reports.push(report);
        }
      }
    }
  } catch {
    // Skip directories that don't exist or can't be read
  }

  return reports;
}

function applyChanges(report) {
  const filePath = join(ROOT, report.file);
  const content = readFileSync(filePath, 'utf-8');
  let newContent = content;

  // Apply all replacements
  for (const replacement of REPLACEMENTS) {
    if (replacement.isFunction) {
      const matches = [...content.matchAll(replacement.from)];
      matches.forEach((match) => {
        const imports = match[1];
        const replacementText = replacement.to(match[0], imports);
        newContent = newContent.replace(match[0], replacementText);
      });
    } else {
      newContent = newContent.replace(replacement.from, replacement.to);
    }
  }

  if (newContent !== content) {
    writeFileSync(filePath, newContent, 'utf-8');
    console.log(`✅ Updated: ${report.file}`);
  }
}

async function main() {
  console.log('🔍 Scanning for react-native-reanimated imports...\n');

  const allReports = [];

  for (const scanPath of SCAN_PATHS) {
    const fullPath = join(ROOT, scanPath);
    const reports = scanDirectory(fullPath);
    allReports.push(...reports);
  }

  if (allReports.length === 0) {
    console.log('✅ No react-native-reanimated imports found!');
    return;
  }

  console.log(`Found ${allReports.length} file(s) with react-native-reanimated imports:\n`);

  for (const report of allReports) {
    console.log(`📄 ${report.file}`);

    if (report.changes.length > 0) {
      console.log('  Changes:');
      report.changes.forEach((change) => {
        console.log(`    - ${change}`);
      });
    }

    console.log('');
  }

  if (WRITE) {
    console.log('✏️  Applying changes...\n');
    for (const report of allReports) {
      applyChanges(report);
    }
    console.log('\n✅ Migration complete!');
    console.log('⚠️  Please review the changes and run tests to verify functionality.');
  } else {
    console.log('💡 Run with --write to apply changes');
    console.log('⚠️  All changes should be reviewed for correctness');
  }
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
