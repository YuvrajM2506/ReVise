import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { parseGitHubReference } from '../src/revise-ui/services/revise';

const ACCEPTED: Array<[string, { owner: string; repo: string; pullNumber: number }]> = [
  // The exact shape that used to throw before any request was sent.
  ['https://github.com/physicshub/physicshub.github.io/pull/391', { owner: 'physicshub', repo: 'physicshub.github.io', pullNumber: 391 }],
  ['http://github.com/owner/repo/pull/12', { owner: 'owner', repo: 'repo', pullNumber: 12 }],
  ['github.com/owner/repo/pull/12', { owner: 'owner', repo: 'repo', pullNumber: 12 }],
  ['www.github.com/owner/repo/pull/12', { owner: 'owner', repo: 'repo', pullNumber: 12 }],
  ['https://github.com/owner/repo/pull/12/files', { owner: 'owner', repo: 'repo', pullNumber: 12 }],
  ['https://github.com/owner/repo/pull/12?diff=split', { owner: 'owner', repo: 'repo', pullNumber: 12 }],
  ['https://github.com/owner/repo/pull/12#discussion_r1', { owner: 'owner', repo: 'repo', pullNumber: 12 }],
  ['owner/repo PR #12', { owner: 'owner', repo: 'repo', pullNumber: 12 }],
  ['owner/repo · PR 12', { owner: 'owner', repo: 'repo', pullNumber: 12 }],
  ['owner/repo#12', { owner: 'owner', repo: 'repo', pullNumber: 12 }],
  ['  owner/repo PR 12  ', { owner: 'owner', repo: 'repo', pullNumber: 12 }],
];

for (const [input, expected] of ACCEPTED) {
  test(`parses ${JSON.stringify(input)}`, () => {
    assert.deepEqual(parseGitHubReference(input), expected);
  });
}

const REJECTED = [
  '',
  '   ',
  'not a reference',
  'https://github.com/owner/repo',
  'https://github.com/owner/repo/pull/0',
  'https://gitlab.com/owner/repo/pull/12',
  'owner/repo PR abc',
  'owner/repo',
];

for (const input of REJECTED) {
  test(`rejects ${JSON.stringify(input)}`, () => {
    assert.throws(() => parseGitHubReference(input), /GitHub pull request URL/);
  });
}

test('a very long repository name is not absorbed into the pull number', () => {
  const parsed = parseGitHubReference('https://github.com/owner/my.repo-name_2/pull/7');
  assert.deepEqual(parsed, { owner: 'owner', repo: 'my.repo-name_2', pullNumber: 7 });
});
