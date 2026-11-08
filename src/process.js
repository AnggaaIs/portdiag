import { execFile } from 'node:child_process';
import net from 'node:net';

function run(file, args, execute = execFile) {
  return new Promise((resolve) => {
    try {
      execute(file, args, {
        shell: false, windowsHide: true, timeout: 3000, maxBuffer: 64 * 1024,
      }, (error, stdout) => resolve(error ? null : stdout));
    } catch {
      resolve(null);
    }
  });
}

export function parseWindowsListener(output, port, host) {
  const listeners = [];
  for (const line of output.split(/\r?\n/)) {
    const fields = line.trim().split(/\s+/);
    if (fields.length < 5 || !/^TCP$/i.test(fields[0]) || !/^LISTENING$/i.test(fields[3])) continue;
    const endpoint = fields[1].match(/^(.+):(\d+)$/);
    if (!endpoint || Number(endpoint[2]) !== port) continue;
    const address = endpoint[1];
    if (!net.isIPv4(address)) continue;
    const conflicts = host === '0.0.0.0'
      ? true
      : address === host || address === '0.0.0.0';
    if (!conflicts) continue;
    const value = Number(fields[4]);
    listeners.push({ address, pid: Number.isSafeInteger(value) && value > 0 ? value : null });
  }
  if (listeners.length === 0) return null;
  if (listeners.some(({ pid }) => pid === null)) return { pid: null };
  const pids = new Set(listeners.map(({ pid }) => pid).filter((pid) => pid !== null));
  return { pid: pids.size === 1 ? [...pids][0] : null };
}

export function parseLsofPid(output) {
  const pids = new Set();
  for (const value of output.trim().split(/\s+/)) {
    if (!/^\d+$/.test(value)) continue;
    const pid = Number(value);
    if (Number.isSafeInteger(pid) && pid > 0) pids.add(pid);
  }
  return pids.size === 1 ? [...pids][0] : null;
}

export async function inspectWindowsListener(port, host, execute = execFile) {
  const output = await run('netstat', ['-ano', '-p', 'tcp'], execute);
  if (output === null) return { inspected: false, listener: null };
  return { inspected: true, listener: parseWindowsListener(output, port, host) };
}

export async function findListeningPid(port, platform = process.platform, execute = execFile, host = '0.0.0.0') {
  if (platform === 'win32') {
    const { listener } = await inspectWindowsListener(port, host, execute);
    return listener?.pid ?? null;
  }
  if (platform === 'linux' || platform === 'darwin') {
    const output = await run('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN', '-t'], execute);
    if (output === null) return null;
    return parseLsofPid(output);
  }
  return null;
}
