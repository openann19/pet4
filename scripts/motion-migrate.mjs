#!/usr/bin/env node
/**
 * Motion Migration Script
 * 
 * Replaces framer-motion imports with @petspark/motion equivalents
 * and reports CSS animation/transition usage for manual review.
 * 
 * Usage:
 *   node scripts/motion-migrate.mjs [--write]
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

// Paths to scan (exclude node_modules, dist, etc.)
const SCAN_PATHS = [
  'apps/web/src/components',
  'apps/web/src/effects',
  'packages/motion/src',
];

// Exceptions: files that are allowed to use framer-motion (web-only DOM routes)
const FRAMER_MOTION_ALLOWED = [
  // Add specific file paths here if they need framer-motion for SVG/canvas tricks
  // Example: 'apps/web/src/components/special-svg-component.tsx'
];

// Replacement mappings
const REPLACEMENTS = [
  {
    from: /from ['"]framer-motion['"]/g,
    to: "from '@petspark/motion'",
    description: 'framer-motion import',
  },
  {
    from: /import\s*{\s*motion\s*}\s*from\s*['"]framer-motion['"]/g,
    to: "import { MotionView, MotionText } from '@petspark/motion'",
    description: 'motion import',
  },
  {
    from: /<motion\.div/g,
    to: '<MotionView',
    description: 'motion.div → MotionView',
  },
  {
    from: /<motion\.span/g,
    to: '<MotionText',
    description: 'motion.span → MotionText',
  },
  {
    from: /<motion\.(button|a|section|article|header|footer|nav|main|aside)/g,
    to: (match: string) => {
      const tag = match.match(/motion\.(\w+)/)?.[1];
      return `<MotionView as="${tag}"`;
    },
    description: 'motion.* → MotionView',
  },
  {
    from: /AnimatePresence/g,
    to: 'Presence',
    description: 'AnimatePresence → Presence',
  },
];

// CSS patterns to report (for manual review)
const CSS_ANIMATION_PATTERNS = [
  { pattern: /animation:\s*[^;]+/g, name: 'CSS animation property' },
  { pattern: /@keyframes\s+\w+/g, name: 'CSS @keyframes' },
  { pattern: /transition:\s*(?!opacity|transform)[^;]+/g, name: 'CSS transition (non-opacity/transform)' },
];

interface Report {
  file: string;
  changes: string[];
  cssIssues: string[];
  needsManualReview: boolean;
}

function shouldScanFile(filePath: string): boolean {
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
  
  // Check if file is in allowed list
  const relPath = relative(ROOT, filePath);
  if (FRAMER_MOTION_ALLOWED.some((allowed) => relPath.includes(allowed))) {
    return false;
  }
  
  return true;
}

function scanFile(filePath: string): Report | null {
  const content = readFileSync(filePath, 'utf-8');
  const changes: string[] = [];
  const cssIssues: string[] = [];
  let newContent = content;
  
  // Check for framer-motion usage
  const hasFramerMotion = /framer-motion/.test(content);
  if (!hasFramerMotion && !CSS_ANIMATION_PATTERNS.some((p) => p.pattern.test(content))) {
    return null; // No issues found
  }
  
  // Apply replacements
  for (const replacement of REPLACEMENTS) {
    if (typeof replacement.to === 'function') {
      const matches = content.match(replacement.from);
      if (matches) {
        matches.forEach((match) => {
          const replacementText = replacement.to(match);
          newContent = newContent.replace(match, replacementText);
          changes.push(`${replacement.description}: ${match} → ${replacementText}`);
        });
      }
    } else {
      if (replacement.from.test(content)) {
        newContent = newContent.replace(replacement.from, replacement.to);
        changes.push(replacement.description);
      }
    }
  }
  
  // Check for CSS animation issues
  for (const cssPattern of CSS_ANIMATION_PATTERNS) {
    const matches = content.match(cssPattern.pattern);
    if (matches) {
      matches.forEach((match) => {
        cssIssues.push(`${cssPattern.name}: ${match}`);
      });
    }
  }
  
  if (changes.length === 0 && cssIssues.length === 0) {
    return null;
  }
  
  return {
    file: relative(ROOT, filePath),
    changes,
    cssIssues,
    needsManualReview: cssIssues.length > 0 || changes.length > 0,
  };
}

function scanDirectory(dirPath: string): Report[] {
  const reports: Report[] = [];
  
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
  } catch (error) {
    // Skip directories that don't exist or can't be read
  }
  
  return reports;
}

function applyChanges(report: Report): void {
  const filePath = join(ROOT, report.file);
  const content = readFileSync(filePath, 'utf-8');
  let newContent = content;
  
  // Apply all replacements
  for (const replacement of REPLACEMENTS) {
    if (typeof replacement.to === 'function') {
      const matches = content.match(replacement.from);
      if (matches) {
        matches.forEach((match) => {
          newContent = newContent.replace(match, replacement.to(match));
        });
      }
    } else {
      newContent = newContent.replace(replacement.from, replacement.to);
    }
  }
  
  if (newContent !== content) {
    writeFileSync(filePath, newContent, 'utf-8');
    console.log(`✅ Updated: ${report.file}`);
  }
}

async function main(): Promise<void> {
  console.log('🔍 Scanning for framer-motion imports and CSS animations...\n');
  
  const allReports: Report[] = [];
  
  for (const scanPath of SCAN_PATHS) {
    const fullPath = join(ROOT, scanPath);
    const reports = scanDirectory(fullPath);
    allReports.push(...reports);
  }
  
  if (allReports.length === 0) {
    console.log('✅ No framer-motion imports or CSS animation issues found!');
    return;
  }
  
  console.log(`Found ${allReports.length} file(s) with issues:\n`);
  
  for (const report of allReports) {
    console.log(`📄 ${report.file}`);
    
    if (report.changes.length > 0) {
      console.log('  Changes:');
      report.changes.forEach((change) => {
        console.log(`    - ${change}`);
      });
    }
    
    if (report.cssIssues.length > 0) {
      console.log('  ⚠️  CSS issues (needs manual review):');
      report.cssIssues.forEach((issue) => {
        console.log(`    - ${issue}`);
      });
    }
    
    console.log('');
  }
  
  if (WRITE) {
    console.log('✏️  Applying changes...\n');
    for (const report of allReports) {
      if (report.cssIssues.length === 0) {
        // Only auto-fix if no CSS issues (those need manual review)
        applyChanges(report);
      } else {
        console.log(`⏭️  Skipped (needs manual review): ${report.file}`);
      }
    }
    console.log('\n✅ Migration complete!');
    console.log('⚠️  Please review files with CSS issues manually.');
  } else {
    console.log('💡 Run with --write to apply changes');
    console.log('⚠️  Files with CSS issues need manual review');
  }
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
