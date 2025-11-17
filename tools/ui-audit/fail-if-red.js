/**
 * CI Gate: Fail if Critical Findings Exist
 * Reads ci/summary.json and exits with code 1 if Critical findings are present
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const SUMMARY_PATH = join(process.cwd(), 'ci/summary.json');

function checkCriticalFindings() {
  if (!existsSync(SUMMARY_PATH)) {
    console.error('❌ CI summary not found. Run audit:aggregate first.');
    process.exit(1);
  }

  try {
    const content = readFileSync(SUMMARY_PATH, 'utf-8');
    const summary = JSON.parse(content);

    const criticalCount = summary.totals?.Critical || 0;
    const highCount = summary.totals?.High || 0;

    if (criticalCount > 0) {
      console.error(`❌ CRITICAL: ${criticalCount} critical finding(s) present.`);
      console.error('Blocking merge. Fix critical issues before proceeding.');
      process.exit(1);
    }

    if (highCount > 0) {
      console.warn(`⚠️  WARNING: ${highCount} high-severity finding(s) present.`);
      console.warn('Consider fixing high-severity issues before merging.');
    }

    console.warn('✅ No critical findings. CI gate passed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to read CI summary:', error);
    process.exit(1);
  }
}

checkCriticalFindings();
