/**
 * Codemod: Fix Tailwind CSS variable syntax
 * text-[var(--color)] → text-(--color)
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from 'fs';
import { join } from 'path';

let filesChanged = 0;
let replacements = 0;

// Patterns: text-[var(--x)] → text-(--x)
const patterns = [
  /text-\[var\((--[^\)]+)\)\]/g,
  /bg-\[var\((--[^\)]+)\)\]/g,
  /border-\[var\((--[^\)]+)\)\]/g,
  /hover:text-\[var\((--[^\)]+)\)\]/g,
  /hover:bg-\[var\((--[^\)]+)\)\]/g,
  /focus:border-\[var\((--[^\)]+)\)\]/g,
  /focus:ring-\[var\((--[^\)]+)\)\]/g,
  /placeholder:text-\[var\((--[^\)]+)\)\]/g,
];

function fixFile(filePath: string): boolean {
  const content = readFileSync(filePath, 'utf-8');
  let newContent = content;
  let changed = false;
  
  for (const pattern of patterns) {
    const matches = content.match(pattern);
    if (matches) {
      newContent = newContent.replace(pattern, (match, varName) => {
        const prefix = match.split('-[var')[0];
        replacements++;
        return `${prefix}-(${varName})`;
      });
      changed = true;
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
        if (!entry.includes('node_modules') && !entry.includes('.git')) {
          processDirectory(fullPath);
        }
      } else if (entry.match(/\.(tsx?|jsx?)$/) && !entry.includes('.test.') && !entry.includes('.spec.')) {
        const changed = fixFile(fullPath);
        if (changed) {
          console.log(`✓ ${fullPath}`);
        }
      }
    }
  } catch (error) {
    console.warn(`⚠ Skipping ${dir}:`, error);
  }
}

console.log('🔧 Fixing CSS variable syntax...\n');

const webSrc = join(process.cwd(), 'apps/web/src');
processDirectory(join(webSrc, 'components'));

console.log(`\n✅ Complete!`);
console.log(`   Files changed: ${filesChanged}`);
console.log(`   Replacements: ${replacements}`);
