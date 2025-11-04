#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const forbid = /\b(TODO|FIXME|HACK|SIMPLE|PLACEHOLDER)\b/i;

const files = execSync('git ls-files -z "**/*.*"', { encoding: 'utf8' })
  .split('\0')
  .filter(Boolean);

const bad = [];

for (const f of files) {
  try {
    const s = readFileSync(f, 'utf8');
    if (forbid.test(s)) bad.push(f);
  } catch {
    // Skip files that can't be read (binary, etc.)
  }
}

if (bad.length > 0) {
   
  console.error('Forbidden markers found in:\n' + bad.map(x => ' - ' + x).join('\n'));
  process.exit(1);
}

