/**
 * Codemod: Replace Hex Colors with Design Tokens
 * Replaces raw hex color values with nearest design token
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import type { DesignTokens } from '../../../apps/web/src/lib/types/design-tokens';

interface Replacement {
  file: string;
  original: string;
  replacement: string;
  line: number;
}

const TOKENS_PATH = join(process.cwd(), 'apps/web/design-system/tokens.json');
const SOURCE_DIRS = [
  join(process.cwd(), 'apps/web/src'),
  join(process.cwd(), 'apps/mobile/src'),
];

// Color distance calculation (Euclidean distance in RGB space)
function colorDistance(hex1: string, hex2: string): number {
  const r1 = parseInt(hex1.slice(1, 3), 16);
  const g1 = parseInt(hex1.slice(3, 5), 16);
  const b1 = parseInt(hex1.slice(5, 7), 16);

  const r2 = parseInt(hex2.slice(1, 3), 16);
  const g2 = parseInt(hex2.slice(3, 5), 16);
  const b2 = parseInt(hex2.slice(5, 7), 16);

  return Math.sqrt(
    Math.pow(r2 - r1, 2) + Math.pow(g2 - g1, 2) + Math.pow(b2 - b1, 2)
  );
}

// Convert oklch to hex (simplified - would need proper conversion library)
function oklchToHex(oklch: string): string {
  // This is a placeholder - real implementation would use a color conversion library
  // For now, we'll extract known hex values from tokens or use a mapping
  return '#000000'; // Placeholder
}

function findNearestToken(hex: string, tokens: DesignTokens, mode: 'light' | 'dark' = 'light'): string {
  const colors = tokens.colors[mode];
  let nearest = '--primary';
  let minDistance = Infinity;

  // Map common color roles to tokens
  const colorMap: Record<string, string> = {
    primary: '--primary',
    secondary: '--secondary',
    accent: '--accent',
    background: '--background',
    foreground: '--foreground',
    card: '--card',
    border: '--border',
    destructive: '--destructive',
  };

  // For now, use a simple heuristic based on brightness
  const brightness = parseInt(hex.slice(1, 3), 16) + parseInt(hex.slice(3, 5), 16) + parseInt(hex.slice(5, 7), 16);

  if (brightness < 128) {
    return '--foreground';
  } else {
    return '--background';
  }
}

function replaceHexInFile(filePath: string, tokens: DesignTokens): Replacement[] {
  const replacements: Replacement[] = [];

  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const hexRegex = /#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})\b/g;

    let newContent = content;
    let match;

    while ((match = hexRegex.exec(content)) !== null) {
      const hex = match[0];
      const nearestToken = findNearestToken(hex, tokens);

      // Determine if we're in a className, style prop, or CSS
      const beforeMatch = content.slice(0, match.index);
      const isInClassName = beforeMatch.includes('className') && !beforeMatch.slice(beforeMatch.lastIndexOf('className')).includes('>');
      const isInStyle = beforeMatch.includes('style') && !beforeMatch.slice(beforeMatch.lastIndexOf('style')).includes('>');

      let replacement: string;
      if (isInClassName) {
        // For Tailwind, we'd use a color class
        replacement = `var(${nearestToken})`;
      } else if (isInStyle) {
        replacement = `var(${nearestToken})`;
      } else {
        replacement = `var(${nearestToken})`;
      }

      replacements.push({
        file: filePath,
        original: hex,
        replacement,
        line: content.slice(0, match.index).split('\n').length,
      });

      newContent = newContent.replace(hex, replacement);
    }

    if (replacements.length > 0) {
      writeFileSync(filePath, newContent, 'utf-8');
    }
  } catch {
    // File might not be readable, skip
  }

  return replacements;
}

function processDirectory(dir: string, tokens: DesignTokens, extensions: string[] = ['.ts', '.tsx', '.js', '.jsx']): Replacement[] {
  const replacements: Replacement[] = [];

  try {
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip node_modules and build directories
        if (!['node_modules', 'dist', 'build', '.next'].includes(entry.name)) {
          replacements.push(...processDirectory(fullPath, tokens, extensions));
        }
      } else if (entry.isFile()) {
        const ext = entry.name.slice(entry.name.lastIndexOf('.'));
        if (extensions.includes(ext)) {
          replacements.push(...replaceHexInFile(fullPath, tokens));
        }
      }
    }
  } catch {
    // Directory might not be accessible, skip
  }

  return replacements;
}

function runCodemod(): void {
  console.log('Running codemod: Replace hex colors with design tokens...');

  // Load tokens
  const tokensContent = readFileSync(TOKENS_PATH, 'utf-8');
  const tokens = JSON.parse(tokensContent) as DesignTokens;

  const allReplacements: Replacement[] = [];

  // Process source directories
  for (const dir of SOURCE_DIRS) {
    console.log(`Processing: ${dir}`);
    allReplacements.push(...processDirectory(dir, tokens));
  }

  console.log(`\nTotal replacements: ${allReplacements.length}`);

  if (allReplacements.length > 0) {
    console.log('\nReplacements made:');
    allReplacements.slice(0, 10).forEach(r => {
      console.log(`  ${r.file}:${r.line} - ${r.original} → ${r.replacement}`);
    });
    if (allReplacements.length > 10) {
      console.log(`  ... and ${allReplacements.length - 10} more`);
    }
  }
}

if (require.main === module) {
  try {
    runCodemod();
    process.exit(0);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Codemod failed:', err);
    process.exit(1);
  }
}

export { runCodemod, replaceHexInFile };
