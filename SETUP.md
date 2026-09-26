# Setup

Follow these steps to get Everyday Runtime running locally.

## Prerequisites

- Node.js (version in `.nvmrc`, currently 24)
- Yarn 4 (`corepack enable` activates the version pinned in `package.json`)
- Docker (for the local Twenty server)
- About 4 GB of free memory for the Twenty container

## Steps

1. Install dependencies:

   ```bash
   yarn install
   ```

   The committed `yarn.lock` pins exact, integrity-checked versions.

2. Start the local Twenty server:

   ```bash
   yarn twenty docker:start
   ```

   Check it at any time with `yarn twenty docker:status`. The first start runs
   database migrations and takes a few minutes.

3. Build, register and install the app:

   ```bash
   yarn twenty apply        # one-off
   # or
   yarn twenty dev          # watch mode: re-syncs on every change
   ```

4. Open [http://localhost:2020](http://localhost:2020), sign in with the development
   credentials `tim@apple.dev` / `tim@apple.dev`, open **Everyday Runtime** in the
   sidebar and press **Load demo household**.

## Verifying your setup

- `yarn lint` — lint with oxlint
- `yarn typecheck` — type-check the project
- `yarn test` — unit tests (no server needed)
- `yarn test:integration` — end-to-end workflow against the local server. It installs
  the app before and uninstalls it after the run; use `yarn twenty apply` afterwards
  to keep working with the app.
- `curl -H "Authorization: Bearer <api key>" http://localhost:2020/s/needs` — the
  JSON needs report.

## Troubleshooting

- **`Failed to create app registration: read ECONNRESET`** right after
  `docker:start`: the Twenty server restarts a few times while warming up. Wait until
  `yarn twenty docker:status` reports it as healthy for a minute, then run
  `yarn twenty apply` again.
- **`This name is reserved`** when adding fields: Twenty reserves some field names
  (for example `type`); pick another name.
- **Starting over:** `yarn twenty docker:reset` deletes all local data; then run
  `yarn twenty docker:start` and `yarn twenty apply` again.
- More help: the [Twenty troubleshooting guide](https://docs.twenty.com/developers/extend/apps/getting-started/troubleshooting)
  and the [Twenty Discord](https://discord.gg/cx5n4Jzs57).
