import { execFile } from 'node:child_process';

export function parseExcludedRanges(output) {
  const ranges = [];
  for (const line of output.split(/\r?\n/)) {
    const match = line.match(/^\s*(\d+)\s+(\d+)(?:\s+\*)?\s*$/);
    if (!match) continue;
    const start = Number(match[1]);
    const count = Number(match[2]);
    const end = start + count - 1;
    if (start > 0 && count > 0 && end <= 65535) ranges.push({ start, end });
  }
  return ranges;
}

export function findExcludedRange(port, output) {
  return parseExcludedRanges(output).find(({ start, end }) => port >= start && port <= end) ?? null;
}

export function getExcludedRange(port, execute = execFile) {
  return new Promise((resolve) => {
    try {
      execute('netsh', ['interface', 'ipv4', 'show', 'excludedportrange', 'protocol=tcp'], {
        shell: false, windowsHide: true, timeout: 3000, maxBuffer: 64 * 1024,
      }, (error, stdout) => resolve(error ? null : findExcludedRange(port, stdout)));
    } catch {
      resolve(null);
    }
  });
}
