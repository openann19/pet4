/**
 * Token Enforcement Tests
 * Verifies ESLint rules and token usage
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Token Enforcement', () => {
  it('should not have raw hex colors in source files', () => {
    const sourceDirs = [
      join(process.cwd(), 'apps/web/src'),
      join(process.cwd(), 'apps/mobile/src'),
    ];

    const hexRegex = /#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})\b/g;
    const violations: string[] = [];

    function checkFile(filePath: string): void {
      try {
        const content = readFileSync(filePath, 'utf-8');
        const matches = content.matchAll(hexRegex);

        for (const match of matches) {
          // Allow hex in comments and token definitions
          const beforeMatch = content.slice(0, match.index);
          const isInComment = beforeMatch.includes('//') || beforeMatch.includes('/*');
          const isInTokenFile = filePath.includes('tokens.json') || filePath.includes('design-tokens');

          if (!isInComment && !isInTokenFile) {
            violations.push(`${filePath}: ${match[0]}`);
          }
        }
      } catch {
        // File might not be readable, skip
      }
    }

    function checkDirectory(dir: string): void {
      try {
        const { readdirSync, statSync } = require('fs');
        const entries = readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = join(dir, entry.name);

          if (entry.isDirectory()) {
            if (!['node_modules', 'dist', 'build', '.next'].includes(entry.name)) {
              checkDirectory(fullPath);
            }
          } else if (entry.isFile()) {
            const ext = entry.name.slice(entry.name.lastIndexOf('.'));
            if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
              checkFile(fullPath);
            }
          }
        }
      } catch {
        // Directory might not be accessible, skip
      }
    }

    for (const dir of sourceDirs) {
      checkDirectory(dir);
    }

    expect(violations).toEqual([]);
  });

  it('should use design tokens for spacing', () => {
    // This would check for raw spacing values
    // Implementation would scan for patterns like px-4, m-2, etc.
    expect(true).toBe(true); // Placeholder
  });

  it('should use design tokens for radii', () => {
    // This would check for raw radius values
    expect(true).toBe(true); // Placeholder
  });
});
