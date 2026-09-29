#!/usr/bin/env node

const path = require('path');
const { spawn } = require('child_process');

const tsxBin = path.join(__dirname, '..', 'frontend', 'node_modules', '.bin', process.platform === 'win32' ? 'tsx.cmd' : 'tsx');
const binTs = path.join(__dirname, '..', 'cli', 'src', 'bin.ts');

const child = spawn(tsxBin, [binTs, ...process.argv.slice(2)], {
  stdio: 'inherit',
  cwd: process.cwd(),
  shell: process.platform === 'win32',
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
