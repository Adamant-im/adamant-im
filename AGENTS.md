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

## Writing Style

- In bullet and numbered lists, do not add a trailing period when an item contains one sentence
- If an item contains two or more sentences, end every sentence with a period

## Markdown Lint Rules for AI-Generated Docs

- For every Markdown list, keep one blank line before the list and one blank line after the list
- Always keep a blank line between a heading and the list that follows it to satisfy MD032 (`blanks-around-lists`)
- Use fenced code blocks with matching opening and closing fences and include a language tag when applicable
- Follow other best practice markdown rules

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
- About ADAMANT: Description and Details: <https://docs.google.com/document/d/e/2PACX-1vR_SndPoXvRvntay9Pn9A_xbI1n940GvSAENiU5SuYcznFT-6a7X0RqH50vCgJR-QmXPLe1s_1DRtl6/pub>
- ADAMANT Node guidelines baseline: <https://github.com/Adamant-im/adamant/blob/dev/AGENTS.md>
- Org-wide issue/label governance: <https://github.com/Adamant-im/.github>
- Recommended issue title prefixes: <https://github.com/orgs/Adamant-im/discussions/5>
- Recommended labels for issues/discussions: <https://github.com/orgs/Adamant-im/discussions/1>
- ADAMANT docs: <https://docs.adamant.im>
- Node/API schema: <https://schema.adamant.im> and <https://github.com/Adamant-im/adamant-schema>
- AIPs: <https://aips.adamant.im> and <https://github.com/Adamant-im/AIPs>
- Wallet OpenAPI source used here: `adamant-wallets/specification/openapi.json`

If sources disagree:

1. Treat current repository behavior and passing tests as implementation truth
2. Do not silently ignore mismatches; document them and propose synchronized fixes

## Issue, Label, and PR Conventions

Follow the organization-wide conventions:

- Governance repository: <https://github.com/Adamant-im/.github>
- Prefix guidance: <https://github.com/orgs/Adamant-im/discussions/5>
- Label guidance: <https://github.com/orgs/Adamant-im/discussions/1>

### Issue workflow

1. Search existing issues first to avoid duplicates
2. Use org issue forms (Bug / Feature request / Task) from org defaults
3. Use a concise prefixed title
4. Apply labels from org label catalog (`labels.json`)
5. Link related issues and PRs explicitly

### Title prefixes

Use one or two prefixes maximum.

Common prefixes:

- `[Bug]` bugs, crashes, unexpected behavior
- `[Feat]` new functionality
- `[Enhancement]` improvements of existing features
- `[Refactor]` refactoring without intended behavior changes
- `[Docs]` documentation updates
- `[Test]` test additions or improvements
- `[Chore]` routine maintenance (dependencies, CI/CD, tooling)

Project-specific prefixes:

- `[Task]` general task (including non-coding tasks)
- `[Composite]` multi-part task with sub-tasks
- `[UX/UI]` interface and user experience changes

Idea-level prefixes (usually better in Discussions than Issues):

- `[Proposal]`, `[Idea]`, `[Discussion]`

### Label policy

- `labels.json` in `Adamant-im/.github` is the source of truth for label names, casing, descriptions, and colors
- Keep label casing aligned with org rules:
  - default GitHub labels are lowercase (`bug`, `enhancement`, `documentation`, etc.)
  - custom labels are Capitalized (`Security`, `Privacy`, `UX/UI`, `Task`, `Composite task`, etc.)
- For most issues, apply a small but informative set:
  - one type/status label (`bug`, `enhancement`, `Task`, `Composite task`)
  - one or more domain labels (`Web`, `Vue`, `TypeScript`, `Messaging`, `Security`, `Privacy`, `IPFS`, `Nodes`, `Electron`, `Capacitor`, etc.)
  - optional priority label (`High priority`) when needed
- Do not use legacy status labels for workflow tracking (`s/ ...`); project/Kanban state is managed in GitHub Projects

### PR conventions

- Use org PR template sections (`Description`, `Related issue`, `How to test`, `Checklist`, etc.)
- Reference issues with closing keywords where appropriate (`Closes #<id>`)
- Use Conventional Commits style for PR titles: `Type: Short summary` (for example: `Docs: Update AGENTS.md`)
- Do not use issue-style square-bracket prefixes in PR titles (`[Docs]`, `[Bug]`, etc. are for Issues)
- Keep PR title type aligned with issue intent (`Docs:`, `Fix:`, `Feat:`, `Refactor:`, `Test:`, `Chore:`)
- Follow <https://www.conventionalcommits.org>
- Include testing/verification steps and mention risk areas (security, privacy, protocol, storage)

## Architecture and Key Modules

High-level architecture:

1. UI layer built with Vue 3 and Vuetify renders views/components and triggers actions
2. State layer is primarily Vuex (`src/store/*`) with additional Pinia and Vue Query usage
3. Domain layer in `src/lib/*` handles cryptography, transactions, files, nodes, and persistence
4. Network layer in `src/lib/nodes/*` provides multi-node clients with health checks and failover
5. Platform layer builds the same app for Web/Tor, Electron, and Capacitor Android

Runtime flow and ownership:

- Bootstrap and plugin wiring: `src/main.ts`
- App shell, connection hooks, notifications: `src/App.vue`
- Route tree and auth middleware: `src/router/index.js`, `src/middlewares/*`
- Main auth/account lifecycle: `src/store/index.js`, `src/lib/adamant-api/index.js`
- i18n boot and pluralization rules: `src/i18n.js`, `src/locales/*`

Messaging and transaction pipeline:

- Core ADAMANT crypto and transaction bytes/signatures: `src/lib/adamant.js`
- API-level account unlock, signing, send/decode chat: `src/lib/adamant-api/index.js`
- Chat domain state and polling/retry behavior: `src/store/modules/chat/index.js`
- Socket-based realtime updates: `src/lib/sockets.js`, `src/store/plugins/socketsPlugin.js`
- Pending tx safety gates for nonce/confirmation handling: `src/lib/pending-transactions/*`

Node and service architecture:

- Abstract node/client contracts and node selection strategy: `src/lib/nodes/abstract.node.ts`, `src/lib/nodes/abstract.client.ts`
- Concrete node clients for ADM/BTC/DASH/DOGE/ETH/IPFS: `src/lib/nodes/*`
- Out-of-sync filtering and active/fastest node selection: `src/lib/nodes/utils/*`, `src/lib/nodes/storage.ts`
- Vuex integration for node status and user toggles: `src/store/modules/nodes/*`
- Global healthcheck interval management: `src/lib/nodes/nodes-manager.ts`

Persistence and local security:

- IndexedDB encryption and restore flows: `src/lib/idb/crypto.js`, `src/lib/idb/state.js`, `src/store/plugins/indexedDb.js`
- Session/local persistence plugins: `src/store/plugins/sessionStorage.js`, `src/store/plugins/localStorage.js`
- Sensitive state handling (passphrase/password/public keys) centralized in root Vuex store: `src/store/index.js`

Attachments and IPFS:

- Attachment encode/decode API: `src/lib/attachment-api/index.ts`
- File validation/format/crop/upload helpers: `src/lib/files/*`
- CID utilities and IPFS upload path: `src/lib/files/ipfs.ts`, `src/lib/files/upload.ts`, `src/lib/nodes/ipfs/*`

Build and platform targets:

- Base Vite config and browser polyfills: `vite-base.config.ts`
- PWA web/tor builds: `vite-pwa.config.ts`, `src/config/production.json`, `src/config/tor.json`
- Testnet build mode: `src/config/testnet.json`
- Electron packaging: `electron-vite.config.ts`, `src/electron/main.js`
- Android pipeline: `vite-android.config.ts`, `capacitor.config.ts`, `scripts/capacitor/build-android.mjs`

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

## UI Implementation Rules

- Prefer semantic component classes over template utility classes for new UI work
- Do not add new template-level typography helpers such as `a-text-*` in Vue templates; apply the corresponding mixins inside component styles instead
- Prefer shared tokens and mixins from `src/assets/styles/generic/_tokens.scss` and shared component styles before introducing local raw spacing, sizes, colors, or motion values
- Reuse existing dialog, menu, navigation, and feedback patterns before creating one-off variants
- Keep visual behavior stable across light and dark themes by changing component variables or tokens, not duplicating unrelated selectors
- Avoid widening selector scope with `!important` unless the framework layer makes it strictly necessary and there is no safer selector-based alternative
- Do not modify SVG assets for routine UI cleanup unless the task explicitly requires SVG-level changes

## UI Validation Rules

- For UI-affecting changes, prefer updating or adding contract tests in `src/views/__tests__/*UiContract.spec.js`
- Prefer targeted Playwright layout checks for high-value surfaces instead of broad pixel-perfect snapshots
- Keep Playwright assertions resilient: assert stable geometry, visibility, spacing, and route behavior rather than brittle incidental DOM details
- For transaction list routes such as `/transactions/ADM` or `/transactions/DOGE`, open them through `Home -> Balance` for the target wallet instead of direct navigation, because direct route loads can redirect to `/home`
- When a browser check is flaky, rerun the isolated scenario before treating it as a product regression and document the flake separately if the isolated rerun passes

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

### Playwright route notes

- For transaction list screens like `/transactions/ADM` and `/transactions/DOGE`, do not navigate by direct URL in e2e tests
- Open transaction lists through the user flow `Home -> Balance` for the target wallet, because direct `/transactions/:crypto` navigation may redirect to `/home`
- Direct transaction details URLs like `/transactions/:crypto/:txId` are still valid when the details route is the thing being tested

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
