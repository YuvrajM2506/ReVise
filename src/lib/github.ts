export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed' | string;
  html_url: string;
  created_at: string;
  updated_at: string;
  merged_at: string | null;
  closed_at: string | null;
  draft?: boolean;
  user: GitHubUser | null;
  head: {
    ref: string;
    sha: string;
    label?: string;
  };
  base: {
    ref: string;
    sha: string;
    label?: string;
  };
}

export interface GitHubFile {
  sha: string;
  filename: string;
  status: 'added' | 'removed' | 'modified' | 'renamed' | 'copied' | 'changed' | 'unchanged' | string;
  additions: number;
  deletions: number;
  changes: number;
  blob_url: string;
  raw_url: string;
  contents_url: string;
  patch?: string;
  previous_filename?: string;
}

export interface GitHubReview {
  id: number;
  body: string;
  state: string;
  html_url: string;
  submitted_at?: string;
  user: GitHubUser | null;
}

export interface ListPullsOptions {
  state?: 'open' | 'closed' | 'all';
  per_page?: number;
  page?: number;
  sort?: 'created' | 'updated' | 'popularity' | 'long-running';
  direction?: 'asc' | 'desc';
}

const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_API_VERSION = '2022-11-28';

function getGitHubToken(): string {
  const token = process.env.GITHUB_TOKEN;
  if (!token || token.trim() === '') {
    throw new Error('GITHUB_TOKEN is not configured in server environment variables.');
  }
  return token.trim();
}

function validateOwnerRepo(owner: string, repo: string): void {
  if (!owner || typeof owner !== 'string' || owner.trim() === '') {
    throw new Error('Invalid repository owner provided.');
  }
  if (!repo || typeof repo !== 'string' || repo.trim() === '') {
    throw new Error('Invalid repository name provided.');
  }
}

function validatePullNumber(pullNumber: number): void {
  if (!pullNumber || typeof pullNumber !== 'number' || !Number.isInteger(pullNumber) || pullNumber <= 0) {
    throw new Error('Invalid pull request number provided. Must be a positive integer.');
  }
}

async function handleGitHubError(response: Response, actionDescription: string): Promise<never> {
  const rateLimitRemaining = response.headers.get('x-ratelimit-remaining');
  const rateLimitReset = response.headers.get('x-ratelimit-reset');

  let errorMessage = '';
  try {
    const errorBody = await response.json();
    errorMessage = errorBody.message || '';
  } catch {
    try {
      errorMessage = await response.text();
    } catch {
      errorMessage = response.statusText;
    }
  }

  if (response.status === 401) {
    throw new Error(`GitHub API authentication failed while ${actionDescription}. Please verify GITHUB_TOKEN.`);
  }

  if (response.status === 403 || response.status === 429) {
    if (rateLimitRemaining === '0') {
      const resetTime = rateLimitReset ? new Date(parseInt(rateLimitReset, 10) * 1000).toISOString() : 'unknown';
      throw new Error(`GitHub API rate limit exceeded while ${actionDescription}. Limit resets at: ${resetTime}.`);
    }
  }

  if (response.status === 404) {
    throw new Error(`GitHub resource not found (404) while ${actionDescription}. Check owner/repo or pull number.`);
  }

  throw new Error(`GitHub API error (${response.status}) while ${actionDescription}: ${errorMessage || response.statusText}`);
}

/**
 * 1. Fetch pull requests for a repository
 * GET /repos/{owner}/{repo}/pulls
 */
export async function listPulls(
  owner: string,
  repo: string,
  options: ListPullsOptions = {}
): Promise<GitHubPullRequest[]> {
  validateOwnerRepo(owner, repo);
  const token = getGitHubToken();

  const queryParams = new URLSearchParams();
  if (options.state) queryParams.set('state', options.state);
  if (options.per_page) queryParams.set('per_page', String(options.per_page));
  if (options.page) queryParams.set('page', String(options.page));
  if (options.sort) queryParams.set('sort', options.sort);
  if (options.direction) queryParams.set('direction', options.direction);

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  const url = `${GITHUB_API_BASE}/repos/${encodeURIComponent(owner.trim())}/${encodeURIComponent(repo.trim())}/pulls${queryString}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/vnd.github+json',
      'Authorization': `Bearer ${token}`,
      'X-GitHub-Api-Version': GITHUB_API_VERSION,
      'User-Agent': 'ReVise-Code-Review-Agent',
    },
  });

  if (!response.ok) {
    await handleGitHubError(response, `listing pull requests for ${owner}/${repo}`);
  }

  const data: GitHubPullRequest[] = await response.json();
  return data;
}

/**
 * 2. Fetch the raw diff text of a pull request
 * GET /repos/{owner}/{repo}/pulls/{pullNumber} (Accept: application/vnd.github.diff)
 */
export async function getPullDiff(
  owner: string,
  repo: string,
  pullNumber: number
): Promise<string> {
  validateOwnerRepo(owner, repo);
  validatePullNumber(pullNumber);
  const token = getGitHubToken();

  const url = `${GITHUB_API_BASE}/repos/${encodeURIComponent(owner.trim())}/${encodeURIComponent(repo.trim())}/pulls/${pullNumber}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/vnd.github.diff',
      'Authorization': `Bearer ${token}`,
      'X-GitHub-Api-Version': GITHUB_API_VERSION,
      'User-Agent': 'ReVise-Code-Review-Agent',
    },
  });

  if (!response.ok) {
    await handleGitHubError(response, `fetching diff for PR #${pullNumber} in ${owner}/${repo}`);
  }

  return await response.text();
}

/**
 * 3. Fetch changed files metadata and patches for a pull request
 * GET /repos/{owner}/{repo}/pulls/{pullNumber}/files
 */
export async function getPullFiles(
  owner: string,
  repo: string,
  pullNumber: number
): Promise<GitHubFile[]> {
  validateOwnerRepo(owner, repo);
  validatePullNumber(pullNumber);
  const token = getGitHubToken();

  const url = `${GITHUB_API_BASE}/repos/${encodeURIComponent(owner.trim())}/${encodeURIComponent(repo.trim())}/pulls/${pullNumber}/files`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/vnd.github+json',
      'Authorization': `Bearer ${token}`,
      'X-GitHub-Api-Version': GITHUB_API_VERSION,
      'User-Agent': 'ReVise-Code-Review-Agent',
    },
  });

  if (!response.ok) {
    await handleGitHubError(response, `fetching files for PR #${pullNumber} in ${owner}/${repo}`);
  }

  const files: GitHubFile[] = await response.json();
  return files;
}

/**
 * 4. Post a single review / comment on a pull request
 * POST /repos/{owner}/{repo}/pulls/{pullNumber}/reviews
 */
export async function postPullReview(
  owner: string,
  repo: string,
  pullNumber: number,
  reviewBody: string
): Promise<GitHubReview> {
  validateOwnerRepo(owner, repo);
  validatePullNumber(pullNumber);

  if (typeof reviewBody !== 'string' || reviewBody.trim() === '') {
    throw new Error('Review comment body cannot be empty.');
  }

  const token = getGitHubToken();
  const url = `${GITHUB_API_BASE}/repos/${encodeURIComponent(owner.trim())}/${encodeURIComponent(repo.trim())}/pulls/${pullNumber}/reviews`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Accept': 'application/vnd.github+json',
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': GITHUB_API_VERSION,
      'User-Agent': 'ReVise-Code-Review-Agent',
    },
    body: JSON.stringify({
      body: reviewBody,
      event: 'COMMENT',
    }),
  });

  if (!response.ok) {
    await handleGitHubError(response, `posting review to PR #${pullNumber} in ${owner}/${repo}`);
  }

  const review: GitHubReview = await response.json();
  return review;
}
