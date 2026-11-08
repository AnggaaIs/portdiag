# Contributing

Thanks for considering a contribution. Portdiag is intentionally small: it diagnoses one TCP/IPv4 endpoint and never changes networking settings or stops processes. Please keep changes within that scope.

## Before opening an issue

Search existing issues first. For a bug, include the portdiag and Node.js versions, operating system, exact command, expected result, and actual result. Remove private addresses or other sensitive information from logs before posting.

## Before opening a pull request

Discuss larger behavior changes in an issue first. Keep pull requests focused, explain the user-visible reason for the change, and add or update tests for behavior changes.

Run these checks from the project directory:

```sh
npm test
npm pack --dry-run
```

There are no runtime dependencies. Please don't add one for work the Node.js standard library can handle, and don't publish a package release from a pull request.

## Scope

The project currently supports TCP over IPv4 on Windows, macOS, and Linux. It is read-only apart from the temporary TCP bind probe. Process termination, UDP, IPv6, scanning, and configuration systems are out of scope.
