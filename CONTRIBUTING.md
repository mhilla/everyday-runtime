# Contributing

Thanks for helping! Everyday Runtime is small on purpose; a focused change with a
clear reason is the best kind of contribution. By participating you agree to the
[Code of Conduct](CODE_OF_CONDUCT.md).

## Ways to help

- **Tell us when a suggestion felt wrong.** This is the most valuable feedback
  there is. Open the suggestion's **Why?**, copy the text and file it with the
  [“Suggestion felt wrong”](https://github.com/micha16372/everyday-runtime/issues/new?template=suggestion_feedback.yml)
  template, together with what was actually true. Leave out anything private.
- Fix a bug or improve accessibility.
- Pick an issue labelled
  [`good first issue`](https://github.com/micha16372/everyday-runtime/labels/good%20first%20issue)
  or [`help wanted`](https://github.com/micha16372/everyday-runtime/labels/help%20wanted).
- Work on an item from [ROADMAP.md](ROADMAP.md) — please comment on or open an
  issue first for anything larger than a bug fix, so we agree on the approach
  before you invest time.

## Scope

In scope: the household shopping workflow, the inference engine, the Twenty app
(objects, UI, logic functions), documentation and tests.

Out of scope for now: features that require tracking exact stock, AI services as
a required dependency, and anything that sends household data to third parties.
See [docs/PRODUCT_PRINCIPLES.md](docs/PRODUCT_PRINCIPLES.md).

## Development setup

See [README.md](README.md#quick-start) and [SETUP.md](SETUP.md). In short:

```bash
corepack enable
yarn install
yarn twenty docker:start
yarn twenty apply        # or: yarn twenty dev (watch mode)
```

## Workflow

1. Fork the repository (maintainers: create a branch in the repository).
2. Create a branch from `main` named after the change, for example
   `fix/quick-add-decimal-quantity`, `feat/quantity-aware-intervals`,
   `docs/setup-windows`.
3. Make the change with tests. Keep the pull request focused on one thing.
4. Run the checks locally:

   ```bash
   yarn lint
   yarn typecheck
   yarn test
   yarn test:integration    # needs the local Twenty server; reinstall afterwards with `yarn twenty apply`
   ```

5. Open a pull request against `main` and fill in the template. Link the issue
   (`Closes #123`). For UI changes add before/after screenshots.
6. CI must be green. The maintainer reviews; expect questions and small change
   requests. Pull requests are squash-merged.

## Commits

- Short imperative subject, optionally with a type prefix: `feat:`, `fix:`,
  `docs:`, `test:`, `ci:`, `chore:` (e.g. `fix: keep decimal quantities in quick add`).
- Explain *why* in the body when it is not obvious.
- Use an email address you are happy to publish (GitHub's
  `…@users.noreply.github.com` address works).
- AI-assisted commits are welcome; mark them with a `Co-Authored-By` trailer.

## Guidelines

- **Keep the domain pure.** `src/domain` must not import Twenty, React or anything
  with side effects. Pass `now` explicitly.
- **Engine changes need tests and an explanation.** Every rule must be explainable
  in one sentence to a user and must have a test. Tunable numbers belong in
  `INFERENCE_CONFIG`. Update `docs/ARCHITECTURE.md` when rules change.
- **Never fake precision.** No decimals on percentages, no stock counts, estimates
  always visibly marked.
- **Writes go through `src/data/household-actions.ts`.** The UI does not call the
  repository directly.
- **New Twenty entities** need a valid, never-changing UUID v4 universal identifier
  (`yarn twenty dev:add` generates one). Avoid reserved field names such as `type`.
- **UI**: prefix CSS classes with `er-`, use `@container` for responsive layout,
  large tap targets, real `<button>`s, and pass ARIA states as strings.
- `yarn lint` must pass without warnings.
- Add a line to [CHANGELOG.md](CHANGELOG.md) under “Unreleased” for user-visible
  changes.

## Releases

The maintainer moves “Unreleased” in the changelog to a version, tags `vX.Y.Z` on
`main` and publishes a GitHub release with the same notes.

## License

By contributing you agree that your contributions are licensed under the
[MIT License](LICENSE).
