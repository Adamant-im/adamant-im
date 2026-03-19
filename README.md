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
| Web app         | [msg.adamant.im](https://msg.adamant.im)                                                                                                                                  |
| Documentation   | [docs.adamant.im](https://docs.adamant.im)                                                                                                                                |
| Whitepaper      | [adamant-whitepaper-en.pdf](https://adamant.im/whitepaper/adamant-whitepaper-en.pdf)                                                                                      |
| Releases        | [GitHub Releases](https://github.com/Adamant-im/adamant-im/releases)                                                                                                      |
| Media pack      | [media_pack.zip](https://adamant.im/img/media_pack.zip)                                                                                                                   |
| Project profile | [About ADAMANT: Description and Details](https://docs.google.com/document/d/e/2PACX-1vR_SndPoXvRvntay9Pn9A_xbI1n940GvSAENiU5SuYcznFT-6a7X0RqH50vCgJR-QmXPLe1s_1DRtl6/pub) |

## Quick Start

Recommended environment:

- Node.js `^20.19.0 || >=22.12.0`
- npm `>=10`

Clone and run the app locally:

```bash
git clone --recursive https://github.com/Adamant-im/adamant-im.git
cd adamant-im
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

## Playwright Smoke Checks

Install Chromium for local e2e runs:

```bash
npm run test:e2e:install
```

Run the smoke suite:

```bash
npm run test:e2e
```

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

Build Electron packages:

```bash
npm run electron:build
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

## Self-Hosting

If public ADAMANT endpoints are blocked or unreliable in your region, you can run your own ADAMANT Messenger instance.
That improves resilience for you and helps preserve decentralization for the wider network.

Typical self-hosting flow:

1. Fork this repository
2. Adjust environment-specific configuration if needed
3. Build the app with `npm run build`, `npm run build:testnet`, or `npm run build:tor`
4. Deploy the generated static assets to your preferred hosting provider or mirror

GitHub Pages is a simple option for mirror hosting.
In your fork, enable Pages with GitHub Actions and run the Pages workflow to publish a static build.

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
