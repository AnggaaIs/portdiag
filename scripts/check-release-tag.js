import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export function releaseTagMatches(version, tag) {
  return tag === `v${version}`;
}

function main() {
  const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  const tag = process.env.GITHUB_REF_NAME;
  const commit = process.env.GITHUB_SHA;

  if (!releaseTagMatches(packageJson.version, tag ?? '')) {
    console.error(`Tag must be v${packageJson.version}; received ${tag ?? '(missing)'}.`);
    process.exitCode = 1;
    return;
  }

  if (!commit) {
    console.error('GITHUB_SHA is missing.');
    process.exitCode = 1;
    return;
  }

  try {
    execFileSync('git', ['merge-base', '--is-ancestor', commit, 'origin/main'], { stdio: 'ignore' });
  } catch {
    console.error('The tagged commit must already be merged into main.');
    process.exitCode = 1;
    return;
  }

  console.log(`Release tag ${tag} matches portdiag@${packageJson.version} on main.`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
