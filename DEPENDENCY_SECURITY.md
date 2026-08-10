# Dependency security policy

The lockfile is the source of truth for dependency review and CI installation. Dependency changes
must keep the following checks green:

- `npm audit signatures`
- `npm audit --omit=dev --audit-level=high`
- `npm audit --audit-level=high`

The runtime dependency tree has no known advisories as of 2026-08-10. The full development tree has
one accepted moderate advisory chain:

- `@capacitor/cli -> xcode -> uuid@7` (`GHSA-w5hq-g745-h8pq`). `xcode` is a development-only iOS
  project editor, while this repository's Capacitor target is Android. The package calls UUID v4;
  the advisory affects caller-provided buffers in UUID v3, v5 and v6. No supported Capacitor 8.5
  release currently removes this transitive version.

This acceptance expires on 2026-11-10 and must be reviewed earlier when Capacitor publishes an
update. A newly introduced high or critical advisory is never covered by this acceptance and is
blocked in CI.

Dependabot monitors npm and GitHub Actions weekly. CodeQL and dependency review publish findings
through GitHub code scanning, while ESLint's security rules catch unsafe JavaScript patterns before
merge.
