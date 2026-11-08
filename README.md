# portdiag: TCP Port Diagnostics for Node.js

[![Tests](https://github.com/AnggaaIs/portdiag/actions/workflows/test.yml/badge.svg?branch=main)](https://github.com/AnggaaIs/portdiag/actions/workflows/test.yml)

Ever started a Node.js dev server and got an `EADDRINUSE` or “port already in use” error? `portdiag` checks a specific local TCP/IPv4 port and tells you what it can find, without killing anything or changing your network settings. It works on Windows, macOS, and Linux.

```console
$ npx portdiag 3000
portdiag
● In use  127.0.0.1:3000

Windows reports a listener on this endpoint.
PID: 1234

Next: Check the listening process before deciding whether to stop it.
```

## Try it

Run it without installing:

```sh
npx portdiag 3000
npx portdiag 3000 --host 192.168.1.10
npx portdiag 3000 --json
```

Or install it with `npm install --global portdiag` and use `portdiag` directly. The default address is `127.0.0.1`; `--host` takes an IPv4 address. Use `portdiag --help` for the full command list.

The color in the terminal is just there to help status stand out. Piped output stays plain, and setting `NO_COLOR` disables color too.

## What it checks

Portdiag asks the operating system to bind a temporary TCP listener to the exact address and port you gave it, then closes that listener. On Windows, a successful bind by itself can be misleading: Windows may allow another socket to bind an endpoint that already has a listener. Portdiag checks `netstat` as well so it doesn’t report that endpoint as free. If `netstat` isn’t available, it says the result is unknown rather than guessing.

When binding is denied on Windows, it also checks for an excluded TCP port range with `netsh`. A matching range may explain the problem, but it isn’t proof of the only cause. For an occupied port, portdiag may find a PID with `netstat` (Windows) or `lsof` (macOS/Linux). PID lookup is best effort; if the result is missing or ambiguous, it reports no PID.

The result is only about the address checked. `127.0.0.1:3000` and `192.168.1.10:3000` are different endpoints. And “available” means the bind worked at that moment. Another process can still grab the port a moment later.

### Reading the result

- **Available:** the bind check succeeded for the address shown. Start your app soon; another process could still claim it first.
- **In use:** a listener conflicts with that endpoint. A PID is shown only when the operating system identifies one reliably.
- **Reserved:** Windows reports that the port falls in an excluded TCP range. That may explain the bind failure, but it is not proof of the only cause.
- **Permission denied:** the operating system rejected the bind. Portdiag won’t assume that running as administrator is the right fix.
- **Address unavailable:** the requested IPv4 address is not assigned to this machine.
- **Unknown:** the available evidence wasn’t enough to identify the cause. Check the OS error shown in JSON output, if present.

Portdiag supports Windows, macOS, and Linux, requires Node.js 22 or newer, and has no runtime dependencies. It checks TCP over IPv4 only; it does not inspect UDP or IPv6. It won’t stop processes, modify excluded ranges, scan other ports, ask for admin access, or send network requests.

### Platform checks

Portdiag checks for optional OS tools when it needs them; there’s no separate setup or `doctor` command.

| Platform | Main check | If an OS tool is unavailable |
| --- | --- | --- |
| Windows | TCP bind probe, then `netstat` cross-check; `netsh` for excluded ranges | Without `netstat`, status is `unknown` if the bind succeeded but an existing listener couldn’t be ruled out. Without `netsh`, the bind diagnosis remains, but no excluded range is reported. |
| macOS | TCP bind probe; `lsof` for a PID | The diagnosis still works; `pid` is `null`. |
| Linux | TCP bind probe; `lsof` for a PID | The diagnosis still works; `pid` is `null`. |

GitHub Actions is configured to run the test suite on Windows, macOS, and Linux. Actual results are available after the workflow runs for a pushed branch or pull request.

## Use it from JavaScript

```js
import { diagnosePort } from 'portdiag';

const result = await diagnosePort(3000);
console.log(result.status, result.explanation);
```

`diagnosePort(port, options?)` accepts an integer port from `1` to `65535`. Set `options.host` to choose another IPv4 address. Invalid ports reject with `RangeError`; invalid addresses reject with `TypeError`.

The returned object is JSON-serializable:

```js
{
  port: 3000,
  host: '127.0.0.1',
  status: 'available', // available | in_use | reserved | permission_denied | address_unavailable | unknown
  code: null,          // original OS bind error, or null
  pid: null,           // best effort
  range: null,         // { start, end } for a matching Windows range
  explanation: '...',
  suggestion: '...'
}
```

The CLI exits with `0` when available, `1` when unavailable, `2` for invalid arguments, and `3` when it can’t complete the diagnosis.

## Working on portdiag

```sh
npm test
npm pack --dry-run
```

The test suite uses Node’s built-in test runner; GitHub Actions runs it on Windows, macOS, and Linux. Pull requests must use [Conventional Commits](CONTRIBUTING.md#commit-messages); CI checks every commit and the PR title. Bug and feature forms are in `.github/ISSUE_TEMPLATE/`. See [CONTRIBUTING.md](CONTRIBUTING.md) before sending a pull request and [SECURITY.md](SECURITY.md) to report a vulnerability privately. Releases are published to npm from version tags after the version bump is merged into `main`. See [CONTRIBUTING.md](CONTRIBUTING.md#releasing) for release steps and npm Trusted Publisher setup.

```sh
npm publish --access public
```

After that, `npx portdiag` will install and run the published CLI. The package is MIT licensed; see [LICENSE](LICENSE).
