import { execFileSync } from 'child_process';
import path from 'path';
import fs from 'fs';

/**
 * Safe Git CLI execution helper preventing shell interpolation.
 */
function runGit(args: string[], cwd: string = process.cwd()): { ok: boolean; stdout: string; stderr: string } {
  try {
    const stdout = execFileSync('git', args, {
      cwd,
      encoding: 'utf-8',
      maxBuffer: 20 * 1024 * 1024, // 20MB buffer
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { ok: true, stdout: stdout.trim(), stderr: '' };
  } catch (err: any) {
    return {
      ok: false,
      stdout: err.stdout?.toString() || '',
      stderr: err.stderr?.toString() || err.message,
    };
  }
}

export function isGitRepo(cwd: string = process.cwd()): boolean {
  const res = runGit(['rev-parse', '--is-inside-work-tree'], cwd);
  return res.ok && res.stdout === 'true';
}

export function getGitRoot(cwd: string = process.cwd()): string | null {
  const res = runGit(['rev-parse', '--show-toplevel'], cwd);
  return res.ok ? res.stdout : null;
}

export function getCurrentBranch(cwd: string = process.cwd()): string {
  const res = runGit(['rev-parse', '--abbrev-ref', 'HEAD'], cwd);
  return res.ok ? res.stdout : 'HEAD';
}

export function getWorkingTreeDiff(cwd: string = process.cwd()): string {
  const res = runGit(['diff', 'HEAD'], cwd);
  return res.ok ? res.stdout : '';
}

export function getStagedDiff(cwd: string = process.cwd()): string {
  const res = runGit(['diff', '--cached'], cwd);
  return res.ok ? res.stdout : '';
}

export function getBranchDiff(baseBranch: string = 'main', cwd: string = process.cwd()): string {
  // Test if base branch exists
  const target = baseBranch.trim();
  const res = runGit(['diff', `${target}...HEAD`], cwd);
  if (res.ok && res.stdout) return res.stdout;
  
  // Fallback to origin/branch
  const remoteRes = runGit(['diff', `origin/${target}...HEAD`], cwd);
  return remoteRes.ok ? remoteRes.stdout : '';
}

export function getChangedFilesList(staged: boolean = false, cwd: string = process.cwd()): string[] {
  const args = staged ? ['diff', '--cached', '--name-only'] : ['diff', '--name-only', 'HEAD'];
  const res = runGit(args, cwd);
  if (!res.ok || !res.stdout) return [];
  return res.stdout.split('\n').map(f => f.trim()).filter(Boolean);
}

export function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = '';
    if (process.stdin.isTTY) {
      resolve('');
      return;
    }
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => {
      resolve(data.trim());
    });
    // Set a safety timeout
    setTimeout(() => {
      if (!data) resolve('');
    }, 1500);
  });
}
