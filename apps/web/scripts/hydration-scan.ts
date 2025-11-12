/**
 * Hydration Hazard Scanner
 *
 * Scans source files for non-deterministic patterns that can cause hydration mismatches.
 * Flags: Math.random(), Date.now(), new Date(), crypto.randomUUID(), typeof window checks in render.
 *
 * Location: apps/web/scripts/hydration-scan.ts
 */

import fg from 'fast-glob';
import { readFileSync } from 'fs';
import { join } from 'path';

interface Offender {
  file: string;
  pattern: string;
  line?: number;
}

const BAD_PATTERNS = [
  {
    regex: /Math\.random\(/,
    name: 'Math.random()',
    description: 'Non-deterministic random number generation',
  },
  {
    regex: /Date\.now\(/,
    name: 'Date.now()',
    description: 'Non-deterministic timestamp',
  },
  {
    regex: /new Date\(\)/,
    name: 'new Date()',
    description: 'Non-deterministic date creation',
  },
  {
    regex: /crypto\.randomUUID\(/,
    name: 'crypto.randomUUID()',
    description: 'Non-deterministic UUID generation',
  },
  {
    regex: /typeof window !== 'undefined' && .*in render/s,
    name: 'typeof window check in render',
    description: 'Conditional rendering based on window (SSR/CSR mismatch)',
  },
];

const files = fg.sync(['src/**/*.{tsx,ts}', 'app/**/*.{tsx,ts}', 'pages/**/*.{tsx,ts}'], {
  dot: false,
  cwd: process.cwd(),
});

const offenders: Offender[] = [];

for (const file of files) {
  const filePath = join(process.cwd(), file);
  let src: string;

  try {
    src = readFileSync(filePath, 'utf8');
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.warn(`Failed to read ${file}: ${error.message}`);
    continue;
  }

  const isComponentFile =
    /function\s+\w+\([^)]*\)\s*{[\s\S]*return\s*\(/m.test(src) ||
    /=>\s*{[\s\S]*return\s*\(/m.test(src) ||
    /const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*{[\s\S]*return\s*\(/m.test(src) ||
    /export\s+(default\s+)?function\s+\w+\([^)]*\)\s*{[\s\S]*return\s*\(/m.test(src);

  if (!isComponentFile) {
    continue;
  }

  for (const pattern of BAD_PATTERNS) {
    if (pattern.regex.test(src)) {
      const lines = src.split('\n');
      const matchingLine = lines.findIndex((line) => pattern.regex.test(line));

      offenders.push({
        file,
        pattern: pattern.name,
        line: matchingLine >= 0 ? matchingLine + 1 : undefined,
      });
    }
  }
}

if (offenders.length > 0) {
  console.error('❌ Hydration hazards detected:\n');
  console.error(
    JSON.stringify(
      offenders.map((o) => ({
        file: o.file,
        pattern: o.pattern,
        line: o.line,
      })),
      null,
      2
    )
  );
  console.error(`\nTotal offenders: ${offenders.length}`);
  console.error('\nThese patterns can cause hydration mismatches between server and client.');
  console.error('Please refactor to use deterministic values or move to useEffect/client-only code.\n');

  process.exit(1);
} else {
  console.log('✅ No hydration hazards detected.');
  process.exit(0);
}
