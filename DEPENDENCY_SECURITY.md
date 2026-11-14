# Dependency security policy

The lockfile is the source of truth for dependency review and CI installation. Dependency changes
must keep the following checks green:

- `npm audit signatures`
- `npm audit --omit=dev --audit-level=high`
- `npm audit --audit-level=high`

`.npmrc` sets a seven-day minimum release age for npm dependency resolution. The Security
workflow runs `node scripts/check-dependency-release-age.mjs` before installation to verify
the publication timestamps of the pinned npm version and every version in the lockfile,
including optional dependencies. Dependabot version updates use a cooldown in
`.github/dependabot.yml` that keeps them behind this cutoff.

## Urgent security updates

A patched release can be younger than seven days when an advisory is already public. Dependabot
security updates also ignore the cooldown. Use a reviewed exception for such a version instead of
disabling the check:

1. Install the patched version with `npm install <package>@<version> --min-release-age=0`
2. Add the exact version to `.github/dependency-release-age-exceptions.json` with the advisory
   that makes the update urgent:

   ```json
   [
     {
       "package": "example-package",
       "version": "1.2.3",
       "advisory": "GHSA-xxxx-xxxx-xxxx",
       "reason": "Patched release for an advisory that affects the runtime bundle"
     }
   ]
   ```

3. Explain in the pull request why waiting for the seven-day cutoff is riskier than the fresh release

An exception covers one exact version and requires a GHSA or CVE identifier. It never covers a
version whose publication time cannot be read. The check fails when an exception does not match
a locked version, and it prints a warning once the version is older than seven days. Remove the
entry at that point.

## Remaining advisory

On 2026-11-14, the runtime audit reported two low-severity findings and the full audit reported five.
All findings trace to the same [deepmerge advisory](https://github.com/advisories/GHSA-gcqx-w48m-w2h4).
The runtime uses `deepmerge` for IndexedDB restoration and via `vuex-persist` for Web Storage.
The development path is `vite-plugin-pwa -> workbox-build -> @rollup/plugin-node-resolve -> deepmerge`.
Upstream has no patched release. The npm suggestion to downgrade to 4.1.2 would remove safeguards
added in later releases. Revisit this advisory when upstream publishes a fix or the affected callers
can migrate with state-restore and service-worker regression coverage.

## Security overrides

- `web3-validator` declares Zod 3. The override uses patched Zod 4 to address
  [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5).
  `web3-eth-abi` uses an updated `abitype` with a Zod 4 peer range. Offline Ethereum tests cover
  RPC validation and ABI encoding/decoding. Web3.js passes a refinement metadata callback that
  Zod 4 no longer accepts. Every failed Web3.js format refinement loses the value and format
  details and is reported as a required parameter. Invalid inputs are still rejected. The renderer
  disables Zod JIT, and the strict CSP build removes the eval probe and both compiler entry points.
  Review both overrides and the build transform on upgrades.
- Electron packaging, EditorConfig and ESLint tooling use patched `minimatch` 11 for
  [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249).
  `js-beautify`, `workbox-build` and OpenAPI Generator CLI use patched `glob` 14 for
  [GHSA-3g3m-2fjr-6pw4](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4).
  Remove each override when its parent adopts a patched range
- `get-uri` uses patched `basic-ftp` 6.2.6 for
  [GHSA-5pm8-86m8-9m6r](https://github.com/advisories/GHSA-5pm8-86m8-9m6r) and
  [GHSA-r4jh-29pc-gfqr](https://github.com/advisories/GHSA-r4jh-29pc-gfqr).
  The development-only path is `@openapitools/openapi-generator-cli -> proxy-agent -> pac-proxy-agent -> get-uri`.
  The client methods used by `get-uri` are compatible. Remove the override when `get-uri` adopts a patched range

Dependabot monitors npm and GitHub Actions weekly. CodeQL and dependency review publish findings
through GitHub code scanning, while ESLint's security rules catch unsafe JavaScript patterns before
merge.
