#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { diagnosePort } from '../src/index.js';

const help = `Usage: portdiag <port> [--host <ipv4-address>] [--json]
       portdiag --help
       portdiag --version

Checks whether a TCP/IPv4 endpoint can be bound. Default host: 127.0.0.1.`;

function invalid(message) {
  console.error(`Error: ${message}\n\n${help}`);
  process.exitCode = 2;
}

const useColor = Boolean(process.stdout.isTTY && !process.env.NO_COLOR && process.env.TERM !== 'dumb');
const paint = (text, code) => useColor ? `\u001B[${code}m${text}\u001B[0m` : text;

function printResult(result) {
  const display = {
    available: ['✓ Available', '32'],
    in_use: ['● In use', '31'],
    reserved: ['● Reserved', '35'],
    permission_denied: ['! Permission denied', '33'],
    address_unavailable: ['! Address unavailable', '33'],
    unknown: ['? Unknown', '90'],
  }[result.status];

  const endpoint = `${result.host}:${result.port}`;
  const reason = {
    available: 'The TCP bind check succeeded just now.',
    in_use: result.code
      ? 'The operating system reports this endpoint is already in use.'
      : 'Windows reports a listener on this endpoint.',
    reserved: 'A Windows excluded port range may explain the bind failure.',
    permission_denied: 'The operating system denied the bind request.',
    address_unavailable: 'This IPv4 address is not assigned to this machine.',
    unknown: `Could not determine why the bind failed${result.code ? ` (${result.code})` : ''}.`,
  }[result.status];

  console.log(paint('portdiag', '1'));
  console.log(`${paint(display[0], display[1])}  ${endpoint}`);
  console.log(`\n${reason}`);
  if (result.pid !== null) console.log(`PID: ${result.pid}`);
  if (result.range) console.log(`Range: ${result.range.start}-${result.range.end}`);
  console.log(`\nNext: ${result.suggestion}`);
}

const args = process.argv.slice(2);
if (args.length === 1 && args[0] === '--help') {
  console.log(help);
} else if (args.length === 1 && args[0] === '--version') {
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  console.log(pkg.version);
} else {
  let portText;
  let host = '127.0.0.1';
  let hostSeen = false;
  let json = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--json') {
      if (json) { invalid('duplicate --json flag'); break; }
      json = true;
    } else if (args[i] === '--host') {
      if (hostSeen || !args[i + 1] || args[i + 1].startsWith('--')) { invalid('--host requires one IPv4 address'); break; }
      hostSeen = true;
      host = args[++i];
    } else if (args[i].startsWith('--')) {
      invalid(`unsupported flag: ${args[i]}`); break;
    } else if (portText === undefined) {
      portText = args[i];
    } else {
      invalid('provide exactly one port'); break;
    }
  }
  if (!process.exitCode) {
    if (portText === undefined || !/^\d+$/.test(portText)) invalid('port must be an integer from 1 through 65535');
    else if (Number(portText) < 1 || Number(portText) > 65535) invalid('port must be an integer from 1 through 65535');
    else {
      try {
        const result = await diagnosePort(Number(portText), { host });
        if (json) console.log(JSON.stringify(result, null, 2));
        else printResult(result);
        process.exitCode = result.status === 'available' ? 0 : result.status === 'unknown' ? 3 : 1;
      } catch (error) {
        if (error instanceof TypeError || error instanceof RangeError) {
          invalid(error.message);
        } else {
          console.error(`Diagnosis failed: ${error.message}`);
          process.exitCode = 3;
        }
      }
    }
  }
}
