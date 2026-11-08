import test from 'node:test';
import assert from 'node:assert/strict';
import { findExcludedRange, getExcludedRange, parseExcludedRanges } from '../src/windows.js';
import { findListeningPid, inspectWindowsListener, parseLsofPid, parseWindowsListener } from '../src/process.js';

test('parses multiple Windows excluded ranges with whitespace and markers', () => {
  const output = ' Start Port    Number of Ports\r\n  1000       10\r\n  8680       100 *\r\n  9000       2\r\n';
  assert.deepEqual(parseExcludedRanges(output), [
    { start: 1000, end: 1009 },
    { start: 8680, end: 8779 },
    { start: 9000, end: 9001 },
  ]);
});

test('matches inclusive endpoints and rejects malformed output', () => {
  const output = '  8680 100 *\n  9000 5\n nonsense 8';
  assert.deepEqual(findExcludedRange(8680, output), { start: 8680, end: 8779 });
  assert.equal(findExcludedRange(8780, output), null);
  assert.equal(findExcludedRange(1, 'unexpected output'), null);
});

test('matches only Windows listeners that overlap the requested IPv4 host', () => {
  const output = [
    ' TCP    0.0.0.0:3000    0.0.0.0:0    LISTENING    111',
    ' TCP    127.0.0.1:3001  0.0.0.0:0    LISTENING    222',
    ' TCP    192.168.1.2:3002 0.0.0.0:0   LISTENING    333',
  ].join('\r\n');
  assert.deepEqual(parseWindowsListener(output, 3000, '127.0.0.1'), { pid: 111 });
  assert.deepEqual(parseWindowsListener(output, 3000, '0.0.0.0'), { pid: 111 });
  assert.equal(parseWindowsListener(output, 3001, '10.0.0.1'), null);
  assert.deepEqual(parseWindowsListener(output, 3002, '192.168.1.2'), { pid: 333 });
});

test('Windows listener inspection distinguishes missing netstat from no listener', async () => {
  const missing = (_file, _args, _options, callback) => callback(Object.assign(new Error('missing'), { code: 'ENOENT' }));
  assert.deepEqual(await inspectWindowsListener(3000, '127.0.0.1', missing), { inspected: false, listener: null });
  const empty = (_file, _args, _options, callback) => callback(null, 'no matching rows');
  assert.deepEqual(await inspectWindowsListener(3000, '127.0.0.1', empty), { inspected: true, listener: null });
});

test('returns an lsof PID only when exactly one valid PID is found', () => {
  assert.equal(parseLsofPid('1234\n'), 1234);
  assert.equal(parseLsofPid(''), null);
  assert.equal(parseLsofPid('1234\n5678\n'), null);
  assert.equal(parseLsofPid('not-a-pid'), null);
});

test('PID inspection degrades gracefully on missing tools and unusable results', async () => {
  const missing = (_file, _args, _options, callback) => callback(Object.assign(new Error('missing'), { code: 'ENOENT' }));
  assert.equal(await findListeningPid(3000, 'linux', missing), null);
  assert.equal(await findListeningPid(3000, 'linux', () => { throw new Error('blocked'); }), null);
  const incomplete = (_file, _args, _options, callback) => callback(null, '');
  assert.equal(await findListeningPid(3000, 'darwin', incomplete), null);
});

test('Windows range command failures never imply a reserved port', async () => {
  const denied = (_file, _args, _options, callback) => callback(Object.assign(new Error('denied'), { code: 'EACCES' }), ' 3000 1');
  assert.equal(await getExcludedRange(3000, denied), null);
  const success = (_file, _args, _options, callback) => callback(null, ' 3000 1');
  assert.deepEqual(await getExcludedRange(3000, success), { start: 3000, end: 3000 });
});
