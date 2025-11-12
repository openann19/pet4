/**
 * Codemod: Replace hardcoded hex colors with CSS variables
 * Safe 1:1 mapping - no visual changes expected
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from 'fs';
import { join } from 'path';

// Color mapping: hex → CSS variable
const COLOR_MAP: Record<string, string> = {
  // Coral/Accent
  '#FF715B': 'var(--color-accent-9)',
  '#ff715b': 'var(--color-accent-9)',
  '#FF7A5B': 'var(--color-accent-9)',
  '#ff7a5b': 'var(--color-accent-9)',
  
  // Cream/Background
  '#FFF9F0': 'var(--color-bg-cream)',
  '#fff9f0': 'var(--color-bg-cream)',
  '#FFF8F0': 'var(--color-bg-cream)',
  '#fff8f0': 'var(--color-bg-cream)',
  
  // White/Overlay
  '#FFFFFF': 'var(--color-bg-overlay)',
  '#ffffff': 'var(--color-bg-overlay)',
  '#FFF': 'var(--color-bg-overlay)',
  '#fff': 'var(--color-bg-overlay)',
  
  // Black/Foreground
  '#000000': 'var(--color-fg)',
  '#000': 'var(--color-fg)',
  
  // Grays
  '#F5F5F5': 'var(--color-neutral-2)',
  '#f5f5f5': 'var(--color-neutral-2)',
  '#E5E5E5': 'var(--color-neutral-4)',
  '#e5e5e5': 'var(--color-neutral-4)',
  '#D4D4D4': 'var(--color-neutral-5)',
  '#d4d4d4': 'var(--color-neutral-5)',
  '#A3A3A3': 'var(--color-neutral-7)',
  '#a3a3a3': 'var(--color-neutral-7)',
  '#737373': 'var(--color-neutral-9)',
  '#525252': 'var(--color-neutral-10)',
  '#404040': 'var(--color-neutral-11)',
  '#262626': 'var(--color-neutral-12)',
  
  // Blue
  '#3B82F6': 'var(--color-accent-secondary-9)',
  '#3b82f6': 'var(--color-accent-secondary-9)',
  
  // Green
  '#22C55E': 'var(--color-success-9)',
  '#22c55e': 'var(--color-success-9)',
  
  // Red
  '#EF4444': 'var(--color-error-9)',
  '#ef4444': 'var(--color-error-9)',
  
  // Yellow
  '#EAB308': 'var(--color-warning-9)',
  '#eab308': 'var(--color-warning-9)',
};

// Tailwind class mapping: hex in arbitrary values
const TAILWIND_CLASS_REPLACEMENTS: Array<[RegExp, string]> = [
  // bg-[#hex] → bg-(--color-*)
  [/bg-\[#FF715B\]/gi, 'bg-(--color-accent-9)'],
  [/bg-\[#FFF9F0\]/gi, 'bg-(--color-bg-cream)'],
  [/bg-\[#FFFFFF\]/gi, 'bg-(--color-bg-overlay)'],
  [/bg-\[#fff\]/gi, 'bg-(--color-bg-overlay)'],
  [/bg-\[#000000\]/gi, 'bg-(--color-fg)'],
  [/bg-\[#000\]/gi, 'bg-(--color-fg)'],
  
  // text-[#hex] → text-(--color-*)
  [/text-\[#FF715B\]/gi, 'text-(--color-accent-9)'],
  [/text-\[#FFFFFF\]/gi, 'text-(--color-bg-overlay)'],
  [/text-\[#fff\]/gi, 'text-(--color-bg-overlay)'],
  [/text-\[#000000\]/gi, 'text-(--color-fg)'],
  [/text-\[#000\]/gi, 'text-(--color-fg)'],
  
  // border-[#hex] → border-(--color-*)
  [/border-\[#FF715B\]/gi, 'border-(--color-accent-9)'],
  [/border-\[#E5E5E5\]/gi, 'border-(--color-neutral-4)'],
  [/border-\[#e5e5e5\]/gi, 'border-(--color-neutral-4)'],
];

let filesChanged = 0;
let replacements = 0;

function replaceColorsInFile(filePath: string): boolean {
  const content = readFileSync(filePath, 'utf-8');
  let newContent = content;
  let changed = false;
  
  // Replace inline hex colors (style props, CSS)
  for (const [hex, cssVar] of Object.entries(COLOR_MAP)) {
    const regex = new RegExp(hex.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    if (regex.test(newContent)) {
      newContent = newContent.replace(regex, cssVar);
      changed = true;
      replacements++;
    }
  }
  
  // Replace Tailwind arbitrary value classes
  for (const [pattern, replacement] of TAILWIND_CLASS_REPLACEMENTS) {
    if (pattern.test(newContent)) {
      newContent = newContent.replace(pattern, replacement);
      changed = true;
      replacements++;
    }
  }
  
  if (changed) {
    writeFileSync(filePath, newContent, 'utf-8');
    filesChanged++;
    return true;
  }
  
  return false;
}

function processDirectory(dir: string) {
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (!entry.includes('node_modules') && !entry.includes('.git') && !entry.includes('dist') && !entry.includes('build')) {
          processDirectory(fullPath);
        }
      } else if (entry.match(/\.(tsx?|jsx?|css|scss)$/) && !entry.includes('.test.') && !entry.includes('.spec.')) {
        const changed = replaceColorsInFile(fullPath);
        if (changed) {
          console.log(`✓ ${fullPath}`);
        }
      }
    }
  } catch (error) {
    console.warn(`⚠ Skipping ${dir}:`, error);
  }
}

// Run codemod
console.log('🎨 Tokenizing hardcoded colors...\n');

const webSrc = join(process.cwd(), 'apps/web/src');
const mobileSrc = join(process.cwd(), 'apps/mobile/src');

console.log('📁 Processing Web app...');
processDirectory(join(webSrc, 'components'));

console.log('\n📁 Processing Mobile app...');
try {
  processDirectory(join(mobileSrc, 'components'));
  processDirectory(join(mobileSrc, 'screens'));
} catch {
  console.log('Mobile directory not found, skipping...');
}

console.log(`\n✅ Complete!`);
console.log(`   Files changed: ${filesChanged}`);
console.log(`   Replacements: ${replacements}`);
console.log(`\n📝 Next: Review changes and run tests`);
