import test from 'node:test';
import assert from 'node:assert/strict';
import { isConventionalCommit, isStructuredBranch } from '../scripts/check-commit-messages.js';
import { releaseTagMatches } from '../scripts/check-release-tag.js';

test('accepts conventional commit headers', () => {
  for (const message of [
    'feat(cli): add json output',
    'fix(windows): detect active listeners',
    'docs: improve installation guide',
    'feat(api)!: change diagnosis result',
  ]) assert.equal(isConventionalCommit(message), true, message);
});

test('rejects unstructured, capitalized, unsupported, and overlong headers', () => {
  for (const message of [
    'Update readme',
    'docs: Update readme',
    'random: do a thing',
    `docs: ${'a'.repeat(70)}`,
  ]) assert.equal(isConventionalCommit(message), false, message);
});

test('accepts structured branch names and rejects unstructured names', () => {
  for (const branch of ['feat/json-output', 'fix/windows-listener-check', 'docs/readme-seo', 'AnggaaIs/chore/repo-cleanup']) {
    assert.equal(isStructuredBranch(branch), true, branch);
  }
  for (const branch of ['main', 'my-changes', 'fix/no_underscores', 'fix/Uppercase']) {
    assert.equal(isStructuredBranch(branch), false, branch);
  }
});

test('release tag must exactly match the package version', () => {
  assert.equal(releaseTagMatches('0.1.1', 'v0.1.1'), true);
  assert.equal(releaseTagMatches('0.1.1', '0.1.1'), false);
  assert.equal(releaseTagMatches('0.1.1', 'v0.1.2'), false);
});
