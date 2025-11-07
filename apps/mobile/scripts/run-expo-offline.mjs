#!/usr/bin/env node

import { spawn } from 'node:child_process';

const [command = 'start', ...extraArgs] = process.argv.slice(2);

const args = [command, ...extraArgs];

if (!args.includes('--offline')) {
  args.push('--offline');
}

const child = spawn('expo', args, {
  stdio: 'inherit',
  env: {
    ...process.env,
    EXPO_OFFLINE: '1',
    EXPO_NO_TELEMETRY: process.env['EXPO_NO_TELEMETRY'] ?? '1',
  },
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
