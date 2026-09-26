# Security policy

## Supported versions

Everyday Runtime is pre-1.0. Security fixes are made on the `main` branch and in
the latest released version only.

## Reporting a vulnerability

Please **do not** open a public issue for security problems.

Use GitHub's private vulnerability reporting instead:
**Security → Report a vulnerability** on
<https://github.com/mhilla/everyday-runtime/security/advisories/new>.

Please include:

- what an attacker could do and under which conditions,
- steps to reproduce (a minimal setup is enough),
- the version or commit you tested.

You can expect an acknowledgement within a week. We will keep you informed about
the fix and credit you in the release notes unless you prefer otherwise.

## Scope

In scope: the code in this repository — the front component, the logic functions
(including `GET /s/needs`), the data model and the permissions the app requests.

Out of scope: vulnerabilities in Twenty itself (report those to
[twentyhq/twenty](https://github.com/twentyhq/twenty/security)), and issues that
require an already compromised Twenty server or administrator account.

## How the repository is protected

- GitHub secret scanning and push protection are enabled.
- Dependabot alerts and security updates are enabled; `.github/dependabot.yml`
  proposes grouped dependency updates monthly.
- CodeQL code scanning (GitHub default setup) analyses the TypeScript code and
  the workflows.
- Pull requests run a dependency review that fails on new high-severity
  vulnerabilities.
- Workflows run with read-only tokens by default; third-party actions from
  outside GitHub are pinned to a commit SHA.

## Security notes for self-hosters

- The app has no backend of its own and makes no outbound network calls.
- `GET /s/needs` requires authentication and runs with the caller's permissions.
- The API key in `vitest.config.ts` is Twenty's public **development seed key** for
  the local Docker image. It is only valid against a local development server;
  never reuse it and never expose the development server to the internet.
