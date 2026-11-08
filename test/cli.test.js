import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const cli = fileURLToPath(new URL('../bin/portdiag.js', import.meta.url));
function run(...args) {
  return spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });
}

test('prints JSON diagnostics', () => {
  const result = run('1', '--json');
  assert.ok([0, 1].includes(result.status));
  assert.equal(JSON.parse(result.stdout).port, 1);
});

test('human output identifies the checked endpoint', () => {
  const result = run('1', '--host', '127.0.0.1');
  assert.match(result.stdout, /127\.0\.0\.1:1/);
  assert.match(result.stdout, /Available/);
  assert.match(result.stdout, /TCP bind check|listener|denied/i);
  assert.match(result.stdout, /Next/);
  assert.doesNotMatch(result.stdout, /\u001b\[/);
});

test('rejects malformed arguments with exit code 2', () => {
  const result = run('nope', '--wat');
  assert.equal(result.status, 2);
  assert.match(result.stderr, /unsupported flag|port must be an integer/);
});

test('rejects invalid hosts with exit code 2', () => {
  const result = run('3000', '--host', 'not-an-ip');
  assert.equal(result.status, 2);
  assert.match(result.stderr, /IPv4/);
});

test('supports help and version', () => {
  assert.equal(run('--help').status, 0);
  assert.match(run('--version').stdout, /^0\.1\.0/);
});
