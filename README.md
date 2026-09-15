[![GitHub Workflow Status (with event)](https://img.shields.io/github/actions/workflow/status/adamant-im/adamant-im/preview.yml)](https://github.com/Adamant-im/adamant-im/actions/workflows/preview.yml) [![GitHub commit activity (branch)](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/Adamant-im/adamant-im/gh-pages/commits.json)](https://github.com/Adamant-im/adamant-im/commits) [![GitHub release (with filter)](https://img.shields.io/github/v/release/adamant-im/adamant-im?color=24bd13)](https://github.com/Adamant-im/adamant-im/releases) [![Static Badge](https://img.shields.io/badge/Slack-brightgreen?logo=slack&logoColor=white&labelColor=fa8f02&color=grey&link=https%3A%2F%2Fjoin.slack.com%2Ft%2Fadamant-im%2Fshared_invite%2Fzt-3n32uqh3-TmTM4qPAKcp3PzrPMtKETQ)](https://join.slack.com/t/adamant-im/shared_invite/zt-3n32uqh3-TmTM4qPAKcp3PzrPMtKETQ) [![Static Badge](https://img.shields.io/badge/Twitter-brightgreen?logo=x&logoColor=white&labelColor=blue&color=grey&link=https%3A%2F%2Ftwitter.com%2Fadamant_im)](https://twitter.com/adamant_im)

# ADAMANT Messenger PWA

ADAMANT Messenger is an open-source decentralized messenger and non-custodial wallet built on the ADAMANT blockchain.
This repository contains the main client for Web, Tor, Android (Capacitor), and Desktop (Electron).

ADAMANT is designed around privacy, censorship resistance, and user custody.
Accounts do not require phone numbers or emails, private keys stay on the user side, and the client can work with distributed nodes instead of a single provider.

> Your ADAMANT passphrase cannot be recovered by developers, support, or infrastructure operators. Store it offline and treat it like a wallet seed phrase.

## Why ADAMANT

- No phone numbers, no emails, no contact-book scraping by default
- End-to-end encrypted messaging using Diffie-Hellman Curve25519, Salsa20, Poly1305, SHA-256, and Ed25519
- Censorship-resistant account model backed by a decentralized blockchain network
- Non-custodial wallets and in-chat crypto transfers with full user-side key control
- Multi-node architecture with failover, self-hostability, and Tor-friendly deployment options

## What This Repository Powers

- Progressive Web App for the public web
- Tor build for users who need stronger network anonymity
- Electron desktop app for macOS, Windows, and Linux
- Capacitor Android app

## Highlights

- Anonymous onboarding without a phone number or email
- Encrypted chats with blockchain-backed message ordering and authenticity
- Built-in wallets for ADM, BTC, ETH, DOGE, DASH, USDT, USDC, and ERC20 tokens
- In-chat transfers, exchanger flows, and Adelina AI chat integration
- IPFS-based file sharing for attachments and media
- Custom node configuration with health checks and failover
- Open-source, community-driven, and self-hostable by design

## Official Links

| Resource        | Link                                                                                                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Website         | [adamant.im](https://adamant.im)                                                                                                                                          |
| Apps            | [adamant.im/#adm-apps](https://adamant.im/#adm-apps)                                                                                                                      |
| Documentation   | [docs.adamant.im](https://docs.adamant.im)                                                                                                                                |
| Whitepaper      | [adamant-whitepaper-en.pdf](https://adamant.im/whitepaper/adamant-whitepaper-en.pdf)                                                                                      |
| Releases        | [GitHub Releases](https://github.com/Adamant-im/adamant-im/releases)                                                                                                      |
| Media pack      | [media_pack.zip](https://adamant.im/img/media_pack.zip)                                                                                                                   |
| Project profile | [About ADAMANT: Description and Details](https://docs.google.com/document/d/e/2PACX-1vR_SndPoXvRvntay9Pn9A_xbI1n940GvSAENiU5SuYcznFT-6a7X0RqH50vCgJR-QmXPLe1s_1DRtl6/pub) |

### Community PWA Deployments

Mainnet app:

- GitHub Pages auto-build: [adamant-im.github.io/adamant-im](https://adamant-im.github.io/adamant-im/) from `master` only due to GitHub Pages limitations
- Vercel auto-build: [msg2.adamant.im](https://msg2.adamant.im) from `master` on Vercel US
- Server-side auto-build: [msg.adamant.im](https://msg.adamant.im) and [adm.im](https://adm.im) from `master`
- Server-side auto-build: [msgtest.adamant.im](https://msgtest.adamant.im) from `dev`
- Server-side Tor auto-build: <http://adamant6457join2rxdkr2y7iqatar7n4n72lordxeknj435i4cjhpyd.onion> from `master`
- Server-side Tor auto-build (`tor-dev`): <http://il2fcw65jrrv4au7mtuvodzfwtc6hje6r4ooz7yoqu2jl422b44iofyd.onion> from `dev`, built outside GitHub Actions with `--mode tor` and the mainnet Tor network configuration
- Vercel auto-build: [dev.adamant.im](https://dev.adamant.im) from the `dev` branch on Vercel US
- Massa DeWeb auto-build: [adm.massahub.network](https://adm.massahub.network) from `master`, hosted on the Massa blockchain
- GitHub Actions auto-build can also be configured by any user for their own `master` deployment

Testnet app:

- GitHub Actions auto-build in Surge: [msg-adamant-testnet.surge.sh](https://msg-adamant-testnet.surge.sh) from `master`, mirrored at <http://msg-testnet.adamant.im> (HTTP-only for the mirror)
- GitHub Actions auto-build in Surge: [dev-adamant-testnet.surge.sh](https://dev-adamant-testnet.surge.sh) from `dev`, mirrored at <http://dev-testnet.adamant.im> (HTTP-only for the mirror)

## Quick Start

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

| Variant       | Override  | Network                                                              |
| ------------- | --------- | -------------------------------------------------------------------- |
| `development` | None      | Mainnet                                                              |
| `production`  | None      | Mainnet                                                              |
| `testnet`     | `testnet` | ADM testnet nodes, IPFS nodes, and explorer; other coins use mainnet |
| `tor`         | `tor`     | Mainnet through onion node and service endpoints                     |

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
| PWA               | `npm run dev`                                                                        | `development` | `development.json`    |
| PWA               | `npm run build`, `npm run serve`                                                     | `production`  | `production.json`     |
| PWA testnet       | `npm run dev:testnet`, `npm run build:testnet`, `npm run serve:testnet`              | `testnet`     | `testnet.json`        |
| PWA Tor           | `npm run dev:tor`, `npm run build:tor`                                               | `tor`         | `tor.json`            |
| Electron          | `npm run electron:dev`                                                               | `development` | `development.json`    |
| Electron          | `npm run electron:build:prepare`, `npm run electron:build`, `npm run electron:serve` | `production`  | `production.json`     |
| Capacitor Android | `npm run android:prebuild`, `npm run android:build`                                  | `production`  | `production.json`     |
| Unit tests        | `npm run test`                                                                       | `test`        | `development.json`    |

Electron and Capacitor Android support only the `development` and `production` modes and have no
separate testnet or Tor target. The `tor-testnet` mode is intentionally unsupported for every target
because the `tor` override describes mainnet endpoints and must not be combined with `testnet`.
`tor-dev` is not a mode either: it is a deployment of the `dev` branch built with `--mode tor`.

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
| GitHub Pages and Massa DeWeb                      | `master`        | `production` | `production.json`     |
| Pull request previews on Surge                    | Pull requests   | `production` | `production.json`     |
| Vercel and server-side web deployments            | `master`, `dev` | `production` | `production.json`     |
| Surge testnet and its HTTP mirrors                | `master`, `dev` | `testnet`    | `testnet.json`        |
| Server-side Tor deployment                        | `master`        | `tor`        | `tor.json`            |
| Server-side `tor-dev` deployment                  | `dev`           | `tor`        | `tor.json`            |
| Electron and Capacitor Android workflow artifacts | `master`, `dev` | `production` | `production.json`     |

GitHub Actions workflows that build these targets, as well as the Quality workflow for pull requests
and pushes to `dev` and `master`, check out the pinned submodule and run `npm run wallets:data:check`
before building. Deployment automation outside GitHub Actions, including the `tor-dev` server
auto-build, must run the same check. For the Tor deployments:

```bash
git submodule update --init adamant-wallets
npm ci
npm run wallets:data:check
npm run build:tor
```

Mode validation and the bundle gate run inside every Vite build, so they also protect builds that do
not have the submodule checked out.

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

## Self-hosted

If you are unable to access [adm.im](https://adm.im) (e.g., due to censorship), you can run a self-hosted instance of ADAMANT Messenger to:

- Increase reliability and decentralization of the ADAMANT Messenger ecosystem
- Help other users access the messenger in countries with strong Internet limitations

We always encourage people to build it from source.

As an option, you can build and deploy the app to GitHub Pages.

Follow the instructions below.

### Enable GH Actions

1. Fork the repository
2. Go to the repository **Settings**
3. Navigate to the **Pages** tab
4. Set the source as **GitHub Actions**

### Run GH Workflow

1. Go to the **Actions** tab
2. Enable workflows
3. Select the **GitHub Pages** workflow
4. Click **Run workflow**
5. Wait until the build succeeds
6. Open ADAMANT Messenger at `username.github.io/adamant-im`

You can as well point your GitHub Pages subdomain to a [custom domain](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).

## Security and Privacy Notes

- Private keys are derived and stored client-side
- Do not log or share passphrases, mnemonic material, or exported private keys
- Treat the browser runtime as potentially hostile and prefer trusted devices
- For stronger network anonymity, use the Tor build or a self-hosted instance

## Contributing

Issues and pull requests are welcome.
When contributing, prioritize security, privacy, decentralization, and compatibility with the existing ADAMANT protocol and user data.

Before opening a substantial PR, it is helpful to run:

```bash
npm run lint
npm run typecheck
npm run test -- --run
npm run build
```
