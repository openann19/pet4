#!/usr/bin/env node
/**
 * Check Bundle Size
 *
 * Verifies that bundle sizes are within limits.
 * Fails if any bundle exceeds the maximum size.
 */

import { existsSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '../..');

// Bundle size limits (in bytes)
const BUNDLE_LIMITS = {
  'dist/assets/index-*.js': 500 * 1024, // 500 KB
  'dist/assets/index-*.css': 100 * 1024, // 100 KB
  'dist/assets/vendor-*.js': 1000 * 1024, // 1 MB
};

// Find build output directory
const distDir = join(rootDir, 'apps/web/dist');

if (!existsSync(distDir)) {
  console.error('❌ Build output not found. Run "pnpm build" first.');
  process.exit(1);
}

function checkBundleSizes() {
  console.log('📦 Checking bundle sizes...');
  console.log('');

  let hasErrors = false;

  // Check all JS and CSS files in dist/assets
  const assetsDir = join(distDir, 'assets');
  if (!existsSync(assetsDir)) {
    console.error('❌ Assets directory not found');
    process.exit(1);
  }

  const files = readdirSync(assetsDir);

  for (const file of files) {
    const filePath = join(assetsDir, file);
    const stats = statSync(filePath);
    const size = stats.size;

    // Check against limits based on file type
    let maxSize = 0;
    if (file.endsWith('.js')) {
      if (file.includes('vendor')) {
        maxSize = BUNDLE_LIMITS['dist/assets/vendor-*.js'];
      } else {
        maxSize = BUNDLE_LIMITS['dist/assets/index-*.js'];
      }
    } else if (file.endsWith('.css')) {
      maxSize = BUNDLE_LIMITS['dist/assets/index-*.css'];
    } else {
      continue; // Skip non-JS/CSS files
    }

    const sizeKB = (size / 1024).toFixed(2);
    const maxSizeKB = (maxSize / 1024).toFixed(2);

    if (size > maxSize) {
      console.error(`❌ ${file}`);
      console.error(`   Size: ${sizeKB} KB (limit: ${maxSizeKB} KB)`);
      console.error(`   Exceeded by: ${((size - maxSize) / 1024).toFixed(2)} KB`);
      console.error('');
      hasErrors = true;
    } else {
      console.log(`✅ ${file}`);
      console.log(`   Size: ${sizeKB} KB / ${maxSizeKB} KB`);
      console.log('');
    }
  }

  if (hasErrors) {
    console.error('❌ Bundle size check failed');
    process.exit(1);
  }

  console.log('✅ Bundle size check passed');
}

try {
  checkBundleSizes();
} catch (error) {
  console.error('❌ Bundle size check failed');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
