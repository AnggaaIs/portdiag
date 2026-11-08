import net from 'node:net';
import { getExcludedRange } from './windows.js';
import { findListeningPid, inspectWindowsListener } from './process.js';

function validate(port, host) {
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new RangeError('port must be an integer from 1 through 65535');
  }
  if (typeof host !== 'string' || !net.isIPv4(host)) {
    throw new TypeError('host must be a valid IPv4 address');
  }
}

function probe(port, host) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (error) => resolve({ error }));
    server.listen({ port, host, exclusive: true }, () => {
      server.close((error) => resolve({ error: error ?? null }));
    });
  });
}

/** @typedef {'available'|'in_use'|'reserved'|'permission_denied'|'address_unavailable'|'unknown'} PortStatus */

/**
 * @typedef {Object} PortDiagnosis
 * @property {number} port The checked TCP port.
 * @property {string} host The checked IPv4 address.
 * @property {PortStatus} status Diagnosis status.
 * @property {string|null} code Original operating-system bind error code, if binding failed.
 * @property {number|null} pid Best-effort PID of a conflicting listener.
 * @property {{start: number, end: number}|null} range Matching Windows excluded range, if found.
 * @property {string} explanation Plain-language summary of the evidence.
 * @property {string} suggestion A practical next step.
 */

/**
 * Check whether a TCP/IPv4 endpoint can be bound right now.
 *
 * @param {number} port Integer from 1 through 65535.
 * @param {{host?: string}} [options] Optional address; defaults to `127.0.0.1`.
 * @returns {Promise<PortDiagnosis>} Serializable diagnosis result.
 * @throws {RangeError} If `port` is outside the supported range or not an integer.
 * @throws {TypeError} If `options.host` is not a valid IPv4 address.
 */
export async function diagnosePort(port, options = {}) {
  const host = options.host ?? '127.0.0.1';
  const platform = options.platform ?? process.platform;
  validate(port, host);

  const result = {
    port, host, status: 'unknown', code: null, pid: null, range: null,
    explanation: '', suggestion: '',
  };
  const outcome = await probe(port, host);
  if (!outcome.error) {
    if (platform === 'win32') {
      const inspection = await inspectWindowsListener(port, host);
      if (!inspection.inspected) {
        result.explanation = `The bind probe succeeded for ${host}:${port}, but Windows listener inspection was unavailable, so existing use could not be ruled out.`;
        result.suggestion = 'Retry when netstat is available to verify whether another process is listening.';
        return result;
      }
      if (inspection.listener) {
        result.status = 'in_use';
        result.pid = inspection.listener.pid;
        result.explanation = `Windows netstat reports a TCP listener that conflicts with ${host}:${port}.`;
        result.suggestion = 'Check the listening process before deciding whether to stop it.';
        return result;
      }
    }
    result.status = 'available';
    result.explanation = `TCP endpoint ${host}:${port} accepted a bind probe and was available at the time of checking.`;
    result.suggestion = 'Start your app soon; another process could still claim the port.';
    return result;
  }

  result.code = outcome.error.code ?? null;
  if (result.code === 'EADDRINUSE') {
    result.status = 'in_use';
    result.explanation = `Another process or socket is already using ${host}:${port}.`;
    result.suggestion = 'Check the listening process before deciding whether to stop it.';
    result.pid = await findListeningPid(port, platform, undefined, host);
  } else if (result.code === 'EACCES' || result.code === 'EPERM') {
    result.status = 'permission_denied';
    result.explanation = `The operating system denied binding to ${host}:${port}.`;
    result.suggestion = 'Check local security policy and whether the port is reserved; do not change system settings without understanding the cause.';
    if (platform === 'win32') {
      result.range = await getExcludedRange(port);
      if (result.range) {
        result.status = 'reserved';
        result.explanation = `Port ${port} falls in the Windows excluded TCP range ${result.range.start}-${result.range.end}; this may explain the bind denial.`;
        result.suggestion = 'Choose a port outside this range.';
      }
    }
  } else if (result.code === 'EADDRNOTAVAIL') {
    result.status = 'address_unavailable';
    result.explanation = `The local IPv4 address ${host} is not available on this machine.`;
    result.suggestion = 'Choose an IPv4 address assigned to this machine.';
  } else {
    result.status = 'unknown';
    result.explanation = `The bind probe failed${result.code ? ` with ${result.code}` : ''}; available evidence does not identify the cause.`;
    result.suggestion = 'Check the operating-system error and retry the diagnosis.';
  }
  return result;
}
