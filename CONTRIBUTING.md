# Contributing

Thanks for considering a contribution. Portdiag is intentionally small: it diagnoses one TCP/IPv4 endpoint and never changes networking settings or stops processes. Please keep changes within that scope.

## Before opening an issue

Search existing issues first. For a bug, include the portdiag and Node.js versions, operating system, exact command, expected result, and actual result. Remove private addresses or other sensitive information from logs before posting.

## Before opening a pull request

Discuss larger behavior changes in an issue first. Keep pull requests focused, explain the user-visible reason for the change, and add or update tests for behavior changes.

### Branch names

Use a short type and kebab-case summary. CI rejects pull requests with an unstructured branch name. Fork contributors may prefix the type with their username:

- `feat/json-output`
- `fix/windows-listener-detection`
- `docs/contributing-guide`
- `test/cli-output`
- `AnggaaIs/fix/windows-listener-detection`

### Commit messages

Every commit and pull request title must follow Conventional Commits. The check runs in CI and blocks merging when a message does not match.

```text
type(scope): lowercase summary
```

Allowed types are `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, and `revert`. Scope is optional. Keep the full first line to 72 characters or fewer. Use `!` before the colon for a breaking change.

Good examples:

```text
feat(cli): add json output
fix(windows): detect active listeners
docs: clarify supported platforms
```

Messages such as `update stuff`, `fix: Fix bug`, or `misc changes` fail CI. Squash merge is the only merge method, and the PR title becomes the resulting commit message, so keep both commits and PR title in this format.

Run these checks from the project directory:

```sh
npm test
npm pack --dry-run
```

The Conventional Commit check can also be run by CI on pull requests. To check a title locally, use the same format and length rules above.

There are no runtime dependencies. Please don't add one for work the Node.js standard library can handle, and don't publish a package release from a pull request.

## Releasing

Releases are published to npm when a version tag is pushed. First update `version` in `package.json` through a pull request, using a Conventional Commit such as `chore(release): bump version to 0.1.1`. After it is merged and CI passes, create and push the matching tag from `main`:

```sh
git switch main
git pull --ff-only
git tag v0.1.1
git push origin v0.1.1
```

The publish workflow checks that the tag matches `package.json`, verifies its commit is on `main`, reruns tests, checks the npm package contents, and publishes. Do not publish by pushing an unreviewed change or a tag from a feature branch.

The npm package uses GitHub Actions as a Trusted Publisher for user `AnggaaIs`, repository `portdiag`, and workflow `publish.yml`. It grants the workflow permission to publish with OIDC, so no long-lived npm token belongs in GitHub secrets. npm may show the publisher as pending validation until its first successful tag-based publish.

## Scope

The project currently supports TCP over IPv4 on Windows, macOS, and Linux. It is read-only apart from the temporary TCP bind probe. Process termination, UDP, IPv6, scanning, and configuration systems are out of scope.
