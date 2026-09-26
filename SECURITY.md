# Security policy

## Supported versions

Everyday Runtime is pre-1.0. Security fixes are made on the `main` branch and in
the latest released version only.

## Reporting a vulnerability

Please **do not** open a public issue for security problems.

Use GitHub's private vulnerability reporting instead:
**Security → Report a vulnerability** on
<https://github.com/micha16372/everyday-runtime/security/advisories/new>.

Please include:

- what an attacker could do and under which conditions,
- steps to reproduce (a minimal setup is enough),
- the version or commit you tested.

You can expect an acknowledgement within a week. We will keep you informed about
the fix and credit you in the release notes unless you prefer otherwise.

## Scope

In scope: the code in this repository — the front component, the logic functions
(the `/s/…` HTTP routes and AI tools), the data model, the permissions the app
requests, the Home Assistant integration and the Alexa skill.

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

- The app has no backend of its own. The only outbound call is the optional
  `GET /s/community-prices` route, which sends a barcode to Open Food Facts /
  Open Prices when a person asks for community prices.
- `GET /s/needs` requires authentication and runs with the caller's permissions.
- The API key in `vitest.config.ts` is Twenty's public **development seed key** for
  the local Docker image. It is only valid against a local development server;
  never reuse it and never expose the development server to the internet.

## How the repository protects itself

Open source means anyone can propose code, so nothing from outside lands without review:

- **`main` is protected**: changes only through pull requests, which need passing
  checks (lint, typecheck, unit and integration tests, dependency review). Force
  pushes and branch deletion are blocked. Only the maintainer can merge.
- **Outside pull requests don't run automatically**: GitHub Actions for every
  external contributor wait for the maintainer's approval. Workflows use
  `pull_request` (never `pull_request_target`), get a read-only token and no secrets.
- **Automated scanning**: CodeQL on every pull request, Dependabot security updates,
  the dependency review action (blocks known-vulnerable dependencies), and secret
  scanning with push protection.
- **Pinned third-party actions**: actions outside GitHub's own are pinned to a commit SHA.
- **Releases** are built by CI; npm packages are published with provenance, so anyone
  can check which commit a package was built from.

### Review checklist for outside contributions

Read every changed line. Be extra careful with:

1. `.github/workflows/`: anything that runs in CI, uses secrets or widens permissions.
2. `package.json` scripts (`postinstall`, `prepare`…), new dependencies and big `yarn.lock` changes.
3. Code that runs on users' machines: `custom_components/` (Home Assistant) and
   `integrations/alexa/lambda/`.
4. New network calls, `eval`/`new Function`, obfuscated or minified code, binaries, and
   large generated files that nobody can review.
5. Changes that look unrelated to the pull request's stated purpose.

Don't run an unreviewed pull request's code on your own machine. Let CI run it after
you have read it.

