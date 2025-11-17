#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { cwd } from 'node:process';

const run = (cmd, args, opts = {}) =>
  new Promise(res => {
    const p = spawn(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32', ...opts });
    p.on('close', code => res(code ?? 1));
  });

const has = p => existsSync(p);

const tasks = [];
// TypeScript (Problems panel uses built-in matcher)
if (has('tsconfig.json')) tasks.push(['tsc', ['-p', 'tsconfig.json', '--noEmit', '--pretty', 'false']]);

// ESLint (use unix format so VS Code can parse with $eslint-compact)
tasks.push(['pnpm', ['-s', 'exec', 'eslint', '.', '--ext', '.js,.cjs,.mjs,.ts,.tsx', '--format', 'unix', '--max-warnings=0']]);

// Stylelint for CSS/tailwind files (compact formatter is easy to parse)
tasks.push(['pnpm', ['-s', 'exec', 'stylelint', '"**/*.{css,scss}"', '--allow-empty-input', '--formatter', 'compact'], { shell: true }]);

// Pyright (Node tool; good TS-like diagnostics for Python)
if (has('pyproject.toml') || has('requirements.txt')) tasks.push(['pnpm', ['-s', 'exec', 'pyright']]);

// Ruff (Python linter) – only if installed and Python exists
const useRuff = process.env.USE_RUFF ?? '1';
if (useRuff === '1') tasks.push(['bash', ['-lc', 'command -v ruff >/dev/null 2>&1 && ruff check . || exit 0']]);

// Playwright smoke (optional; won't fail if not configured)
tasks.push(['pnpm', ['-s', 'exec', 'playwright', 'test', '--reporter', 'line'], { env: { ...process.env, CI: '1' } }]);

(async () => {
  console.log(`\n🔎 Repo check @ ${cwd()}\n`);
  let fail = 0;
  for (const [cmd, args, opts] of tasks) {
    console.log(`\n— running: ${cmd} ${args.join(' ')}\n`);
    const code = await run(cmd, args, opts);
    if (code !== 0) fail = 1;
  }
  if (fail) {
    console.error('\n❌ Problems found. See output above.');
    process.exit(1);
  }
  console.log('\n✅ All checks passed.');
})();

