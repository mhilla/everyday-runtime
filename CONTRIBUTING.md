# Contributing

Thanks for helping! Everyday Runtime is small on purpose; a focused change with a
clear reason is the best kind of contribution.

## Ways to help

- **Tell us when a suggestion felt wrong.** Use the “Suggestion felt wrong” issue
  template and paste the “Why?” text. This is the most valuable feedback there is.
- Fix a bug or improve accessibility.
- Pick an item from [ROADMAP.md](ROADMAP.md) — please open an issue first for
  anything larger than a bug fix, so we can agree on the approach.

## Development setup

See [README.md](README.md#quick-start) and [SETUP.md](SETUP.md). In short:

```bash
corepack enable
yarn install
yarn twenty docker:start
yarn twenty apply        # or: yarn twenty dev (watch mode)
```

## Before you open a pull request

```bash
yarn lint
yarn typecheck
yarn test
yarn test:integration    # needs the local Twenty server
```

CI runs the same commands.

## Guidelines

- **Keep the domain pure.** `src/domain` must not import Twenty, React or anything
  with side effects. Pass `now` explicitly.
- **Engine changes need tests and an explanation.** Every rule must be explainable
  in one sentence to a user and must have a test. Tunable numbers belong in
  `INFERENCE_CONFIG`. Update `docs/ARCHITECTURE.md` when rules change.
- **Never fake precision.** No decimals on percentages, no stock counts, estimates
  always visibly marked. See [docs/PRODUCT_PRINCIPLES.md](docs/PRODUCT_PRINCIPLES.md).
- **Writes go through `src/data/household-actions.ts`.** The UI does not call the
  repository directly.
- **New Twenty entities** need a valid, never-changing UUID v4 universal identifier
  (`yarn twenty dev:add` generates one). Avoid reserved field names such as `type`.
- **UI**: prefix CSS classes with `er-`, use `@container` for responsive layout,
  large tap targets, real `<button>`s, and pass ARIA states as strings.
- Match the existing code style; `yarn lint` must pass without warnings.
- Small commits with meaningful messages (`feat:`, `fix:`, `docs:`, `test:`,
  `chore:` prefixes are welcome).
- Add a line to [CHANGELOG.md](CHANGELOG.md) under “Unreleased” for user-visible
  changes.

## Code of conduct

Be kind and constructive. Assume good intent, critique ideas rather than people,
and help newcomers. Maintainers may remove comments or contributions that do not
follow this.

## License

By contributing you agree that your contributions are licensed under the
[MIT License](LICENSE).
