# Contributing to ADAMANT Messenger PWA

Issues and pull requests are welcome.
When contributing, prioritize security, privacy, decentralization, and compatibility with the existing ADAMANT protocol and user data.

Organization-wide issue forms, labels, and pull request conventions are maintained in [Adamant-im/.github](https://github.com/Adamant-im/.github).
AI agents working in this repository follow [AGENTS.md](AGENTS.md).

## Development Setup

Recommended environment:

- Node.js `>=24.15.0`
- npm `>=12`

Clone and run the app locally:

```bash
git clone --recursive https://github.com/Adamant-im/adamant-im.git
cd adamant-im
corepack enable npm
npm install
npm run dev
```

Start a local HTTPS dev server with hot reload:

```bash
npm run dev-https
```

`npm run https` is kept as a shortcut for the same flow.

## Common Commands

| Task                                    | Command                    |
| --------------------------------------- | -------------------------- |
| Start local development                 | `npm run dev`              |
| Start local HTTPS development           | `npm run dev-https`        |
| Start localnet development on `0.0.0.0` | `npm run dev:localnet`     |
| Start testnet development               | `npm run dev:testnet`      |
| Start Tor-mode development              | `npm run dev:tor`          |
| Build production PWA                    | `npm run build`            |
| Build testnet PWA                       | `npm run build:testnet`    |
| Build Tor PWA                           | `npm run build:tor`        |
| Preview production build                | `npm run serve`            |
| Preview testnet build                   | `npm run serve:testnet`    |
| Build Electron app                      | `npm run electron:build`   |
| Run Electron in development             | `npm run electron:dev`     |
| Preview Electron production build       | `npm run electron:serve`   |
| Prepare Android build assets            | `npm run android:prebuild` |
| Open Android Studio project             | `npm run android:open`     |
| Run Android app on device/emulator      | `npm run android:run`      |

## Validation

Baseline validation for non-trivial changes:

```bash
npm run lint
npm run typecheck
npm run test -- --run
```

Useful additional checks:

```bash
npm run build
npm run test:e2e
```

When changes affect schema-driven artifacts:

```bash
npm run schema:generate
npm run wallets:types:generate
```

When changes affect wallet metadata, the wallet generator, or generated network configuration:

```bash
npm run wallets:data:check
npm run build:testnet
npm run build:tor
```

## Wallet Metadata and Network Configuration

### Wallet metadata synchronization

`npm run wallets:data:generate` explicitly refreshes the committed wallet metadata and generated
assets from one `adamant-wallets` branch. It selects the source from the current PWA branch:

| Current PWA branch                     | `adamant-wallets` source |
| -------------------------------------- | ------------------------ |
| `master`                               | `master`                 |
| `dev`                                  | `dev`                    |
| Any topic branch, including `hotfix/*` | `dev`                    |
| Detached HEAD                          | `dev`                    |

Pass `dev` or `master` after `--` to override the automatic selection for a maintenance workflow:

```bash
npm run wallets:data:generate -- master
```

Use this explicit `master` override when a production hotfix branch must consume production wallet
metadata. The override applies only to `wallets:data:generate`; `wallets:generate` is a command chain
and does not forward trailing arguments to its data step

Other explicit source branches are rejected before the submodule is updated. Each generator run
uses one branch for all shared wallet data, icons, and network configs

Regular `npm run dev` and `npm run build` commands do not update `adamant-wallets`; they use the
generated JSON and assets already committed to this repository. `npm run dev` starts only the local
Vite server on `localhost:8080` and does not trigger the remote `pwa-dev` deployment

### Generated wallet files and the pinned revision

The `adamant-wallets` submodule revision recorded in a PWA commit is the pinned metadata revision of
that commit. Running `wallets:data:generate` on `master` pins a revision of `adamant-wallets/master`;
on `dev`, topic branches, and detached HEAD it pins a revision of `adamant-wallets/dev`. Every build
uses the files generated from the revision pinned in the commit being built.

The generator writes these files:

- `src/lib/constants/cryptos/data.json` is the complete coin metadata snapshot, including the base,
  `testnet`, and `tor` sections. Coin properties and the developer wallet metadata screen read it,
  while node and service clients never take endpoints from it.
- `src/components/icons/cryptos/*.vue` contains the coin icons
- `src/config/<variant>.json` contains the runtime network configuration of every coin with
  `createCoin: true`: `explorer`, `explorerTx`, `explorerAddress`, `nodes`, and `services`

Each network configuration variant starts from a fresh copy of the base metadata and applies the
complete selected override. Nested objects are merged, while arrays such as endpoint lists replace
the base array as a whole. Resolving one variant never changes the input of another variant.

| Variant   | Override  | Network                                                              |
| --------- | --------- | -------------------------------------------------------------------- |
| `mainnet` | None      | Mainnet                                                              |
| `testnet` | `testnet` | ADM testnet nodes, IPFS nodes, and explorer; other coins use mainnet |
| `tor`     | `tor`     | Mainnet through onion node and service endpoints                     |

Variants are named after networks rather than Vite modes. Branches differ only in the pinned
metadata revision: `mainnet.json` on `dev` comes from `adamant-wallets/dev`, and on `master` it
comes from `adamant-wallets/master`.

`npm run wallets:data:check` rebuilds every generated file in memory from the pinned revision and
fails when a committed file is changed, missing, or unexpected. It does not fetch, write files, or
move the submodule, so the submodule must be checked out at the pinned revision without local
metadata changes:

```bash
git submodule update --init adamant-wallets
npm run wallets:data:check
```

When the check fails without an intended metadata update, for example after a generator change,
regenerate the files from the pinned revision instead of syncing a branch:

```bash
npm run wallets:data:generate -- --pinned
```

### Build modes and network isolation

Each build bundles exactly one network configuration. The Vite mode selects it in
`vite-config/plugins/networkConfigPlugin.ts`, and an unsupported mode fails while the build
configuration is resolved, before anything is bundled.

| Target            | Commands                                                                             | Vite mode     | Network configuration |
| ----------------- | ------------------------------------------------------------------------------------ | ------------- | --------------------- |
| PWA               | `npm run dev`                                                                        | `development` | `mainnet.json`        |
| PWA               | `npm run build`, `npm run serve`                                                     | `production`  | `mainnet.json`        |
| PWA testnet       | `npm run dev:testnet`, `npm run build:testnet`, `npm run serve:testnet`              | `testnet`     | `testnet.json`        |
| PWA Tor           | `npm run dev:tor`, `npm run build:tor`                                               | `tor`         | `tor.json`            |
| Electron          | `npm run electron:dev`                                                               | `development` | `mainnet.json`        |
| Electron          | `npm run electron:build:prepare`, `npm run electron:build`, `npm run electron:serve` | `production`  | `mainnet.json`        |
| Capacitor Android | `npm run android:prebuild`, `npm run android:build`                                  | `production`  | `mainnet.json`        |
| Unit tests        | `npm run test`                                                                       | `test`        | `mainnet.json`        |

The `development` and `production` modes change build behavior, such as minification and developer
tooling, but bundle the same `mainnet.json`.

Electron and Capacitor Android support only the `development` and `production` modes and have no
separate testnet or Tor target. The `tor-testnet` mode is intentionally unsupported for every target
because the `tor` override describes mainnet endpoints and must not be combined with `testnet`.

A build also fails before bundling when `src/config` contains a JSON file that the generator does
not create, such as a restored `production.json`. Deployment scripts must select the network with
the Vite mode instead of replacing configuration files.

Every `vite build` also inspects the emitted bundle and fails when:

- The bundle includes a generated network configuration other than the selected one
- A Tor node or service endpoint, including an alternative IP endpoint, is not an onion address
- A mainnet or testnet node or service endpoint is an onion address
- Mainnet and testnet share an ADM node, IPFS node, or ADM explorer origin
- A node, service, or explorer URL is not a valid HTTP(S) URL

Explorer links are user navigation targets rather than network endpoints, so the Tor configuration
keeps the clearnet BTC, DASH, DOGE, and ETH explorer links inherited from the base metadata. Because
`data.json` carries the complete metadata snapshot, a plain text search of any bundle also finds
endpoints of other networks; the build gate inspects the bundled runtime network configuration.

### Deployment build paths

| Deployment                                        | Branches        | Vite mode    | Network configuration |
| ------------------------------------------------- | --------------- | ------------ | --------------------- |
| GitHub Pages and Massa DeWeb                      | `master`        | `production` | `mainnet.json`        |
| Pull request previews on Surge                    | Pull requests   | `production` | `mainnet.json`        |
| Vercel and server-side web deployments            | `master`, `dev` | `production` | `mainnet.json`        |
| Surge testnet and its HTTP mirrors                | `master`, `dev` | `testnet`    | `testnet.json`        |
| Server-side Tor build of `master`                 | `master`        | `tor`        | `tor.json`            |
| Server-side Tor build of `dev` (`tor-dev`)        | `dev`           | `tor`        | `tor.json`            |
| Electron and Capacitor Android workflow artifacts | `master`, `dev` | `production` | `mainnet.json`        |

The Quality workflow runs `npm run wallets:data:check` for pull requests and pushes to `dev` and
`master`. GitHub Actions workflows that deploy or package the app run it again before building, so
they cannot publish a commit whose generated files drift from the pinned metadata.

Drift depends only on the commit, so deployments outside GitHub Actions, such as Vercel and the
server-side builds, do not repeat the check and do not need the submodule. Mode validation and the
bundle gate still run inside their Vite builds. Server-side Tor builds use `npm run build:tor`, or
`vite build` with `--mode tor`.

### CSP hardening on Vercel builds

Production builds inject a CSP meta policy that blocks JavaScript `eval` and `Function` constructors
on every static hosting target. Vercel also delivers the same script policy as a response header.
`wasm-unsafe-eval` remains narrowly enabled for the bundled secp256k1 WebAssembly module.

The policy intentionally allows HTTP(S) and WebSocket connections, images, and media from arbitrary
origins so user-configured and self-hosted nodes keep working. This is broader than a fixed ADAMANT
domain allowlist, while script execution is substantially narrower. Static meta policies cannot
enforce `frame-ancestors`. Deployments with response-header support must deny framing there; the
Vercel and Electron targets enforce `frame-ancestors 'none'` and `X-Frame-Options: DENY`.

The build fails if a generated JavaScript chunk contains a direct `eval` or a `Function`
constructor. This gate scans reachable emitted chunks and direct lexical calls; runtime CSP remains
the enforcement boundary for indirect forms. Keep runtime dependencies compatible with this gate
instead of adding `unsafe-eval`.

## Playwright Smoke Checks

Install Chromium for local e2e runs:

```bash
npm run test:e2e:install
```

Run the smoke suite:

```bash
npm run test:e2e
```

Tests explicitly marked with the `@long-running` tag are skipped by default. Use
`longRunningTestTitle()` to mark tests whose observed runtime exceeds the configured threshold,
then include them explicitly:

```bash
npm run test:e2e -- --perform-long-running
```

Change the threshold in
`tests/e2e/helpers/longRunning.ts` (`LONG_RUNNING_TEST_THRESHOLD_MS = 40_000`) and reassess the
tagged tests when updating it.

Run with extended artifacts:

```bash
npm run test:e2e:detailed
```

Open the latest HTML report:

```bash
npm run test:e2e:report
```

## Desktop and Android Notes

Run Electron locally:

```bash
npm run electron:dev
```

Force legacy Chrome extension-based Vue DevTools inside Electron:

```bash
ELECTRON_USE_CHROME_DEVTOOLS_EXTENSION=true npm run electron:dev
```

Keep DevTools open while suppressing noisy Chromium logs in terminal:

```bash
npm run electron:dev
```

Disable log suppression and show full Chromium/Electron internals:

```bash
ELECTRON_SUPPRESS_CHROMIUM_LOGS=false npm run electron:dev
```

Build Electron packages:

```bash
npm run electron:build
```

Build a macOS arm64 app and notarize it:

```bash
npm run electron:build:mac:arm64:notarize
```

Preview the Electron production build:

```bash
npm run electron:serve
```

### macOS signing and notarization (local/CI)

For distributable macOS builds, use a valid `Developer ID Application` certificate and notarization.

The notarization hook (`scripts/electron/notarize.cjs`) supports 3 auth strategies:

1. Apple ID + app-specific password
2. Keychain profile (`xcrun notarytool store-credentials`)
3. App Store Connect API key

Supported environment variables:

```bash
# Common
APPLE_NOTARIZE=true

# Strategy 1 (Apple ID)
APPLE_ID=...
APPLE_APP_SPECIFIC_PASSWORD=...
APPLE_TEAM_ID=...

# Strategy 2 (Keychain profile)
APPLE_KEYCHAIN_PROFILE=...
# optional
APPLE_KEYCHAIN=...

# Strategy 3 (App Store Connect API key)
APPLE_API_KEY=/absolute/path/to/AuthKey_XXXXXXXXXX.p8
APPLE_API_KEY_ID=XXXXXXXXXX
# optional for team keys
APPLE_API_ISSUER=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

Local builds can store these variables in `electron-builder.env.local` or `electron-builder.env` and the hook will load them automatically.
For Apple ID strategy, `APPLE_APP_PASSWORD` is also accepted as an alias for `APPLE_APP_SPECIFIC_PASSWORD`.

Code-signing for `electron-builder`:

```bash
# local identity in Keychain
CSC_NAME="Developer ID Application: <Company> (<TEAM_ID>)"

# or CI/base64 P12
CSC_LINK=...
CSC_KEY_PASSWORD=...
```

Prepare and open Android project:

```bash
npm run android:prebuild
npm run android:open
```

Build and sign Android app:

```bash
cp capacitor.env.example capacitor.env
npm run android:build
```
