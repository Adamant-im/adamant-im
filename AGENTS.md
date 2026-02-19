# ADAMANT Messenger PWA: AI Agent Operating Manual

This document defines how AI agents must work in this repository.

## Mission

ADAMANT Messenger PWA is the main client for Web, Tor, Android (Capacitor), and Desktop (Electron).

Agent output must optimize for:

1. Security and cryptographic correctness
2. Anonymity and user metadata minimization
3. Decentralization and self-hostability
4. Censorship resistance and runtime reliability
5. User experience with minimal friction
6. Open-source maintainability and contributor clarity

If tradeoffs are required, preserve security and privacy first.

## Language Policy

- Developers may communicate with AI in any language
- All repository artifacts must be in English only
- Write all code, comments, docs, commit messages, and PR text in English

## Product Context and Values

ADAMANT is a decentralized, anonymous, community-driven messenger and wallet ecosystem.

This repository is a client application, so agent decisions must:

- Keep account custody fully on user side
- Keep user tracking and data collection at zero by default
- Keep node and service choices distributed and user-configurable
- Keep the app functional under node outages, censorship pressure, and partial network failures

## Sources of Truth

Use these sources when implementing or reviewing changes:

- This repository: `README.md`, current code, and passing tests
- ADAMANT Node guidelines baseline: https://github.com/Adamant-im/adamant/blob/dev/AGENTS.md
- ADAMANT docs: https://docs.adamant.im
- Node/API schema: https://schema.adamant.im and https://github.com/Adamant-im/adamant-schema
- AIPs: https://aips.adamant.im and https://github.com/Adamant-im/AIPs
- Wallet OpenAPI source used here: `adamant-wallets/specification/openapi.json`

If sources disagree:

1. Treat current repository behavior and passing tests as implementation truth
2. Do not silently ignore mismatches; document them and propose synchronized fixes

## System Map (What You Are Editing)

- App bootstrap: `src/main.ts`, `src/App.vue`
- Routing and layouts: `src/router/index.js`, `src/layouts/*`, `src/views/*`
- State management: `src/store/index.js`, `src/store/modules/*`, `src/stores/*`
- ADAMANT transaction/crypto logic: `src/lib/adamant.js`, `src/lib/adamant-api/index.js`, `src/lib/txVerify.js`
- Node/service abstraction and health checks: `src/lib/nodes/*`
- Attachment and IPFS flows: `src/lib/files/*`, `src/lib/attachment-api/index.ts`
- Encrypted local persistence (IDB): `src/lib/idb/*`, `src/store/plugins/indexedDb.js`
- Build and runtime modes: `vite-pwa.config.ts`, `src/config/*.json`
- Electron: `electron-vite.config.ts`, `src/electron/main.js`
- Android (Capacitor): `capacitor.config.ts`, `scripts/capacitor/*`, `android/*`

## Non-Negotiable Security Rules

- Never weaken cryptographic primitives, key derivation, signature validation, or message encryption
- Never log passphrases, private keys, mnemonic seeds, decrypted payloads, or sensitive tokens
- Never add dynamic code execution (`eval`, `new Function`, remote script injection)
- Keep all untrusted HTML sanitized; use existing sanitization patterns (`src/lib/markdown.ts`)
- Do not introduce insecure fallbacks for transport or authentication flows
- Minimize dependencies, especially cryptography/networking dependencies; prefer proven libraries already used in repo
- Treat browser runtime as hostile: assume malicious extensions can read DOM and injected scripts can attempt exfiltration

## Privacy and Anonymity Rules

- Do not introduce analytics, telemetry, fingerprinting, or hidden third-party trackers
- Do not collect phone numbers, emails, contact lists, geolocation, or device identifiers unless explicitly required and clearly user-initiated
- Keep persisted data minimal and justified
- Keep sensitive local state encrypted where existing flows already enforce it

## Decentralization and Censorship-Resistance Rules

- Do not hardcode single points of failure for nodes or service endpoints
- Preserve and improve node failover and health-check behavior in `src/lib/nodes/*`
- Keep self-hosting and custom endpoint configuration working
- Ensure Tor/testnet/mainnet modes remain functional and isolated by config

## Reliability Rules

- Fail safely: no crashes on malformed data, node timeouts, or partial API failures
- Prefer graceful degradation and clear user-facing errors over silent failure
- Keep retry/backoff and offline behaviors predictable
- Changes in networking, transactions, or storage must include regression tests

## UX Rules for Security-Critical Flows

- Keep onboarding fast, but do not hide irreversible risk
- Preserve clear passphrase responsibility warnings; never imply recoverability when none exists
- Keep transaction confirmations explicit and informative
- Avoid introducing friction that does not improve security or safety

## Protocol and Compatibility Rules

- Keep transaction bytes, signing behavior, and verification compatible with ADAMANT network expectations unless a coordinated protocol update is planned
- For protocol-impacting changes, align with AIPs and update related docs/spec references
- For schema-driven client changes, regenerate and validate artifacts:
  - `npm run schema:generate`
  - `npm run wallets:types:generate` (when wallet spec changes)

## Testing and Validation Policy

For any non-trivial change, report exactly what was run.

### Baseline validation

- `npm run lint`
- `npm run typecheck`
- `npm run test -- --run`

### Build validation

- Web PWA: `npm run build`
- Testnet mode changes: `npm run build:testnet`
- Tor mode changes: `npm run build:tor`
- Electron-related changes: `npm run electron:build` (or `npm run electron:dev` for local verification)
- Android/Capacitor changes: at least `npm run android:prebuild`

## Change Discipline

- Prefer focused patches with explicit rationale
- Preserve backward compatibility for user data and persisted state where possible
- When touching legacy code, improve locally without broad unrelated rewrites
- Add or update tests near the changed behavior

## Documentation Drift Policy

When behavior and docs diverge:

1. Document exact mismatch with file/path references
2. Propose synchronized updates in this repo and companion ADAMANT docs/spec repos when required
3. If cross-repo changes cannot be included immediately, open linked follow-up issues

## Done Criteria for Agents

A change is not complete until all conditions hold:

1. Security/privacy/decentralization priorities remain intact or improved
2. Relevant tests and validation commands were run (or explicit blocker is reported)
3. Documentation/config updates are included for behavioral changes
4. No sensitive data exposure was introduced
