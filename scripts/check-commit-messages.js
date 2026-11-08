import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const TYPES = 'feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert';
const HEADER = new RegExp(`^(${TYPES})(\\([a-z0-9][a-z0-9._/-]*\\))?(!)?: ([a-z0-9].+)$`);
const BRANCH = new RegExp(`^(?:[A-Za-z0-9-]+/)?(${TYPES})/[a-z0-9]+(?:-[a-z0-9]+)*$`);

export function isConventionalCommit(message) {
  const subject = message.trim();
  return subject.length <= 72 && HEADER.test(subject);
}

export function isStructuredBranch(name) {
  return BRANCH.test(name);
}

function main() {
  const { BASE_SHA, HEAD_SHA, HEAD_REF, PR_TITLE } = process.env;
  if (!BASE_SHA || !HEAD_SHA || !HEAD_REF || !PR_TITLE) {
    console.error('Missing pull request metadata. Run this check from a pull request workflow.');
    process.exitCode = 2;
    return;
  }

  let commits;
  try {
    commits = execFileSync('git', ['log', '--format=%s', `${BASE_SHA}..${HEAD_SHA}`], { encoding: 'utf8' })
      .split(/\r?\n/)
      .filter(Boolean);
  } catch (error) {
    console.error(`Could not read pull request commits: ${error.message}`);
    process.exitCode = 2;
    return;
  }

  const failures = commits.filter((message) => !isConventionalCommit(message));
  if (!isConventionalCommit(PR_TITLE)) failures.unshift(`PR title: ${PR_TITLE}`);
  if (!isStructuredBranch(HEAD_REF)) failures.unshift(`Branch name: ${HEAD_REF}`);
  if (failures.length > 0) {
    console.error('Use the required branch name and Conventional Commits for every commit and the PR title.');
    console.error('Branch format: type/short-kebab-summary, for example fix/windows-listener-check.');
    console.error('Format: type(scope): lowercase summary (72 characters max).');
    console.error('Allowed types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert.');
    console.error('Examples: feat(cli): add json output | fix(windows): detect active listeners');
    console.error('\nInvalid entries:');
    for (const message of failures) console.error(`  ${message}`);
    process.exitCode = 1;
    return;
  }

  console.log(`Validated PR title and ${commits.length} commit message(s).`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
