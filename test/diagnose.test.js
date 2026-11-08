import test from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import { diagnosePort } from '../src/index.js';

test('diagnoses a free ephemeral TCP port and closes its probe listener', async () => {
  const reservation = net.createServer();
  await new Promise((resolve) => reservation.listen(0, '127.0.0.1', resolve));
  const port = reservation.address().port;
  await new Promise((resolve) => reservation.close(resolve));
  const result = await diagnosePort(port);
  assert.equal(result.status, 'available');
  assert.equal(result.host, '127.0.0.1');
  const check = net.createServer();
  await new Promise((resolve, reject) => {
    check.once('error', reject);
    check.listen(port, '127.0.0.1', resolve);
  });
  await new Promise((resolve) => check.close(resolve));
});

test('diagnoses an occupied endpoint', async () => {
  const server = net.createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const result = await diagnosePort(server.address().port, { platform: 'unsupported' });
  assert.equal(result.status, 'in_use');
  assert.equal(result.code, 'EADDRINUSE');
  assert.equal(result.pid, null);
  await new Promise((resolve) => server.close(resolve));
});

test('Windows detects a listener even when the native bind probe is permitted', async (t) => {
  if (process.platform !== 'win32') return t.skip('Windows socket sharing behavior');
  const server = net.createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const result = await diagnosePort(server.address().port);
  assert.equal(result.status, 'in_use');
  assert.ok(result.pid === null || Number.isInteger(result.pid));
  await new Promise((resolve) => server.close(resolve));
});

test('validates port and host inputs', async () => {
  for (const port of [0, -1, 65536, 1.5, '3000']) {
    await assert.rejects(diagnosePort(port), RangeError);
  }
  await assert.rejects(diagnosePort(3000, { host: 'localhost' }), TypeError);
  await assert.rejects(diagnosePort(3000, { host: '999.1.1.1' }), TypeError);
});
