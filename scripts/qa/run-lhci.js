#!/usr/bin/env node
/**
 * Run Lighthouse CI
 *
 * Executes Lighthouse CI with performance budgets.
 * Fails if budgets are exceeded.
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '../..');

const lighthousercPath = join(rootDir, 'apps/web/lighthouserc.js');

if (!existsSync(lighthousercPath)) {
  console.error('❌ Lighthouse CI config not found:', lighthousercPath);
  process.exit(1);
}

try {
  console.log('🚀 Running Lighthouse CI...');
  console.log('📊 Performance budgets:');
  console.log('  - LCP ≤ 2000ms');
  console.log('  - FCP ≤ 1200ms');
  console.log('  - TBT ≤ 300ms');
  console.log('  - CLS ≤ 0.1');
  console.log('  - Script size ≤ 500 KB');
  console.log('  - Stylesheet size ≤ 100 KB');
  console.log('');

  // Change to web app directory
  process.chdir(join(rootDir, 'apps/web'));

  // Run Lighthouse CI
  execSync('npx @lhci/cli autorun --config=lighthouserc.js', {
    stdio: 'inherit',
    cwd: join(rootDir, 'apps/web'),
  });

  console.log('✅ Lighthouse CI passed');
} catch (error) {
  console.error('❌ Lighthouse CI failed');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
